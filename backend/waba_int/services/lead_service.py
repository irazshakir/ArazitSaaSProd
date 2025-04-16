from django.utils import timezone
import json
import uuid
import traceback
from django.db.models import Count, Q
from ..models import ChatAssignment, Chat
from django.db import transaction
import re
from django.core.cache import cache
import time

class LeadService:
    """Service for handling lead creation and management from WhatsApp chats"""
    
    # Lock timeout (10 seconds)
    LOCK_TIMEOUT = 10
    
    @staticmethod
    def normalize_phone(phone_str):
        """
        Normalize a phone number by removing all non-numeric characters
        and standardizing international prefixes
        
        Args:
            phone_str (str): Phone number to normalize
            
        Returns:
            str: Normalized phone number as digits only
        """
        if not phone_str:
            return ""
            
        # Remove all non-digit characters
        digits_only = re.sub(r'[^\d]', '', phone_str)
        
        # Remove leading zeros if present (international code)
        if digits_only.startswith('00'):
            digits_only = digits_only[2:]
        # Remove leading zero if present (after 00 is handled)
        if digits_only.startswith('0'):
            digits_only = digits_only[1:]
            
        return digits_only
    
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
    @transaction.atomic
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
                
            # STRICT: Normalize phone number for uniqueness check
            normalized_phone = LeadService.normalize_phone(phone)
            
            # Create a lock key based on normalized phone to prevent concurrent lead creation
            lock_key = f"lead_creation_lock:{tenant_id}:{normalized_phone}"
            
            # Try to acquire the lock
            acquired = False
            
            try:
                # Try to get the lock
                acquired = cache.add(lock_key, "locked", LeadService.LOCK_TIMEOUT)
                
                if not acquired:
                    # Wait for a short time and try again
                    time.sleep(0.5)
                    
                    # After waiting, see if an existing lead was created
                    lead = LeadService._find_existing_lead(contact_id, normalized_phone, tenant)
                    if lead:
                        return lead
                    
                    # Otherwise, acquire the lock forcefully
                    cache.set(lock_key, "locked", LeadService.LOCK_TIMEOUT)
                    acquired = True
                
                # Use a transaction for additional safety
                with transaction.atomic():
                    # EXTRA STRICT: First check for any lead with this exact phone number
                    # This additional select_for_update provides a database-level lock
                    existing_leads = Lead.objects.select_for_update().filter(
                        Q(tenant=tenant) & (Q(phone=phone) | Q(whatsapp=phone))
                    )
                    
                    if existing_leads.exists():
                        lead = existing_leads.first()
                        
                        # Update chat_id if needed
                        if lead.chat_id != contact_id:
                            lead.chat_id = contact_id
                            lead.save()
                            
                        # Update related chat record
                        chat = Chat.objects.filter(contact_id=contact_id, tenant=tenant).first()
                        if chat:
                            chat.lead_id = lead.id
                            chat.save()
                        
                        return lead
                    
                    # Then check by chat_id
                    lead_by_chat = Lead.objects.select_for_update().filter(
                        chat_id=contact_id, tenant=tenant
                    ).first()
                    
                    if lead_by_chat:
                        return lead_by_chat
                    
                    # MOST THOROUGH: Check for any lead with sufficiently similar phone number
                    if normalized_phone:
                        # Look for leads where the LAST 9 digits match
                        # This ensures different formatting of the same number matches
                        if len(normalized_phone) >= 9:
                            last_9_digits = normalized_phone[-9:]
                            
                            matching_leads = []
                            
                            # This complex query checks for leads with phone numbers ending with the same digits
                            all_leads = Lead.objects.select_for_update().filter(tenant=tenant)
                            
                            for lead in all_leads:
                                # Check both phone fields
                                lead_phone_norm = LeadService.normalize_phone(lead.phone)
                                lead_whatsapp_norm = LeadService.normalize_phone(lead.whatsapp)
                                
                                # Match by last 9 digits
                                if (lead_phone_norm and lead_phone_norm.endswith(last_9_digits)) or \
                                   (lead_whatsapp_norm and lead_whatsapp_norm.endswith(last_9_digits)):
                                    matching_leads.append(lead)
                            
                            if matching_leads:
                                lead = matching_leads[0]
                                
                                # Update with the current contact_id
                                if lead.chat_id != contact_id:
                                    lead.chat_id = contact_id
                                    lead.save()
                                
                                return lead
                    
                    # If we get here, no existing lead was found, create a new one
                    # Create email from normalized phone number
                    email = f"{normalized_phone}@gmail.com"
                    
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
                            'assigned_to_id': assigned_to.id if assigned_to else None,
                            'is_active': True
                        }
                    )
                    
                    # If chat assignment already existed, update the assigned_to if needed
                    if not created and assigned_to and chat_assignment.assigned_to_id != assigned_to.id:
                        chat_assignment.assigned_to_id = assigned_to.id
                        chat_assignment.save()
                    
                    # CRITICAL: Check again for existing chat to avoid duplicate
                    existing_chat = Chat.objects.filter(contact_id=contact_id, tenant=tenant).first()
                    
                    if existing_chat:
                        # If chat exists but lead_id doesn't match, update it
                        if existing_chat.lead_id != lead.id:
                            existing_chat.lead_id = lead.id
                            existing_chat.name = name
                            existing_chat.assignment = chat_assignment
                            existing_chat.save()
                    else:
                        # Create new chat record
                        Chat.objects.create(
                            contact_id=contact_id,
                            tenant=tenant,
                            phone=phone,
                            name=name,
                            lead_id=lead.id,
                            assignment=chat_assignment
                        )
                    
                    return lead
            finally:
                # Ensure the lock is released even if an exception occurs
                if acquired:
                    cache.delete(lock_key)
                
        except Exception as e:
            traceback.print_exc()
            return None
    
    @staticmethod
    def _find_existing_lead(contact_id, normalized_phone, tenant):
        """Helper method to find an existing lead by either contact_id or phone"""
        from leads.models import Lead
        
        # Look first by contact_id
        lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
        if lead:
            return lead
            
        # Then try by exact phone match
        leads_by_phone = Lead.objects.filter(
            Q(tenant=tenant) & 
            (Q(phone__iendswith=normalized_phone) | Q(whatsapp__iendswith=normalized_phone))
        )
        
        if leads_by_phone.exists():
            return leads_by_phone.first()
            
        # Finally, check by normalized phone number
        if normalized_phone and len(normalized_phone) >= 9:
            # Match by last 9 digits for reliable matching regardless of prefix format
            last_9_digits = normalized_phone[-9:]
            
            for lead in Lead.objects.filter(tenant=tenant):
                lead_phone_norm = LeadService.normalize_phone(lead.phone)
                lead_whatsapp_norm = LeadService.normalize_phone(lead.whatsapp)
                
                if (lead_phone_norm and lead_phone_norm.endswith(last_9_digits)) or \
                   (lead_whatsapp_norm and lead_whatsapp_norm.endswith(last_9_digits)):
                    return lead
        
        return None 