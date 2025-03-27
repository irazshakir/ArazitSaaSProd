from django.utils import timezone
import json
import uuid

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
            Lead: Created lead object
        """
        try:
            # Import here to avoid circular imports
            from leads.models import Lead
            from users.models import Tenant
            
            # Get tenant object
            tenant = Tenant.objects.get(id=tenant_id)
            
            # Format name from contact data, or use phone as name
            name = contact_data.get('name', contact_data.get('phone', 'Unknown'))
            phone = contact_data.get('phone', '')
            contact_id = contact_data.get('id')
            
            # Create email from phone number
            email = f"{phone.replace('+', '').replace(' ', '')}@gmail.com"
            
            # Check if lead with this chat_id already exists
            existing_lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
            if existing_lead:
                return existing_lead
            
            # Create lead
            lead = Lead.objects.create(
                id=uuid.uuid4(),
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
            
            return lead
            
        except Exception as e:
            print(f"Lead creation error: {str(e)}")
            raise 