from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services.waba_int import OnCloudAPIClient
from .models import Chat, Message
from .services.lead_service import LeadService
from rest_framework.decorators import api_view
from django.utils import timezone
from datetime import datetime
import pytz
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import WABASettings
from .serializers import WABASettingsSerializer
from rest_framework import permissions
from rest_framework import serializers

class GroupView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get(self, request):
        """
        Get all WhatsApp groups
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            # Get showContacts parameter from query string
            show_contacts = request.query_params.get('showContacts', 'no').lower() == 'yes'
            
            groups = client.get_groups(show_contacts=show_contacts)
            return Response(groups, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TemplateView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get(self, request):
        """
        Get all available WhatsApp templates
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            templates = client.get_templates()
            return Response(templates, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """
        Send a template message
        """
        client = OnCloudAPIClient()
        try:
            data = {
                "phone": request.data.get('phone'),
                "template_name": request.data.get('template_name'),
                "template_language": request.data.get('template_language'),
                "components": request.data.get('components', [])
            }
            
            # Validate required fields
            required_fields = ["phone", "template_name", "template_language"]
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return Response(
                    {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = client.send_template_message(data)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatListView(APIView):
    def get(self, request):
        # Get filters from request query params
        filters = request.query_params.dict()
        
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize OnCloud client
        client = OnCloudAPIClient(tenant_id=tenant_id)
        
        try:
            # Fetch chats from OnCloud API
            chats = client.get_chats(filters)
            return Response(chats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatMessageView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def post(self, request, contact_id):
        """
        Get messages for a specific contact
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            # Get tenant ID with the same priority order
            tenant_id = None
            
            # Check request body first
            if request.data and 'tenant_id' in request.data:
                tenant_id = request.data.get('tenant_id')
                
            # If not in body, check headers
            if not tenant_id and 'X-Tenant-ID' in request.headers:
                tenant_id = request.headers.get('X-Tenant-ID')
                
            # If not in headers, check query params
            if not tenant_id and 'tenant_id' in request.query_params:
                tenant_id = request.query_params.get('tenant_id')
            
            # Finally check cookies
            if not tenant_id and 'tenant_id' in request.COOKIES:
                tenant_id = request.COOKIES.get('tenant_id')
            
            # Never use a default tenant
            if not tenant_id:
                pass
            
            # Check if user has permission to access this chat
            if not self._check_user_permission(request, contact_id, tenant_id):
                return Response(
                    {"status": False, "error": "You don't have permission to access this chat"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            messages = client.get_messages(contact_id)
            
            # Only process and store messages if we have a valid tenant_id
            if tenant_id and messages.get('status') == True and 'data' in messages:
                self._process_messages(contact_id, messages.get('data', []), tenant_id)
            
            return Response(messages, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _check_user_permission(self, request, contact_id, tenant_id):
        """
        Check if user has permission to access this chat based on their role
        Similar to the role-based filtering in apply_role_based_filters
        """
        user = request.user
        
        # If user is not authenticated, no permission
        if not user.is_authenticated:
            return False
        
        # Admin users have access to all chats
        if user.role == 'admin':
            return True
        
        try:
            # Import needed models
            from leads.models import Lead
            from django.db.models import Q
            from teams.models import TeamManager, TeamLead, TeamMember
            from .models import Chat
            
            # First check: Get lead via chat_id
            lead_via_chat_id = Lead.objects.filter(
                chat_id=contact_id,
                tenant_id=tenant_id
            ).first()
            
            # Second check: Get the Chat and then find the lead via lead_id
            chat = Chat.objects.filter(
                contact_id=contact_id, 
                tenant_id=tenant_id,
                lead_id__isnull=False
            ).first()
            
            lead = None
            
            # If we found a direct match through chat_id
            if lead_via_chat_id:
                lead = lead_via_chat_id
            # If we found a chat with lead_id reference
            elif chat and chat.lead_id:
                lead = Lead.objects.filter(
                    id=chat.lead_id,
                    tenant_id=tenant_id
                ).first()
            
            # If no lead exists through either method, deny access
            if not lead:
                return False
            
            # Apply role-based permission checking
            if user.role == 'department_head':
                # Department head can access all leads in their department
                if user.department_id and lead.department_id == user.department_id:
                    return True
                    
            elif user.role == 'manager':
                # Manager can access leads for their teams
                if lead.assigned_to_id == user.id:
                    return True
                    
                # Check if lead is assigned to a team lead managed by this manager
                managed_teams = TeamManager.objects.filter(manager=user).values_list('team_id', flat=True)
                team_leads = TeamLead.objects.filter(team_id__in=managed_teams).values_list('team_lead_id', flat=True)
                
                if lead.assigned_to_id in team_leads:
                    return True
                
                # Check if lead is assigned to a team member managed by this manager
                team_members = TeamMember.objects.filter(team_lead__team_lead_id__in=team_leads).values_list('member_id', flat=True)
                
                if lead.assigned_to_id in team_members:
                    return True
                
            elif user.role == 'team_lead':
                # Team lead can access their own leads and leads assigned to their team members
                if lead.assigned_to_id == user.id:
                    return True
                
                # Check if lead is assigned to a team member managed by this team lead
                team_members = TeamMember.objects.filter(team_lead__team_lead=user).values_list('member_id', flat=True)
                
                if lead.assigned_to_id in team_members:
                    return True
                
            else:
                # Regular users can only access their assigned leads
                if lead.assigned_to_id == user.id:
                    return True
            
            # If none of the conditions match, deny access
            return False
            
        except Exception as e:
            # On error, deny access to be safe
            return False
    
    def _process_messages(self, contact_id, messages_data, tenant_id):
        """Process and store messages for a contact"""
        try:
            from users.models import Tenant
            
            # Get the tenant object
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                return
            
            # Get or create chat for this contact
            try:
                chat = Chat.objects.filter(contact_id=contact_id, tenant=tenant).first()
                if not chat:
                    return
                
                # Process each message
                for msg_data in messages_data:
                    message_id = msg_data.get('id')
                    if not message_id:
                        continue
                    
                    # Parse timestamp
                    timestamp = None
                    if msg_data.get('created_at'):
                        try:
                            timestamp = self._parse_timestamp(msg_data.get('created_at'))
                        except Exception:
                            timestamp = timezone.now()
                    else:
                        timestamp = timezone.now()
                    
                    # Determine if message is from contact
                    is_from_contact = msg_data.get('is_message_by_contact', 0) == 1
                    
                    # Determine if message is an image
                    is_image = msg_data.get('message_type', 0) == 2
                    image_url = msg_data.get('header_image', '') if is_image else None
                    
                    # Get message text
                    text = msg_data.get('value', '')
                    
                    # Try to get or create the message
                    try:
                        message, created = Message.objects.get_or_create(
                            chat=chat,
                            message_id=message_id,
                            tenant=tenant,
                            defaults={
                                'text': text,
                                'sent_by_contact': is_from_contact,
                                'timestamp': timestamp,
                                'is_image': is_image,
                                'image_url': image_url
                            }
                        )
                        
                        if created:
                            pass
                        
                    except Exception as message_error:
                        pass
                
            except Exception as chat_error:
                pass
                
        except Exception as e:
            pass

class ContactView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get(self, request):
        """
        Get all WhatsApp contacts
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            contacts = client.get_contacts()
            return Response(contacts, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SingleContactView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get(self, request):
        """
        Get a single contact by phone or contact_id
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            # Get phone or contact_id from query parameters
            phone = request.query_params.get('phone')
            contact_id = request.query_params.get('contact_id')
            
            # Validate that at least one parameter is provided
            if not phone and not contact_id:
                return Response(
                    {"error": "Either phone or contact_id must be provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            contact = client.get_single_contact(phone=phone, contact_id=contact_id)
            return Response(contact, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendMessageView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def post(self, request):
        """
        Send a WhatsApp message
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            data = {
                "phone": request.data.get('phone'),
                "contact_id": request.data.get('contact_id'),
                "message": request.data.get('message'),
                "buttons": request.data.get('buttons', []),
                "header": request.data.get('header'),
                "footer": request.data.get('footer')
            }
            
            # Check if we're sending via contact_id or phone
            if data.get('contact_id'):
                # Send via contact
                result = client.send_message_via_contact(data)
            else:
                # Validate phone number is present for direct message
                if not data.get('phone'):
                    return Response(
                        {"error": "Either phone or contact_id must be provided"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Send direct message
                result = client.send_message(data)
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendImageMessageView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def post(self, request):
        """
        Send a WhatsApp image message
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            # Get the image file from the request
            image_file = request.FILES.get('image')
            if not image_file:
                return Response(
                    {"error": "Image file is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            data = {
                "phone": request.data.get('phone'),
                "image": image_file,
                "caption": request.data.get('caption')
            }
            
            # Validate required fields
            required_fields = ["phone"]
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return Response(
                    {"error": f"Missing required fields: {', '.join(missing_fields)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = client.send_image_message(data)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConversationListView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def post(self, request):
        """
        Get all WhatsApp conversations
        """
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        client = OnCloudAPIClient(tenant_id=tenant_id)
        try:
            # Get tenant ID from request body, headers, or query params (in that order of priority)
            tenant_id = None
            
            # Check request body first
            if request.data and 'tenant_id' in request.data:
                tenant_id = request.data.get('tenant_id')
                
            # If not in body, check headers
            if not tenant_id and 'X-Tenant-ID' in request.headers:
                tenant_id = request.headers.get('X-Tenant-ID')
                
            # If not in headers, check query params
            if not tenant_id and 'tenant_id' in request.query_params:
                tenant_id = request.query_params.get('tenant_id')
            
            # Finally check cookies
            if not tenant_id and 'tenant_id' in request.COOKIES:
                tenant_id = request.COOKIES.get('tenant_id')
            
            # IMPORTANT: Never fallback to default/superadmin tenant
            if not tenant_id:
                pass
            
            conversations = client.get_conversations()
            
            # Process each conversation to create/update local records and leads
            if tenant_id and conversations.get('status') == True and 'data' in conversations:
                for conv_data in conversations.get('data', []):
                    self._process_conversation(conv_data, tenant_id)
            
            return Response(conversations, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _process_conversation(self, conv_data, tenant_id):
        """Process each conversation from the API to store locally and create leads if needed"""
        try:
            from users.models import Tenant, Department
            
            # Debug log
            contact_id = conv_data.get('id')
            
            if not contact_id:
                return
            
            # Get the tenant object
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                return
                
            # Find Sales department for this tenant
            sales_department = None
            try:
                from django.db import models
                
                # Try to find the Sales department
                sales_department = Department.objects.filter(
                    models.Q(name__icontains='sales') | models.Q(name__iexact='sales'),
                    tenant_id=tenant_id
                ).first()
                
                if sales_department:
                    pass
                else:
                    # If no sales department, get any department
                    any_department = Department.objects.filter(tenant_id=tenant_id).first()
                    if any_department:
                        sales_department = any_department
                    else:
                        pass
            except Exception as e:
                pass
            
            # Parse timestamp
            last_message_time = None
            if conv_data.get('last_reply_at'):
                last_message_time = self._parse_timestamp(conv_data.get('last_reply_at'))
            
            # Check if we already have this chat for this tenant
            try:
                chat, created = Chat.objects.get_or_create(
                    contact_id=contact_id,
                    tenant=tenant,
                    defaults={
                        'phone': conv_data.get('phone', ''),
                        'name': conv_data.get('name', ''),
                        'avatar': conv_data.get('avatar', ''),
                        'last_message': conv_data.get('last_message', ''),
                        'last_message_time': last_message_time
                    }
                )
                
                if created:
                    pass
                else:
                    chat.name = conv_data.get('name', chat.name)
                    chat.phone = conv_data.get('phone', chat.phone)
                    chat.avatar = conv_data.get('avatar', chat.avatar)
                    chat.last_message = conv_data.get('last_message', chat.last_message)
                    if last_message_time:
                        chat.last_message_time = last_message_time
                    chat.save()
                
                # Create a lead regardless of whether the chat is new or existing
                try:
                    # Import the lead service
                    from .services.lead_service import LeadService
                    
                    lead = LeadService.create_lead_from_contact(
                        conv_data, 
                        tenant_id, 
                        department_id=sales_department.id if sales_department else None
                    )
                    
                    if lead:
                        chat.lead_id = lead.id
                        chat.save()
                    else:
                        pass
                except Exception as lead_error:
                    pass
            
            except Exception as chat_error:
                pass
        
        except Exception as e:
            pass
    
    def _parse_timestamp(self, timestamp_str):
        """Parse timestamp string to datetime object"""
        if not timestamp_str:
            return None
            
        try:
            # Try different formats
            for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"]:
                try:
                    dt = datetime.strptime(timestamp_str, fmt)
                    # Make timezone-aware if it's naive
                    if dt.tzinfo is None:
                        dt = pytz.UTC.localize(dt)
                    return dt
                except ValueError:
                    continue
                    
            # If all formats fail, return current time
            return timezone.now()
        except Exception:
            return timezone.now()

# Add a new view to get lead info from chat_id directly
class ChatLeadView(APIView):
    """View to get lead data for a WhatsApp chat"""
    
    def get(self, request, contact_id):
        """
        Get lead information for a specific WhatsApp contact
        """
        try:
            # Get tenant ID (similar approach as in ConversationListView)
            tenant_id = (
                request.query_params.get('tenant_id') or 
                request.headers.get('X-Tenant-ID') or
                request.COOKIES.get('tenant_id')
            )
            
            if not tenant_id:
                return Response(
                    {"error": "Tenant ID is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Import tenant model
            from users.models import Tenant
            tenant = Tenant.objects.get(id=tenant_id)
            
            # Find chat by contact_id and tenant
            chat = Chat.objects.filter(contact_id=contact_id, tenant=tenant).first()
            
            if not chat:
                # Try to find lead directly (this might be a new chat not yet stored)
                from leads.models import Lead
                lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
            else:
                # Get lead from chat's lead_id
                if not chat.lead_id:
                    # No lead_id stored, try to find by chat_id
                    from leads.models import Lead
                    lead = Lead.objects.filter(chat_id=contact_id, tenant=tenant).first()
                else:
                    # Get lead using stored lead_id
                    from leads.models import Lead
                    lead = Lead.objects.filter(id=chat.lead_id, tenant=tenant).first()
            
            if not lead:
                return Response(
                    {"error": "No lead found for this contact"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return lead data
            lead_data = {
                "id": lead.id,
                "name": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "lead_type": lead.lead_type,
                "status": lead.status,
                "source": lead.source,
                "lead_activity_status": lead.lead_activity_status,
                "next_follow_up": lead.next_follow_up,
                "assigned_to_id": lead.assigned_to_id,
                "tenant_id": tenant_id
            }
            
            return Response(lead_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateLeadFromChatView(APIView):
    """Explicitly create or update a lead from a WhatsApp chat"""
    
    def post(self, request, contact_id):
        """
        Create or update a lead for a specific WhatsApp contact
        """
        try:
            # Get tenant ID with consistent priority order
            tenant_id = None
            
            # Check request body first
            if request.data and 'tenant_id' in request.data:
                tenant_id = request.data.get('tenant_id')
                
            # If not in body, check headers
            if not tenant_id and 'X-Tenant-ID' in request.headers:
                tenant_id = request.headers.get('X-Tenant-ID')
                
            # If not in headers, check query params
            if not tenant_id and 'tenant_id' in request.query_params:
                tenant_id = request.query_params.get('tenant_id')
            
            # Finally check cookies
            if not tenant_id and 'tenant_id' in request.COOKIES:
                tenant_id = request.COOKIES.get('tenant_id')
            
            if not tenant_id:
                return Response(
                    {"error": "Tenant ID is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate the tenant exists
            from users.models import Tenant
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                return Response(
                    {"error": f"Tenant with ID {tenant_id} not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get chat info from OnCloud API
            client = OnCloudAPIClient()
            
            try:
                # Fetch single contact to get most up-to-date data
                contact_data = client.get_single_contact(contact_id=contact_id)
                
                if contact_data.get('status') != True:
                    return Response(
                        {"error": "Could not fetch contact data from API"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Extract contact data
                contact_info = contact_data.get('data', {})
                
                # Import the lead service
                from .services.lead_service import LeadService
                
                # Create or update lead
                lead = LeadService.create_lead_from_contact(contact_info, tenant_id)
                
                if not lead:
                    return Response(
                        {"error": "Failed to create/update lead"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Get or create chat record
                chat, created = Chat.objects.get_or_create(
                    contact_id=contact_id,
                    tenant=tenant,
                    defaults={
                        'phone': contact_info.get('phone', ''),
                        'name': contact_info.get('name', ''),
                        'avatar': contact_info.get('avatar', ''),
                        'lead_id': lead.id
                    }
                )
                
                if not created:
                    # Update existing chat
                    chat.name = contact_info.get('name', chat.name)
                    chat.phone = contact_info.get('phone', chat.phone)
                    chat.avatar = contact_info.get('avatar', chat.avatar)
                    chat.lead_id = lead.id
                    chat.save()
                
                # Return lead data
                lead_data = {
                    "id": lead.id,
                    "name": lead.name,
                    "email": lead.email,
                    "phone": lead.phone,
                    "lead_type": lead.lead_type,
                    "status": lead.status,
                    "source": lead.source,
                    "lead_activity_status": lead.lead_activity_status,
                    "next_follow_up": lead.next_follow_up,
                    "assigned_to_id": lead.assigned_to_id,
                    "tenant_id": tenant_id
                }
                
                return Response(
                    {
                        "status": "success",
                        "message": "Lead created/updated successfully", 
                        "lead": lead_data
                    }, 
                    status=status.HTTP_200_OK
                )
                
            except Exception as api_error:
                return Response(
                    {"error": f"API error: {str(api_error)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Add this new view to help with debugging
class TenantDebugView(APIView):
    """Helper view for debugging tenant ID issues"""
    
    def post(self, request):
        """Return all possible tenant IDs from the request"""
        try:
            # Gather all possible tenant ID sources
            tenant_data = {
                "from_body": request.data.get('tenant_id') if request.data else None,
                "from_headers": request.headers.get('X-Tenant-ID'),
                "from_query_params": request.query_params.get('tenant_id'),
                "from_cookies": request.COOKIES.get('tenant_id'),
                "current_user": request.user.id if request.user.is_authenticated else None,
                "current_user_tenant": request.user.tenant_id if request.user.is_authenticated and hasattr(request.user, 'tenant_id') else None,
            }
            
            # Also include raw data for inspection
            raw_data = {
                "request.data": dict(request.data) if request.data else None,
                "request.headers": dict(request.headers),
                "request.query_params": dict(request.query_params),
                "request.COOKIES": dict(request.COOKIES)
            }
            
            return Response({
                "tenant_sources": tenant_data,
                "raw_data": raw_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
def get_conversations(request):
    """Fetch conversations from WhatsApp API and create leads for each contact"""
    try:
        # Get tenant ID from request
        tenant_id = request.data.get('tenant_id') or request.headers.get('X-Tenant-ID')
        
        if not tenant_id:
            return Response({
                'status': 'error',
                'errMsg': 'Tenant ID is required'
            }, status=400)
            
        # Initialize OnCloud client
        try:
            client = OnCloudAPIClient(tenant_id=tenant_id)
        except Exception as client_error:
            return Response({
                'status': 'error',
                'errMsg': str(client_error)
            }, status=400)
        
        # Fetch conversations
        try:
            conversations = client.get_conversations()
        except Exception as conv_error:
            return Response({
                'status': 'error',
                'errMsg': str(conv_error)
            }, status=400)
        
        if conversations.get('status') == 'error':
            return Response({
                'status': 'error',
                'errMsg': conversations.get('message', 'Failed to fetch conversations')
            }, status=400)
            
        # Get conversations data
        conversations_data = conversations.get('data', [])
        
        # For each conversation, create a lead if it doesn't exist
        from .services.lead_service import LeadService
        
        # Find the Sales department ID directly
        from users.models import Department
        
        # Get Sales department ID
        sales_department = None
        try:
            from django.db import models
            
            # Try to find the Sales department
            sales_department = Department.objects.filter(
                models.Q(name__icontains='sales') | models.Q(name__iexact='sales'),
                tenant_id=tenant_id
            ).first()
            
            if sales_department:
                pass
            else:
                # If no sales department, get any department
                any_department = Department.objects.filter(tenant_id=tenant_id).first()
                if any_department:
                    sales_department = any_department
                else:
                    pass
        except Exception as e:
            pass
        
        # Process each conversation
        leads_created = 0
        leads_found = 0
        
        for conversation in conversations_data:
            try:
                # Extract contact data
                contact_data = {
                    'id': conversation.get('id'),
                    'name': conversation.get('name'),
                    'phone': conversation.get('phone')
                }
                
                # Check if lead already exists
                from leads.models import Lead
                existing_lead = Lead.objects.filter(
                    chat_id=contact_data['id'], 
                    tenant_id=tenant_id
                ).exists()
                
                # Create lead with department info
                lead = LeadService.create_lead_from_contact(
                    contact_data=contact_data,
                    tenant_id=tenant_id,
                    department_id=sales_department.id if sales_department else None
                )
                
                if lead:
                    if existing_lead:
                        leads_found += 1
                    else:
                        leads_created += 1
                    
                    # Make sure the chat record has the lead_id
                    try:
                        chat = Chat.objects.filter(contact_id=contact_data['id'], tenant_id=tenant_id).first()
                        if chat and not chat.lead_id:
                            chat.lead_id = lead.id
                            chat.save()
                    except Exception as chat_error:
                        pass
                else:
                    pass
                    
            except Exception as e:
                pass
        
        # Apply role-based filtering to conversations based on user role
        filtered_conversations = apply_role_based_filters(request, conversations_data)
        
        return Response({
            'status': 'success',
            'data': filtered_conversations,
            'summary': {
                'total_conversations': len(conversations_data),
                'filtered_conversations': len(filtered_conversations),
                'leads_created': leads_created,
                'leads_found': leads_found
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'errMsg': str(e)
        }, status=500)

def apply_role_based_filters(request, conversations):
    """
    Apply role-based filtering to conversations similar to lead filtering
    Returns filtered conversations based on user's role
    """
    user = request.user
    
    # If user is not authenticated, return empty list
    if not user.is_authenticated:
        return []
    
    # If no conversations, return empty list
    if not conversations:
        return []
    
    # For admin users, return all conversations
    if user.role == 'admin':
        return conversations
    
    try:
        # Import needed models
        from leads.models import Lead
        from django.db.models import Q
        from teams.models import TeamManager, TeamLead, TeamMember
        
        # Get tenant ID
        tenant_id = request.data.get('tenant_id') or request.headers.get('X-Tenant-ID')
        
        # Get all conversation ids
        conversation_ids = [conv.get('id') for conv in conversations if conv.get('id')]
        
        # First approach: Get leads with chat_id in the conversation_ids
        leads_queryset = Lead.objects.filter(
            chat_id__in=conversation_ids,
            tenant_id=tenant_id
        )
        
        # Second approach: Get chats directly using the Chat model
        # This is crucial because sometimes the chat_id may not be in the Lead model
        # but the Chat model's lead_id would point to the lead assigned to the user
        from .models import Chat
        
        # Get all chats that match the conversation IDs
        chats = Chat.objects.filter(
            contact_id__in=conversation_ids,
            tenant_id=tenant_id
        ).exclude(lead_id__isnull=True)
        
        # Get the lead IDs from these chats
        lead_ids_from_chats = [str(chat.lead_id) for chat in chats if chat.lead_id]
        
        # Get leads based on these lead IDs
        leads_from_chats = Lead.objects.filter(
            id__in=lead_ids_from_chats,
            tenant_id=tenant_id
        )
        
        # Combine both querysets
        leads_queryset = (leads_queryset | leads_from_chats).distinct()
        
        # Apply role-based filtering similar to LeadViewSet
        if user.role == 'department_head':
            # Department head sees all leads in their department
            if user.department_id:
                leads_queryset = leads_queryset.filter(department_id=user.department_id)
                
        elif user.role == 'manager':
            # Manager sees leads for their teams
            # First, find teams they manage
            managed_teams = TeamManager.objects.filter(manager=user).values_list('team_id', flat=True)
            
            # Find team leads under those teams
            team_leads = TeamLead.objects.filter(team_id__in=managed_teams).values_list('team_lead_id', flat=True)
            
            # Find team members under those team leads
            team_members = TeamMember.objects.filter(team_lead__team_lead_id__in=team_leads).values_list('member_id', flat=True)
            
            # Return leads assigned to any of these users (or the manager themselves)
            leads_queryset = leads_queryset.filter(
                Q(assigned_to=user) | 
                Q(assigned_to_id__in=team_leads) |
                Q(assigned_to_id__in=team_members)
            )
            
        elif user.role == 'team_lead':
            # Team lead sees leads for their team members
            team_members = TeamMember.objects.filter(team_lead__team_lead=user).values_list('member_id', flat=True)
            
            # Return leads assigned to any of these members (or the team lead themselves)
            leads_queryset = leads_queryset.filter(
                Q(assigned_to=user) | 
                Q(assigned_to_id__in=team_members)
            )
            
        else:
            # Regular users (sales_agent, support_agent, processor) see only their assigned leads
            leads_queryset = leads_queryset.filter(assigned_to=user)
        
        # Get all lead chat_ids and lead IDs
        filtered_chat_ids = set()
        
        # Add chat_ids from leads
        lead_chat_ids = leads_queryset.values_list('chat_id', flat=True)
        filtered_chat_ids.update([cid for cid in lead_chat_ids if cid])
        
        # Also get lead IDs to match with Chat model lead_id
        lead_ids = leads_queryset.values_list('id', flat=True)
        
        # Get conversation_ids from Chats where lead_id is in our filtered leads
        chats_with_filtered_leads = Chat.objects.filter(
            lead_id__in=lead_ids,
            tenant_id=tenant_id
        ).values_list('contact_id', flat=True)
        
        filtered_chat_ids.update(chats_with_filtered_leads)
        
        # Filter conversations based on filtered lead chat_ids
        filtered_conversations = [
            conv for conv in conversations 
            if conv.get('id') in filtered_chat_ids
        ]
        
        return filtered_conversations
    
    except Exception as e:
        # On error, return empty list to be safe
        return []

@api_view(['GET'])
def check_lead_departments(request):
    """Diagnostic endpoint to check lead departments"""
    try:
        from leads.models import Lead
        from users.models import Department
        
        # Get tenant ID
        tenant_id = request.query_params.get('tenant_id')
        if not tenant_id:
            return Response({"error": "tenant_id parameter is required"}, status=400)
        
        # Get all departments for this tenant
        departments = Department.objects.filter(tenant_id=tenant_id)
        dept_info = {str(d.id): d.name for d in departments}
        
        # Get leads for this tenant
        leads = Lead.objects.filter(tenant_id=tenant_id)
        
        # Analyze departments
        leads_by_dept = {}
        for lead in leads:
            dept_id = str(lead.department.id) if lead.department else "None"
            if dept_id not in leads_by_dept:
                leads_by_dept[dept_id] = []
            leads_by_dept[dept_id].append({
                "id": str(lead.id),
                "name": lead.name,
                "source": lead.source
            })
        
        # Prepare response
        response_data = {
            "tenant_id": tenant_id,
            "departments": dept_info,
            "leads_by_department": {
                dept_id: {
                    "name": dept_info.get(dept_id, "Unknown"),
                    "lead_count": len(leads),
                    "leads": leads[:10]  # Just show first 10 leads
                }
                for dept_id, leads in leads_by_dept.items()
            },
            "total_leads": leads.count(),
            "leads_with_department": leads.exclude(department=None).count(),
            "leads_without_department": leads.filter(department=None).count()
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response({"error": str(e)}, status=500)

class WABASettingsViewSet(viewsets.ModelViewSet):
    serializer_class = WABASettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get the user's tenant through TenantUser relationship
        try:
            tenant_user = self.request.user.tenant_users.first()
            if not tenant_user:
                return WABASettings.objects.none()
            
            # Filter by tenant
            return WABASettings.objects.filter(tenant=tenant_user.tenant)
        except Exception as e:
            return WABASettings.objects.none()

    def perform_create(self, serializer):
        # Get the tenant through TenantUser relationship
        tenant_user = self.request.user.tenant_users.first()
        if not tenant_user:
            raise serializers.ValidationError({"tenant": "No tenant found for user."})
        
        serializer.save(tenant=tenant_user.tenant)
