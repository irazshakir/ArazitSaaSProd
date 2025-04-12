from django.utils import timezone
import json
import uuid
import traceback
from django.db.models import Count
from ..models import ChatAssignment, Chat

class LeadService:
    """Service for handling lead creation and management from WhatsApp chats"""
    
    @staticmethod
    def get_next_sales_agent(tenant):
        """
        Get the next sales agent for a lead using round-robin assignment
        
        Args:
            tenant: Tenant object
            
        Returns:
            User: The next sales agent to assign the lead to
        """
        from users.models import User
        
        # Get all active sales agents for this tenant
        sales_agents = User.objects.filter(
            tenant_users__tenant=tenant,
            role='sales_agent',
            is_active=True
        )
        
        if not sales_agents.exists():
            return None
            
        # Implement round-robin: Get the count of leads for each sales agent
        # and assign to the one with the fewest leads
        from leads.models import Lead
        
        # Get all agents with their lead counts
        agent_lead_counts = {}
        
        for agent in sales_agents:
            # Count leads assigned to this agent
            lead_count = Lead.objects.filter(
                tenant=tenant,
                assigned_to_id=agent.id
            ).count()
            
            agent_lead_counts[agent.id] = {
                'agent': agent,
                'lead_count': lead_count
            }
            
        # Find the agent with the minimum lead count
        if agent_lead_counts:
            min_count = float('inf')
            next_agent = None
            
            for agent_data in agent_lead_counts.values():
                if agent_data['lead_count'] < min_count:
                    min_count = agent_data['lead_count']
                    next_agent = agent_data['agent']
                    
            if next_agent:
                return next_agent
        
        # If no agent found by lead count or an error occurred,
        # fallback to the first sales agent
        first_agent = sales_agents.first()
        return first_agent
    
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
            from users.models import Tenant, Department, Branch, User
            
            # Get tenant object
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                return None
            
            # Format name from contact data, or use phone as name
            name = contact_data.get('name', '')
            if not name:
                name = contact_data.get('phone', 'Unknown Contact')
            
            phone = contact_data.get('phone', '')
            contact_id = contact_data.get('id')
            
            if not contact_id:
                return None
                
            if not phone:
                # Use a placeholder phone number
                phone = "0000000000"
            
            # Create email from phone number
            email = f"{phone.replace('+', '').replace(' ', '')}@gmail.com"
            
            # Check if lead with this chat_id already exists
            existing_lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
            if existing_lead:
                return existing_lead
            
            # Handle department - prioritize the passed department_id
            department = None
            
            if department_id:
                try:
                    # Use the provided department_id directly
                    department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    pass
            
            # If no department found, try to find Sales department
            if not department:
                department = Department.objects.filter(
                    tenant=tenant,
                    name__icontains='sales'
                ).first()
            
            # Get the first branch for this tenant as the default branch
            branch = None
            try:
                branch = Branch.objects.filter(tenant=tenant).first()
            except Exception:
                pass
            
            # Get next sales agent to assign using round-robin
            assigned_to = LeadService.get_next_sales_agent(tenant)
            if not assigned_to:
                # Attempt to find any active user from the tenant to use as a fallback
                assigned_to = User.objects.filter(tenant_users__tenant=tenant, is_active=True).first()
            
            # Get a default creator
            created_by = User.objects.filter(
                tenant_users__tenant=tenant,
                is_active=True
            ).first()
            
            if not created_by:
                # Use the first system admin as a last resort
                created_by = User.objects.filter(is_superuser=True).first()
                if not created_by:
                    return None
            
            # Create lead with the required fields
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
                assigned_to_id=assigned_to.id if assigned_to else None,  # Use the ID instead of the object
                created_by_id=created_by.id if created_by else None,   # Use the ID instead of the object
                hajj_package_id=None,
                tenant=tenant,
                department=department,  # Set the department directly
                branch=branch  # Set the default branch
            )
            
            # Create or update chat assignment
            chat_assignment, created = ChatAssignment.objects.get_or_create(
                chat_id=contact_id,
                tenant=tenant,
                defaults={
                    'assigned_to': assigned_to,
                    'is_active': True
                }
            )
            
            # If chat assignment already existed, update the assigned_to if needed
            if not created and assigned_to and chat_assignment.assigned_to != assigned_to:
                chat_assignment.assigned_to = assigned_to
                chat_assignment.save()
            
            # Create or update chat record
            chat, created = Chat.objects.get_or_create(
                contact_id=contact_id,
                tenant=tenant,
                defaults={
                    'phone': phone,
                    'name': name,
                    'lead_id': lead.id,
                    'assignment': chat_assignment
                }
            )
            
            # If chat already existed, update its fields
            if not created:
                chat.name = name
                chat.lead_id = lead.id
                chat.assignment = chat_assignment
                chat.save()
            
            return lead
            
        except Exception as e:
            traceback.print_exc()
            return None 