from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
import pandas as pd
import io
import uuid
from io import StringIO, BytesIO

from users.models import User, Tenant, Department, TenantUser
from leads.models import Lead

class BulkLeadUploadTest(TestCase):
    def setUp(self):
        # Create a test tenant
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            industry="hajj_umrah",
            is_active=True
        )
        
        # Create a test department
        self.department = Department.objects.create(
            name="Sales Department",
            tenant=self.tenant,
            is_active=True
        )
        
        # Create a test user with admin role
        self.user = User.objects.create_user(
            email="admin@example.com",
            password="password123",
            role="admin",
            department=self.department
        )
        
        # Create tenant user association
        TenantUser.objects.create(
            user=self.user,
            tenant=self.tenant,
            role="admin"
        )
        
        # Create a test sales agent
        self.sales_agent = User.objects.create_user(
            email="sales@example.com",
            password="password123",
            role="sales_agent",
            department=self.department
        )
        
        # Associate the sales agent with the tenant
        TenantUser.objects.create(
            user=self.sales_agent,
            tenant=self.tenant,
            role="member"
        )
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
    def _create_test_csv(self):
        """Create a test CSV file for upload"""
        data = {
            'Name': ['Test User 1', 'Test User 2', 'Test User 3'],
            'Phone': ['1234567890', '0987654321', '5555555555'],
            'Email': ['test1@example.com', 'test2@example.com', 'test3@example.com'],
            'City': ['New York', 'Los Angeles', 'Chicago']
        }
        
        df = pd.DataFrame(data)
        csv_file = BytesIO()
        df.to_csv(csv_file, index=False)
        csv_file.seek(0)
        
        return SimpleUploadedFile("test_leads.csv", csv_file.getvalue(), content_type="text/csv")
    
    def _create_test_excel(self):
        """Create a test Excel file for upload"""
        data = {
            'Name': ['Excel User 1', 'Excel User 2', 'Excel User 3'],
            'Phone': ['9876543210', '1234567890', '5555555555'],
            'Email': ['excel1@example.com', 'excel2@example.com', 'excel3@example.com'],
            'City': ['Seattle', 'Boston', 'Miami']
        }
        
        df = pd.DataFrame(data)
        excel_file = BytesIO()
        df.to_excel(excel_file, index=False)
        excel_file.seek(0)
        
        return SimpleUploadedFile("test_leads.xlsx", excel_file.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    
    def test_bulk_upload_csv(self):
        """Test bulk upload with CSV file"""
        test_file = self._create_test_csv()
        
        # Make the request
        url = reverse('leads-bulk-upload')
        response = self.client.post(
            url,
            {'file': test_file, 'lead_type': 'study_visa'},
            format='multipart',
            QUERY_STRING=f'tenant={self.tenant.id}'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['created_count'], 3)
        
        # Verify leads were created
        leads = Lead.objects.filter(tenant=self.tenant)
        self.assertEqual(leads.count(), 3)
        
        # Check sample lead data
        lead = leads.filter(phone='1234567890').first()
        self.assertIsNotNone(lead)
        self.assertEqual(lead.name, 'Test User 1')
        self.assertEqual(lead.email, 'test1@example.com')
        self.assertEqual(lead.lead_type, 'study_visa')
        self.assertEqual(lead.status, 'new')
        
        # Check assignment
        assigned_leads = leads.filter(assigned_to__isnull=False)
        self.assertTrue(assigned_leads.exists())
    
    def test_bulk_upload_excel(self):
        """Test bulk upload with Excel file"""
        test_file = self._create_test_excel()
        
        # Make the request
        url = reverse('leads-bulk-upload')
        response = self.client.post(
            url,
            {'file': test_file, 'lead_type': 'study_visa'},
            format='multipart',
            QUERY_STRING=f'tenant={self.tenant.id}'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['created_count'], 3)
        
        # Verify leads were created
        leads = Lead.objects.filter(tenant=self.tenant, email__contains='excel')
        self.assertEqual(leads.count(), 3)
    
    def test_invalid_file_format(self):
        """Test upload with invalid file format"""
        invalid_file = SimpleUploadedFile("test.txt", b"invalid data", content_type="text/plain")
        
        # Make the request
        url = reverse('leads-bulk-upload')
        response = self.client.post(
            url,
            {'file': invalid_file, 'lead_type': 'study_visa'},
            format='multipart',
            QUERY_STRING=f'tenant={self.tenant.id}'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertTrue('Unsupported file format' in response.data['error'])
    
    def test_missing_required_columns(self):
        """Test upload with missing required columns"""
        # Create CSV with missing 'name' column
        data = {
            'Phone': ['1234567890', '0987654321'],
            'Email': ['test1@example.com', 'test2@example.com']
        }
        
        df = pd.DataFrame(data)
        csv_file = BytesIO()
        df.to_csv(csv_file, index=False)
        csv_file.seek(0)
        
        test_file = SimpleUploadedFile("missing_cols.csv", csv_file.getvalue(), content_type="text/csv")
        
        # Make the request
        url = reverse('leads-bulk-upload')
        response = self.client.post(
            url,
            {'file': test_file, 'lead_type': 'study_visa'},
            format='multipart',
            QUERY_STRING=f'tenant={self.tenant.id}'
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertTrue('Required columns missing' in response.data['error'])
