from django.utils import timezone
import json
import uuid
import traceback
from django.db.models import Count

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
            print(f"No active sales agents found for tenant: {tenant.name}")
            return None
            
        # Print the number of sales agents found for debugging
        print(f"Found {sales_agents.count()} active sales agents for tenant: {tenant.name}")
        
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
            
            # Debug info
            print(f"Agent {agent.email} (ID: {agent.id}) has {lead_count} leads")
        
        # Find the agent with the minimum lead count
        if agent_lead_counts:
            min_count = float('inf')
            next_agent = None
            
            for agent_data in agent_lead_counts.values():
                if agent_data['lead_count'] < min_count:
                    min_count = agent_data['lead_count']
                    next_agent = agent_data['agent']
                    
            if next_agent:
                print(f"Selected agent {next_agent.email} (ID: {next_agent.id}) with {min_count} leads")
                return next_agent
        
        # If no agent found by lead count or an error occurred,
        # fallback to the first sales agent
        first_agent = sales_agents.first()
        print(f"Using fallback: Selected first sales agent {first_agent.email} (ID: {first_agent.id})")
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
            
            # Get the first branch for this tenant as the default branch
            branch = None
            try:
                branch = Branch.objects.filter(tenant=tenant).first()
                if branch:
                    print(f"Using default branch: {branch.name} (ID: {branch.id})")
                else:
                    print("WARNING: No branch found for this tenant")
            except Exception as e:
                print(f"Error fetching branch: {str(e)}")
            
            # Get next sales agent to assign using round-robin
            assigned_to = LeadService.get_next_sales_agent(tenant)
            if assigned_to:
                print(f"Assigning lead to sales agent: {assigned_to.email} (ID: {assigned_to.id})")
            else:
                print("WARNING: Could not find a sales agent to assign. Using a default creator.")
                # Attempt to find any active user from the tenant to use as a fallback
                assigned_to = User.objects.filter(tenant_users__tenant=tenant, is_active=True).first()
                if assigned_to:
                    print(f"Using fallback user: {assigned_to.email} (ID: {assigned_to.id})")
                else:
                    print("ERROR: No active users found for this tenant")
            
            # Get a default creator
            created_by = User.objects.filter(
                tenant_users__tenant=tenant,
                is_active=True
            ).first()
            
            if created_by:
                print(f"Using creator: {created_by.email} (ID: {created_by.id})")
            else:
                print("WARNING: No active user found for creator. Using system admin.")
                # Use the first system admin as a last resort
                created_by = User.objects.filter(is_superuser=True).first()
                if not created_by:
                    print("ERROR: No suitable creator found")
                    return None
            
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
                assigned_to_id=assigned_to.id if assigned_to else None,  # Use the ID instead of the object
                created_by_id=created_by.id if created_by else None,   # Use the ID instead of the object
                hajj_package_id=None,
                tenant=tenant,
                department=department,  # Set the department directly
                branch=branch  # Set the default branch
            )
            
            print(f"Lead created successfully with ID: {lead.id} with department_id: {department.id if department else 'None'} and branch_id: {branch.id if branch else 'None'}")
            print(f"Lead assigned to: {assigned_to.email if assigned_to else 'None'}")
            return lead
            
        except Exception as e:
            print(f"Lead creation error: {str(e)}")
            print(f"Error details: {type(e).__name__}")
            print(f"Contact data: {contact_data}")
            print(f"Tenant ID: {tenant_id}")
            print(f"Department ID: {department_id}")
            traceback.print_exc()
            return None 