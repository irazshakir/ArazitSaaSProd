from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services.waba_int import OnCloudAPIClient
from .models import Chat, Message, WABASettings, ChatAssignment
from .services.lead_service import LeadService
from rest_framework.decorators import api_view
from django.utils import timezone
from datetime import datetime
import pytz
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import WABASettingsSerializer
from rest_framework import permissions
from rest_framework import serializers
import json
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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
        try:
            tenant_id = request.headers.get('X-Tenant-ID')
            if not tenant_id:
                return Response({
                    'status': 'error',
                    'message': 'Tenant ID is required'
                }, status=400)

            # Check user permission for this chat
            permission_check = self._check_user_permission(request, contact_id, tenant_id)
            if not permission_check['allowed']:
                return Response({
                    'status': 'error',
                    'message': permission_check['message']
                }, status=403)

            # Initialize OnCloud API client
            client = OnCloudAPIClient(tenant_id=tenant_id)
            
            # Get messages from OnCloud API
            messages_data = client.get_messages(contact_id)
            
            # Process and store messages
            processed_data = self._process_messages(contact_id, messages_data, tenant_id)
            
            return Response({
                'status': 'success',
                'data': processed_data
            })

        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)

    def _check_user_permission(self, request, contact_id, tenant_id):
        """Check if user has permission to access this chat"""
        try:
            # Get the user's role
            user = request.user
            if not user.is_authenticated:
                return {'allowed': True, 'message': None}  # Allow for testing
            
            # Get chat assignment
            chat_assignment = ChatAssignment.objects.filter(
                chat_id=contact_id,
                tenant_id=tenant_id
            ).first()
            
            # If no assignment exists, allow access
            if not chat_assignment:
                return {'allowed': True, 'message': None}
            
            # If user is admin or superuser, allow access
            if user.is_superuser or user.role == 'admin':
                return {'allowed': True, 'message': None}
            
            # If chat is assigned to this user, allow access
            if chat_assignment.assigned_to == user:
                return {'allowed': True, 'message': None}
            
            # Otherwise, deny access
            return {
                'allowed': False,
                'message': 'You do not have permission to access this chat'
            }
            
        except Exception as e:
            # Log the error but allow access in case of errors
            print(f"Error checking chat permissions: {str(e)}")
            return {'allowed': True, 'message': None}

    def _process_messages(self, contact_id, messages_data, tenant_id):
        """Process and store messages from the API response"""
        try:
            from users.models import Tenant
            from .models import Chat, Message, ChatAssignment
            
            tenant = Tenant.objects.get(id=tenant_id)
            
            # Get or create chat record
            chat, _ = Chat.objects.get_or_create(
                contact_id=contact_id,
                tenant=tenant,
                defaults={
                    'phone': messages_data.get('phone', ''),
                    'name': messages_data.get('name', '')
                }
            )
            
            # Get chat assignment
            chat_assignment = ChatAssignment.objects.filter(
                chat_id=contact_id,
                tenant=tenant
            ).first()
            
            # Update chat with assignment if it exists
            if chat_assignment and chat.assignment != chat_assignment:
                chat.assignment = chat_assignment
                chat.save()
            
            # Process messages
            processed_messages = []
            latest_message = None
            latest_timestamp = None
            
            for msg in messages_data.get('data', []):
                # Create message record
                message, created = Message.objects.get_or_create(
                    message_id=msg.get('id'),
                    tenant=tenant,
                    defaults={
                        'chat': chat,
                        'text': msg.get('value', ''),
                        'sent_by_contact': msg.get('is_message_by_contact') == 1,
                        'timestamp': msg.get('created_at'),
                        'is_image': msg.get('message_type') == 2,
                        'image_url': msg.get('header_image') if msg.get('message_type') == 2 else None
                    }
                )
                
                # Track latest message
                msg_timestamp = msg.get('created_at')
                if not latest_timestamp or msg_timestamp > latest_timestamp:
                    latest_message = msg
                    latest_timestamp = msg_timestamp
                
                # Add to processed messages
                processed_messages.append({
                    'id': message.id,
                    'value': message.text,
                    'is_message_by_contact': message.sent_by_contact,
                    'created_at': message.timestamp,
                    'message_type': 2 if message.is_image else 1,
                    'header_image': message.image_url
                })
            
            # Update chat with latest message info
            if latest_message:
                chat.last_message = latest_message.get('value', '')
                chat.last_message_time = latest_timestamp
                chat.save()
            
            return processed_messages
            
        except Exception as e:
            print(f"Error processing messages: {str(e)}")
            return messages_data.get('data', [])

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
        """Process a conversation data object and save it to the database"""
        try:
            # Get basic info
            contact_id = conv_data.get('id')
            phone = conv_data.get('phone')
            name = conv_data.get('name')

            # Get or create Chat object
            chat, created = Chat.objects.get_or_create(
                contact_id=contact_id,
                tenant_id=tenant_id,
                defaults={
                    'phone': phone,
                    'name': name
                }
            )

            # Update Chat data
            if not created:
                chat.phone = phone
                chat.name = name

            # Format the data for response
            formatted_data = {
                'id': contact_id,
                'phone': phone,
                'name': name,
                'avatar': chat.avatar,
                'lead_id': str(chat.lead_id) if chat.lead_id else None,
                'resolved_chat': False  # Placeholder for now
            }

            # Get additional data
            if conv_data.get('value'):
                formatted_data['last_message'] = conv_data.get('value')
                chat.last_message = conv_data.get('value')

            if conv_data.get('last_reply_at'):
                formatted_data['last_reply_at'] = conv_data.get('last_reply_at')
                try:
                    chat.last_message_time = self._parse_timestamp(conv_data.get('last_reply_at'))
                except:
                    pass

            if conv_data.get('is_last_message_by_contact'):
                formatted_data['is_last_message_by_contact'] = conv_data.get('is_last_message_by_contact')

            # Save chat updates
            chat.save()

            # Check if this chat is directly assigned to the user through ChatAssignment
            is_assigned_to_user = False
            if hasattr(self.request, 'user') and self.request.user.is_authenticated:
                from .models import ChatAssignment
                is_assigned = ChatAssignment.objects.filter(
                    chat_id=contact_id,
                    tenant_id=tenant_id,
                    assigned_to=self.request.user,
                    is_active=True
                ).exists()
                is_assigned_to_user = is_assigned

            formatted_data['is_assigned_to_user'] = is_assigned_to_user

            return formatted_data
        except Exception as e:
            return None
    
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
        processed_phones = set()  # Track which phone numbers we've already processed
        
        # Pre-process all phone numbers to find existing leads in a single query
        # This avoids race conditions and is more efficient
        all_phones = []
        phone_to_conversation = {}
        
        for conversation in conversations_data:
            phone = conversation.get('phone')
            if phone and phone not in processed_phones:
                all_phones.append(phone)
                phone_to_conversation[phone] = conversation
                processed_phones.add(phone)
        
        # Get all existing leads with these phone numbers
        from leads.models import Lead
        from django.db.models import Q
        
        # Build query to find all leads with matching phones
        lead_query = Q()
        for phone in all_phones:
            lead_query |= Q(phone=phone) | Q(whatsapp=phone)
            
            # Also check for normalized versions of the phone number
            normalized_phone = LeadService.normalize_phone(phone)
            if normalized_phone:
                # Use the phone field to simplify the query
                lead_query |= Q(phone__endswith=normalized_phone[-9:])
        
        # Get all existing leads matching any of these phone criteria
        existing_leads = {}
        if lead_query:
            for lead in Lead.objects.filter(lead_query, tenant_id=tenant_id):
                # Index by normalized phone
                lead_phone = lead.phone or ""
                lead_whatsapp = lead.whatsapp or ""
                
                # Normalize both phone fields
                norm_phone = LeadService.normalize_phone(lead_phone)
                norm_whatsapp = LeadService.normalize_phone(lead_whatsapp)
                
                # Add to existing leads dict by normalized phone
                if norm_phone:
                    existing_leads[norm_phone] = lead
                if norm_whatsapp and norm_whatsapp != norm_phone:
                    existing_leads[norm_whatsapp] = lead
        
        # Now process each conversation with knowledge of all existing leads
        for phone, conversation in phone_to_conversation.items():
            try:
                # Prepare contact data
                contact_data = {
                    'id': conversation.get('id'),
                    'name': conversation.get('name'),
                    'phone': phone
                }
                
                normalized_phone = LeadService.normalize_phone(phone)
                
                # Check if a lead with this normalized phone already exists
                lead_exists = False
                existing_lead = None
                
                if normalized_phone and normalized_phone in existing_leads:
                    lead_exists = True
                    existing_lead = existing_leads[normalized_phone]
                    
                    # Update the existing lead's chat_id if needed
                    if existing_lead.chat_id != contact_data['id']:
                        existing_lead.chat_id = contact_data['id']
                        existing_lead.save()
                        
                        # Ensure chat record is linked
                        chat = Chat.objects.filter(contact_id=contact_data['id'], tenant_id=tenant_id).first()
                        if chat:
                            chat.lead_id = existing_lead.id
                            chat.save()
                            
                if lead_exists:
                    leads_found += 1
                    continue
                
                # If we get here, no matching lead was found, create a new one
                lead = LeadService.create_lead_from_contact(
                    contact_data=contact_data,
                    tenant_id=tenant_id,
                    department_id=sales_department.id if sales_department else None
                )
                
                if lead:
                    leads_created += 1
                    
                    # Store this new lead in our map so we don't create duplicates
                    if normalized_phone:
                        existing_leads[normalized_phone] = lead
                    
                    # Make sure the chat record has the lead_id
                    try:
                        chat = Chat.objects.filter(contact_id=contact_data['id'], tenant_id=tenant_id).first()
                        if chat and not chat.lead_id:
                            chat.lead_id = lead.id
                            chat.save()
                    except Exception as chat_error:
                        pass
                    
            except Exception as e:
                pass
        
        # Check which conversations are directly assigned to the current user
        if request.user.is_authenticated:
            from .models import ChatAssignment, Chat
            
            # Get all conversation IDs
            conv_ids = [str(conv.get('id')) for conv in conversations_data if conv.get('id')]
            
            # Debug: Check if any chats exist with these IDs
            chat_matches = Chat.objects.filter(
                contact_id__in=conv_ids,
                tenant_id=tenant_id
            ).values_list('contact_id', 'id')
            
            chat_id_mapping = {str(contact_id): id for contact_id, id in chat_matches}
            
            # Get chat assignments for this user
            assigned_chats = ChatAssignment.objects.filter(
                assigned_to=request.user,
                tenant_id=tenant_id,
                is_active=True
            ).values_list('chat_id', flat=True)
            
            # Convert assigned_chats to strings for comparison
            assigned_chat_ids = [str(chat_id) for chat_id in assigned_chats]
            
            # Add is_assigned_to_user flag to each conversation
            for conv in conversations_data:
                conv_id = str(conv.get('id')) if conv.get('id') else None
                # Check if this conversation ID is directly assigned
                direct_assigned = conv_id and conv_id in assigned_chat_ids
                # Check if this conversation maps to a chat that is assigned
                mapped_assigned = conv_id and conv_id in chat_id_mapping and str(chat_id_mapping[conv_id]) in assigned_chat_ids
                
                conv['is_assigned_to_user'] = direct_assigned or mapped_assigned
        
        # Apply role-based filtering to conversations based on user role
        filtered_conversations = apply_role_based_filters(request, conversations_data)
        
        return Response({
            'status': 'success',
            'data': filtered_conversations,
            'summary': {
                'total_conversations': len(conversations_data),
                'filtered_conversations': len(filtered_conversations),
                'leads_created': leads_created,
                'leads_found': leads_found,
                'debug_info': {
                    'user_id': request.user.id if request.user.is_authenticated else None,
                    'user_role': request.user.role if request.user.is_authenticated else None,
                    'assigned_chat_ids': list(assigned_chat_ids) if 'assigned_chat_ids' in locals() else [],
                    'conversation_ids': conv_ids[:10] if 'conv_ids' in locals() else [],  # Show first 10 for brevity
                    'chat_mappings': {str(k): str(v) for k, v in chat_id_mapping.items()} if 'chat_id_mapping' in locals() else {}
                }
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
        from .models import Chat, ChatAssignment
        
        # Get tenant ID
        tenant_id = request.data.get('tenant_id') or request.headers.get('X-Tenant-ID')
        
        # Get all conversation ids
        conversation_ids = [str(conv.get('id')) for conv in conversations if conv.get('id')]
        
        # Initialize the set of filtered chat IDs
        filtered_chat_ids = set()
        
        # APPROACH 1: Direct chat assignments to the user
        # First, find any existing Chat objects for these conversation IDs to get their IDs
        chats_mapping = Chat.objects.filter(
            contact_id__in=conversation_ids,
            tenant_id=tenant_id
        ).values_list('contact_id', 'id')

        # Create a mapping from contact_id to id
        contact_to_id_map = {str(contact_id): str(id) for contact_id, id in chats_mapping}

        # Get all chats directly assigned to this user
        chat_assignments = ChatAssignment.objects.filter(
            assigned_to=user,
            tenant_id=tenant_id,
            is_active=True
        ).values_list('chat_id', flat=True)

        # Convert to strings for comparison
        chat_assignment_ids = [str(chat_id) for chat_id in chat_assignments]

        # Add directly assigned chats to filtered list - both by chat_id and contact_id
        filtered_chat_ids.update(chat_assignment_ids)

        # Also add conversation IDs that map to assigned chat IDs
        for conv_id in conversation_ids:
            if conv_id in contact_to_id_map and contact_to_id_map[conv_id] in chat_assignment_ids:
                filtered_chat_ids.add(conv_id)
        
        # APPROACH 2: Lead-based assignments (if we still don't have any matching chats)
        if not filtered_chat_ids:
            # First approach: Get leads with chat_id in the conversation_ids
            leads_queryset = Lead.objects.filter(
                chat_id__in=conversation_ids,
                tenant_id=tenant_id
            )
            
            # Second approach: Get chats directly using the Chat model
            # This is crucial because sometimes the chat_id may not be in the Lead model
            # but the Chat model's lead_id would point to the lead assigned to the user
            
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
            
            # Add chat_ids from leads
            lead_chat_ids = leads_queryset.values_list('chat_id', flat=True)
            filtered_chat_ids.update([str(cid) for cid in lead_chat_ids if cid])
            
            # Also get lead IDs to match with Chat model lead_id
            lead_ids = leads_queryset.values_list('id', flat=True)
            
            # Get conversation_ids from Chats where lead_id is in our filtered leads
            chats_with_filtered_leads = Chat.objects.filter(
                lead_id__in=lead_ids,
                tenant_id=tenant_id
            ).values_list('contact_id', flat=True)
            
            filtered_chat_ids.update([str(cid) for cid in chats_with_filtered_leads if cid])
        
        # Filter conversations based on filtered chat_ids
        filtered_conversations = [
            conv for conv in conversations 
            if str(conv.get('id')) in filtered_chat_ids
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

@api_view(['GET'])
def get_users_for_assignment(request):
    """Get users for a specific tenant for chat assignment dropdown"""
    try:
        # Get tenant ID from request
        tenant_id = request.query_params.get('tenant_id') or request.headers.get('X-Tenant-ID')
        
        if not tenant_id:
            return Response({
                'status': 'error',
                'errMsg': 'Tenant ID is required'
            }, status=400)
        
        # Get users with this tenant
        from users.models import TenantUser, User
        tenant_users = TenantUser.objects.filter(tenant_id=tenant_id).select_related('user')
        
        # Format response
        users_data = []
        for tenant_user in tenant_users:
            user = tenant_user.user
            users_data.append({
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}".strip() or user.email,
                'email': user.email,
                'role': user.role
            })
        
        return Response({
            'status': 'success',
            'data': users_data
        })
    
    except Exception as e:
        return Response({
            'status': 'error',
            'errMsg': str(e)
        }, status=500)

@api_view(['POST'])
def assign_chat_to_user(request):
    """Assign a chat to a specific user"""
    try:
        # Get tenant ID and other required parameters
        tenant_id = request.data.get('tenant_id') or request.headers.get('X-Tenant-ID')
        chat_id = request.data.get('chat_id')
        user_id = request.data.get('user_id')
        
        if not tenant_id or not chat_id or not user_id:
            missing = []
            if not tenant_id: missing.append('tenant_id')
            if not chat_id: missing.append('chat_id')
            if not user_id: missing.append('user_id')
            
            return Response({
                'status': 'error',
                'errMsg': f'Missing required fields: {", ".join(missing)}'
            }, status=400)
        
        # Import needed models
        from .models import Chat, ChatAssignment
        from users.models import User
        
        # Get the user
        try:
            assigned_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'status': 'error',
                'errMsg': 'User not found'
            }, status=404)
        
        # Get the chat
        try:
            chat = Chat.objects.get(contact_id=chat_id, tenant_id=tenant_id)
        except Chat.DoesNotExist:
            # Need to create a new chat entry
            try:
                chat = Chat.objects.create(
                    contact_id=chat_id,
                    tenant_id=tenant_id,
                    phone=request.data.get('phone', ''),
                    name=request.data.get('name', '')
                )
            except Exception as e:
                return Response({
                    'status': 'error',
                    'errMsg': f'Failed to create chat record: {str(e)}'
                }, status=500)
        
        # Check if there's an existing assignment
        chat_assignment = None
        try:
            chat_assignment = ChatAssignment.objects.get(chat_id=chat_id, tenant_id=tenant_id)
            # Update the existing assignment
            chat_assignment.assigned_to = assigned_user
            chat_assignment.is_active = True
            chat_assignment.save()
        except ChatAssignment.DoesNotExist:
            # Create a new assignment
            chat_assignment = ChatAssignment.objects.create(
                chat_id=chat_id,
                tenant_id=tenant_id,
                assigned_to=assigned_user,
                is_active=True
            )
        
        # Update the chat's assignment
        chat.assignment = chat_assignment
        chat.save()
        
        return Response({
            'status': 'success',
            'data': {
                'chat_id': chat_id,
                'user_id': user_id,
                'username': f"{assigned_user.first_name} {assigned_user.last_name}".strip() or assigned_user.email,
                'message': f'Chat assigned to {assigned_user.first_name} {assigned_user.last_name}'.strip()
            }
        })
        
    except Exception as e:
        return Response({
            'status': 'error',
            'errMsg': str(e)
        }, status=500)

# Add a function to broadcast new messages
def broadcast_new_message(tenant_id, message_data, user_id=None):
    channel_layer = get_channel_layer()
    
    # Send to tenant group
    async_to_sync(channel_layer.group_send)(
        f'whatsapp_{tenant_id}',
        {
            'type': 'new_message',
            'data': message_data
        }
    )
    
    # If message is assigned to specific user, also send to user-specific group
    if user_id:
        async_to_sync(channel_layer.group_send)(
            f'whatsapp_user_{user_id}',
            {
                'type': 'new_message',
                'data': message_data
            }
        )

# Add a function to broadcast new chats
def broadcast_new_chat(tenant_id, chat_data):
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f'whatsapp_{tenant_id}',
        {
            'type': 'new_chat',
            'data': chat_data
        }
    )

def handle_webhook(request):
    # Process the webhook data...
    
    # After processing new message
    if is_new_message:
        message_data = {
            'id': message_id,
            'conversation_id': conv_id,
            'sender_name': sender_name,
            'text': message_text,
            'timestamp': timestamp.isoformat(),
            'is_from_me': is_from_me
        }
        
        # Get assigned user ID if any
        assigned_user_id = None
        try:
            chat_assignment = ChatAssignment.objects.get(
                chat_id=conv_id, 
                tenant_id=tenant_id
            )
            if chat_assignment.assigned_to:
                assigned_user_id = str(chat_assignment.assigned_to.id)
        except ChatAssignment.DoesNotExist:
            pass
        
        # Broadcast the new message
        broadcast_new_message(tenant_id, message_data, assigned_user_id)
    
    # After processing new conversation
    if is_new_conversation:
        chat_data = {
            'id': conv_id,
            'name': contact_name or phone,
            'phone': phone,
            'lastMessage': message_text,
            'lastMessageTime': formatted_time,
            'unread': True
        }
        
        # Broadcast the new chat
        broadcast_new_chat(tenant_id, chat_data)
    
    return response
