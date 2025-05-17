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
from django.db import connection
import logging
import os

# Set up a dedicated logger for lead creation
lead_logger = logging.getLogger('lead_creation')
lead_logger.setLevel(logging.DEBUG)

# Add file handler if not already present
if not lead_logger.handlers:
    # Use the existing debug.log file in backend folder
    log_file = os.path.join('backend', 'debug.log')
    fh = logging.FileHandler(log_file)
    fh.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - LEAD_CREATION - %(levelname)s - %(message)s')
    fh.setFormatter(formatter)
    lead_logger.addHandler(fh)

class LeadService:
    """Service for handling lead creation and management from WhatsApp chats"""
    
    # Lock timeout (30 seconds)
    LOCK_TIMEOUT = 30
    
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
            
        # Log original phone number
        lead_logger.debug(f"Normalizing phone number: {phone_str}")
        
        # Remove all non-digit characters
        digits_only = re.sub(r'[^\d]', '', phone_str)
        
        # Remove leading zeros if present (international code)
        if digits_only.startswith('00'):
            digits_only = digits_only[2:]
        # Remove leading zero if present (after 00 is handled)
        if digits_only.startswith('0'):
            digits_only = digits_only[1:]
            
        # Always take the last 9 digits for comparison
        if len(digits_only) > 9:
            digits_only = digits_only[-9:]
            
        lead_logger.debug(f"Normalized phone number result: {digits_only}")
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
    def _find_existing_lead(contact_id, normalized_phone, tenant):
        """Helper method to find an existing lead by either contact_id or phone"""
        from leads.models import Lead
        
        request_id = str(uuid.uuid4())[:8]  # Generate a unique ID for this request
        lead_logger.info(f"[{request_id}] Searching for existing lead - contact_id: {contact_id}, "
                        f"normalized_phone: {normalized_phone}, tenant: {tenant.id}")
        
        try:
            # First try to find by contact_id
            lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
            if lead:
                lead_logger.info(f"[{request_id}] Found existing lead by chat_id: {lead.id}")
                return lead
            
            # Then try by normalized phone
            if normalized_phone:
                leads = Lead.objects.filter(
                    tenant=tenant
                ).extra(
                    where=[
                        "RIGHT(REGEXP_REPLACE(phone, '[^0-9]', ''), %s) = %s OR "
                        "RIGHT(REGEXP_REPLACE(whatsapp, '[^0-9]', ''), %s) = %s"
                    ],
                    params=[len(normalized_phone), normalized_phone, len(normalized_phone), normalized_phone]
                )
                
                # Log all found leads
                if leads.exists():
                    for found_lead in leads:
                        lead_logger.info(
                            f"[{request_id}] Found lead by phone match - "
                            f"lead_id: {found_lead.id}, "
                            f"phone: {found_lead.phone}, "
                            f"whatsapp: {found_lead.whatsapp}"
                        )
                    
                    lead = leads.first()
                    # Update chat_id if needed
                    if lead.chat_id != contact_id:
                        lead_logger.info(f"[{request_id}] Updating chat_id for lead {lead.id}")
                        lead.chat_id = contact_id
                        lead.save(update_fields=['chat_id'])
                    return lead
            
            lead_logger.info(f"[{request_id}] No existing lead found")
            return None
            
        except Exception as e:
            lead_logger.error(f"[{request_id}] Error in _find_existing_lead: {str(e)}")
            lead_logger.error(traceback.format_exc())
            return None

    @staticmethod
    def _assign_lead_to_agent(lead, tenant):
        """Assign a lead to the next available sales agent"""
        from users.models import User
        
        try:
            # Get all active sales agents
            sales_agents = User.objects.filter(
                tenant_users__tenant=tenant,
                role='sales_agent',
                is_active=True
            )
            
            if not sales_agents.exists():
                return None
            
            # Get agent with least leads
            from leads.models import Lead
            
            agent_lead_counts = {}
            for agent in sales_agents:
                lead_count = Lead.objects.filter(
                    tenant=tenant,
                    assigned_to=agent
                ).count()
                agent_lead_counts[agent.id] = {
                    'agent': agent,
                    'lead_count': lead_count
                }
            
            # Find agent with minimum leads
            min_count = float('inf')
            selected_agent = None
            
            for agent_data in agent_lead_counts.values():
                if agent_data['lead_count'] < min_count:
                    min_count = agent_data['lead_count']
                    selected_agent = agent_data['agent']
            
            if selected_agent:
                lead.assigned_to = selected_agent
                lead.save(update_fields=['assigned_to'])
                
                # Update chat assignment
                chat_assignment = ChatAssignment.objects.filter(
                    chat_id=lead.chat_id,
                    tenant=tenant
                ).first()
                
                if chat_assignment:
                    chat_assignment.assigned_to = selected_agent
                    chat_assignment.save()
                else:
                    ChatAssignment.objects.create(
                        chat_id=lead.chat_id,
                        tenant=tenant,
                        assigned_to=selected_agent,
                        is_active=True
                    )
                
                return selected_agent
            
            return None
            
        except Exception as e:
            print(f"Error in _assign_lead_to_agent: {str(e)}")
            return None

    @staticmethod
    def _create_lead_without_assignment(contact_data, tenant, department_id=None):
        """Create a lead without assigning to any agent"""
        from leads.models import Lead
        from users.models import Department, Branch, User
        
        request_id = str(uuid.uuid4())[:8]
        lead_logger.info(f"[{request_id}] Attempting to create new lead - "
                        f"contact_data: {json.dumps(contact_data)}, tenant: {tenant.id}")
        
        try:
            name = contact_data.get('name', '') or contact_data.get('phone', 'Unknown Contact')
            phone = contact_data.get('phone', '')
            contact_id = contact_data.get('id')
            
            if not contact_id:
                lead_logger.error(f"[{request_id}] No contact_id provided")
                return None
            
            if not phone:
                phone = "0000000000"
            
            normalized_phone = LeadService.normalize_phone(phone)
            
            # Double-check for existing lead before creation
            existing = Lead.objects.filter(
                Q(chat_id=contact_id) | 
                Q(phone__endswith=normalized_phone) | 
                Q(whatsapp__endswith=normalized_phone),
                tenant=tenant
            ).first()
            
            if existing:
                lead_logger.warning(
                    f"[{request_id}] Found existing lead during creation check - "
                    f"lead_id: {existing.id}, phone: {existing.phone}"
                )
                return existing
            
            # Get creator
            created_by = (User.objects.filter(tenant_users__tenant=tenant, is_active=True).first() or 
                         User.objects.filter(is_superuser=True).first())
            
            if not created_by:
                lead_logger.error(f"[{request_id}] No valid creator found")
                return None
            
            # Get department
            department = None
            if department_id:
                try:
                    department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    lead_logger.warning(f"[{request_id}] Department {department_id} not found")
            
            if not department:
                department = Department.objects.filter(
                    tenant=tenant,
                    name__icontains='sales'
                ).first()
            
            # Get branch
            branch = Branch.objects.filter(tenant=tenant).first()
            
            # Create lead with get_or_create to handle race conditions
            lead, created = Lead.objects.get_or_create(
                chat_id=contact_id,
                tenant=tenant,
                defaults={
                    'lead_type': 'hajj_package',
                    'name': name,
                    'email': f"{normalized_phone}@gmail.com",
                    'phone': phone,
                    'whatsapp': phone,
                    'query_for': json.dumps({}),
                    'status': 'new',
                    'source': 'whatsapp',
                    'lead_activity_status': 'active',
                    'last_contacted': timezone.now(),
                    'next_follow_up': timezone.now(),
                    'created_by': created_by,
                    'department': department,
                    'branch': branch
                }
            )
            
            lead_logger.info(
                f"[{request_id}] Lead {'created' if created else 'retrieved'} - "
                f"lead_id: {lead.id}, phone: {lead.phone}, created: {created}"
            )
            
            if not created:
                lead_logger.info(f"[{request_id}] Updating existing lead {lead.id}")
                lead.name = name
                lead.phone = phone
                lead.whatsapp = phone
                lead.save(update_fields=['name', 'phone', 'whatsapp'])
            
            # Create chat record
            chat, chat_created = Chat.objects.get_or_create(
                contact_id=contact_id,
                tenant=tenant,
                defaults={
                    'phone': phone,
                    'name': name,
                    'lead': lead
                }
            )
            
            lead_logger.info(
                f"[{request_id}] Chat record {'created' if chat_created else 'updated'} - "
                f"chat_id: {chat.id}, lead_id: {lead.id}"
            )
            
            return lead
            
        except Exception as e:
            lead_logger.error(f"[{request_id}] Error in _create_lead_without_assignment: {str(e)}")
            lead_logger.error(traceback.format_exc())
            return None

    @staticmethod
    @transaction.atomic
    def create_lead_from_contact(contact_data, tenant_id, department_id=None):
        """
        Create a lead from WhatsApp contact data and assign to an agent
        
        Args:
            contact_data (dict): WhatsApp contact data
            tenant_id (str): Tenant ID of the logged-in user
            department_id (str, optional): Specific department ID to use
            
        Returns:
            Lead: Created lead object or None if creation fails
        """
        request_id = str(uuid.uuid4())[:8]
        lead_logger.info(f"[{request_id}] Starting lead creation process - "
                        f"contact_data: {json.dumps(contact_data)}, tenant_id: {tenant_id}")
        
        try:
            from users.models import Tenant
            
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                lead_logger.error(f"[{request_id}] Tenant {tenant_id} not found")
                return None
            
            phone = contact_data.get('phone', '')
            contact_id = contact_data.get('id')
            
            if not contact_id:
                lead_logger.error(f"[{request_id}] No contact_id provided")
                return None
                
            normalized_phone = LeadService.normalize_phone(phone)
            
            # Create a global lock key
            global_lock_key = f"global_lead_lock:{tenant_id}:{normalized_phone}"
            lead_logger.info(f"[{request_id}] Attempting to acquire lock: {global_lock_key}")
            
            # Try to acquire the global lock
            if not cache.add(global_lock_key, request_id, LeadService.LOCK_TIMEOUT):
                lead_logger.warning(f"[{request_id}] Could not acquire initial lock")
                
                # Check for existing lead
                existing_lead = LeadService._find_existing_lead(contact_id, normalized_phone, tenant)
                if existing_lead:
                    lead_logger.info(f"[{request_id}] Found existing lead while waiting for lock: {existing_lead.id}")
                    return existing_lead
                
                # Wait and try again
                time.sleep(0.5)
                if not cache.add(global_lock_key, request_id, LeadService.LOCK_TIMEOUT):
                    lead_logger.error(f"[{request_id}] Failed to acquire lock after retry")
                    return None
            
            try:
                lead_logger.info(f"[{request_id}] Lock acquired, proceeding with lead creation")
                
                # Check for existing lead under lock
                existing_lead = LeadService._find_existing_lead(contact_id, normalized_phone, tenant)
                if existing_lead:
                    lead_logger.info(f"[{request_id}] Found existing lead under lock: {existing_lead.id}")
                    return existing_lead
                
                # Create new lead
                lead = LeadService._create_lead_without_assignment(contact_data, tenant, department_id)
                if lead:
                    lead_logger.info(f"[{request_id}] Successfully created lead: {lead.id}")
                    
                    # Assign lead to an agent using round-robin
                    assigned_agent = LeadService._assign_lead_to_agent(lead, tenant)
                    if assigned_agent:
                        lead_logger.info(f"[{request_id}] Lead {lead.id} assigned to agent {assigned_agent.id}")
                    else:
                        lead_logger.warning(f"[{request_id}] No agent available for assignment")
                else:
                    lead_logger.error(f"[{request_id}] Failed to create lead")
                
                return lead
                
            finally:
                # Release the lock
                current_lock_value = cache.get(global_lock_key)
                if current_lock_value == request_id:
                    cache.delete(global_lock_key)
                    lead_logger.info(f"[{request_id}] Lock released")
                else:
                    lead_logger.warning(
                        f"[{request_id}] Lock value changed: expected {request_id}, "
                        f"found {current_lock_value}"
                    )
                
        except Exception as e:
            lead_logger.error(f"[{request_id}] Error in create_lead_from_contact: {str(e)}")
            lead_logger.error(traceback.format_exc())
            return None 