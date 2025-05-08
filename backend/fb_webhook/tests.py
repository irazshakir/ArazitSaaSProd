from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import uuid
import json
from users.models import Tenant, User
from leads.models import Lead
from .models import FacebookWebhookHistory

class FacebookWebhookTests(TestCase):
    """Tests for the Facebook webhook functionality."""
    
    def setUp(self):
        # Create a tenant
        self.tenant = Tenant.objects.create(
            name="Test Tenant",
            industry="Hajj & Umrah",
            country="Saudi Arabia",
            active=True
        )
        
        # Create a user
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword",
            name="Test User",
            tenant=self.tenant,
            is_active=True
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Sample webhook data
        self.webhook_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone_number": "+123456789",
            "comments": "I'm interested in Hajj packages",
            "preferred_date": "2023-05-15"
        }
    
    def test_webhook_endpoint_creates_lead(self):
        """Test that the webhook endpoint creates a lead."""
        # Get the URL with the tenant ID
        url = reverse('fb_webhook:facebook_webhook', kwargs={'tenant_id': self.tenant.id})
        
        # Send a POST request with webhook data
        response = self.client.post(
            url,
            data=json.dumps(self.webhook_data),
            content_type='application/json'
        )
        
        # Check that the request was successful
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that a lead was created
        self.assertEqual(Lead.objects.count(), 1)
        
        # Check that the lead has the correct data
        lead = Lead.objects.first()
        self.assertEqual(lead.name, "John Doe")
        self.assertEqual(lead.email, "john.doe@example.com")
        self.assertEqual(lead.phone, "+123456789")
        self.assertEqual(lead.source, Lead.SOURCE_FB_FORM)
        
        # Check that webhook history was created
        self.assertEqual(FacebookWebhookHistory.objects.count(), 1)
        webhook_history = FacebookWebhookHistory.objects.first()
        self.assertTrue(webhook_history.processed)
        self.assertTrue(webhook_history.lead_created)
        self.assertEqual(webhook_history.lead_id, lead.id)
    
    def test_invalid_tenant_id(self):
        """Test that an invalid tenant ID returns an error."""
        # Get the URL with a random tenant ID
        url = reverse('fb_webhook:facebook_webhook', kwargs={'tenant_id': uuid.uuid4()})
        
        # Send a POST request with webhook data
        response = self.client.post(
            url,
            data=json.dumps(self.webhook_data),
            content_type='application/json'
        )
        
        # Check that the request failed
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Check that no lead was created
        self.assertEqual(Lead.objects.count(), 0)
    
    def test_webhook_history_list_requires_auth(self):
        """Test that webhook history list requires authentication."""
        # Get the URL
        url = reverse('fb_webhook:facebook_webhook_history_list')
        
        # Send a GET request without authentication
        response = self.client.get(url)
        
        # Check that the request was denied
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate and try again
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        
        # Check that the request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK) 