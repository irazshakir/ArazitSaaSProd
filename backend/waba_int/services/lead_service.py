from django.utils import timezone
import json
import uuid
import traceback

class LeadService:
    """Service for handling lead creation and management from WhatsApp chats"""
    
    @staticmethod
    def create_lead_from_contact(contact_data, tenant_id):
        """
        Create a lead from WhatsApp contact data
        
        Args:
            contact_data (dict): WhatsApp contact data
            tenant_id (str): Tenant ID of the logged-in user
            
        Returns:
            Lead: Created lead object or None if creation fails
        """
        try:
            # Import here to avoid circular imports
            from leads.models import Lead
            from users.models import Tenant
            
            # Debug log
            print(f"Creating lead for contact data: {contact_data}")
            print(f"Using tenant_id: {tenant_id}")
            
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
                assigned_to_id=6,  # Default assignment
                created_by_id=3,   # Default creator
                hajj_package_id=None,
                tenant=tenant
            )
            
            print(f"Lead created successfully with ID: {lead.id}")
            return lead
            
        except Exception as e:
            print(f"Lead creation error: {str(e)}")
            traceback.print_exc()
            return None 