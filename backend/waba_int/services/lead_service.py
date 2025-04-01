from django.utils import timezone
import json
import uuid
import traceback

class LeadService:
    """Service for handling lead creation and management from WhatsApp chats"""
    
    @staticmethod
    def create_lead_from_contact(contact_data, tenant_id, department_id=None):
        """
        Create a lead from WhatsApp contact data
        
        Args:
            contact_data (dict): WhatsApp contact data
            tenant_id (str): Tenant ID of the logged-in user
            department_id (str, optional): Specific department ID to use
            
        Returns:
            Lead: Created lead object or None if creation fails
        """
        try:
            # Import here to avoid circular imports
            from leads.models import Lead
            from users.models import Tenant, Department
            
            # Debug log
            print(f"Creating lead for contact data: {contact_data}")
            print(f"Using tenant_id: {tenant_id}")
            print(f"Using department_id: {department_id}")
            
            # Get tenant object
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                print(f"Found tenant: {tenant.name}")
            except Tenant.DoesNotExist:
                print(f"ERROR: Tenant with ID {tenant_id} not found")
                return None
            
            # Format name from contact data, or use phone as name
            name = contact_data.get('name', '')
            if not name:
                name = contact_data.get('phone', 'Unknown Contact')
            
            phone = contact_data.get('phone', '')
            contact_id = contact_data.get('id')
            
            if not contact_id:
                print("ERROR: No contact_id provided in contact data")
                return None
                
            if not phone:
                print("WARNING: No phone number provided in contact data")
                # Use a placeholder phone number
                phone = "0000000000"
            
            # Create email from phone number
            email = f"{phone.replace('+', '').replace(' ', '')}@gmail.com"
            
            # Check if lead with this chat_id already exists
            existing_lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
            if existing_lead:
                print(f"Found existing lead: {existing_lead.name} with ID {existing_lead.id}")
                return existing_lead
            
            # Handle department - prioritize the passed department_id
            department = None
            
            if department_id:
                try:
                    # Use the provided department_id directly
                    department = Department.objects.get(id=department_id)
                    print(f"Using provided department: {department.name} (ID: {department.id})")
                except Department.DoesNotExist:
                    print(f"ERROR: Department with ID {department_id} not found")
            
            # If no department found, try to find Sales department
            if not department:
                department = Department.objects.filter(
                    tenant=tenant,
                    name__icontains='sales'
                ).first()
                
                if department:
                    print(f"Using Sales department: {department.name} (ID: {department.id})")
                else:
                    print("WARNING: No Sales department found")
            
            # Create lead with the required fields
            print("Creating new lead...")
            lead = Lead.objects.create(
                lead_type='hajj_package',
                name=name,
                email=email,
                phone=phone,
                whatsapp=phone,
                chat_id=contact_id,  # Store chat_id in Lead
                query_for=json.dumps({}),  # Empty JSONB
                status='new',
                source='whatsapp',
                lead_activity_status='active',
                last_contacted=timezone.now(),
                next_follow_up=timezone.now(),
                assigned_to_id=19,  # Default assignment
                created_by_id=3,   # Default creator
                hajj_package_id=None,
                tenant=tenant,
                department=department  # Set the department directly
            )
            
            print(f"Lead created successfully with ID: {lead.id} with department: {department.id if department else 'None'}")
            return lead
            
        except Exception as e:
            print(f"Lead creation error: {str(e)}")
            print(f"Error details: {type(e).__name__}")
            print(f"Contact data: {contact_data}")
            print(f"Tenant ID: {tenant_id}")
            print(f"Department ID: {department_id}")
            traceback.print_exc()
            return None 