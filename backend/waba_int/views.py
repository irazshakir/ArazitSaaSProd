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

class GroupView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get(self, request):
        """
        Get all WhatsApp groups
        """
        client = OnCloudAPIClient()
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
        client = OnCloudAPIClient()
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
        
        # Initialize OnCloud client
        client = OnCloudAPIClient()
        
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
        client = OnCloudAPIClient()
        try:
            # Get tenant ID
            tenant_id = (
                request.data.get('tenant_id') or 
                request.query_params.get('tenant_id') or 
                request.headers.get('X-Tenant-ID') or
                request.COOKIES.get('tenant_id')
            )
            
            # If no tenant_id but in debug mode, use first tenant
            if not tenant_id and settings.DEBUG:
                from users.models import Tenant
                default_tenant = Tenant.objects.first()
                if default_tenant:
                    tenant_id = default_tenant.id
            
            # Fetch messages from API
            messages_response = client.get_messages(contact_id)
            
            # Process and store messages if we have tenant_id
            if tenant_id and messages_response.get('status') == True:
                self._process_messages(contact_id, messages_response.get('data', []), tenant_id)
            
            return Response(messages_response, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"ChatMessageView error: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _process_messages(self, contact_id, messages_data, tenant_id):
        """Process and store messages for a contact"""
        try:
            from users.models import Tenant
            
            # Get the tenant object
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                print(f"ERROR: Tenant with ID {tenant_id} not found")
                return
            
            # Get or create chat for this contact
            try:
                chat = Chat.objects.filter(contact_id=contact_id, tenant=tenant).first()
                if not chat:
                    print(f"WARNING: Chat not found for contact_id {contact_id}")
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
                            print(f"Stored new message: {message_id}")
                        
                    except Exception as message_error:
                        print(f"Error storing message {message_id}: {str(message_error)}")
                
            except Exception as chat_error:
                print(f"Error processing messages for chat: {str(chat_error)}")
                
        except Exception as e:
            print(f"Error processing messages: {str(e)}")

class ContactView(APIView):
    permission_classes = [AllowAny]  # Allow unauthenticated access for testing
    
    def get(self, request):
        """
        Get all WhatsApp contacts
        """
        client = OnCloudAPIClient()
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
        client = OnCloudAPIClient()
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
        client = OnCloudAPIClient()
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
        client = OnCloudAPIClient()
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
        client = OnCloudAPIClient()
        try:
            # Get tenant ID from request data, query params, or headers
            tenant_id = (
                request.data.get('tenant_id') or 
                request.query_params.get('tenant_id') or 
                request.headers.get('X-Tenant-ID')
            )
            
            if not tenant_id:
                # Try to get from localStorage via JavaScript
                tenant_id = request.COOKIES.get('tenant_id')
                
                # If still not found, use a default for testing
                if not tenant_id and settings.DEBUG:
                    from users.models import Tenant
                    default_tenant = Tenant.objects.first()
                    if default_tenant:
                        tenant_id = default_tenant.id
                        print(f"Using default tenant ID: {tenant_id}")
            
            # Log the tenant_id for debugging
            print(f"Processing conversations for tenant_id: {tenant_id}")
            
            # Get conversations from API
            conversations = client.get_conversations()
            
            # Process conversations if we have a valid tenant_id
            if tenant_id and conversations.get('status') == True and 'data' in conversations:
                conversation_count = len(conversations.get('data', []))
                print(f"Found {conversation_count} conversations to process")
                
                for conv_data in conversations.get('data', []):
                    # Process each conversation
                    self._process_conversation(conv_data, tenant_id)
            elif not tenant_id:
                print("WARNING: No tenant_id found, skipping conversation processing")
            
            return Response(conversations, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"ConversationListView error: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _process_conversation(self, conv_data, tenant_id):
        """Process each conversation from the API to store locally and create leads if needed"""
        try:
            from users.models import Tenant
            
            # Debug log
            contact_id = conv_data.get('id')
            print(f"Processing conversation for contact_id: {contact_id}")
            
            if not contact_id:
                print("WARNING: No contact_id found in conversation data")
                return
            
            # Get the tenant object
            try:
                tenant = Tenant.objects.get(id=tenant_id)
                print(f"Found tenant: {tenant.name}")
            except Tenant.DoesNotExist:
                print(f"ERROR: Tenant with ID {tenant_id} not found")
                return
                
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
                    print(f"Created new chat for contact: {chat.name or chat.phone}")
                else:
                    print(f"Updated existing chat for contact: {chat.name or chat.phone}")
                
                # If chat exists, update its fields
                if not created:
                    chat.name = conv_data.get('name', chat.name)
                    chat.phone = conv_data.get('phone', chat.phone)
                    chat.avatar = conv_data.get('avatar', chat.avatar)
                    chat.last_message = conv_data.get('last_message', chat.last_message)
                    if last_message_time:
                        chat.last_message_time = last_message_time
                    chat.save()
                
                # If this is a new chat, create a lead
                if created:
                    try:
                        # Import the lead service
                        from .services.lead_service import LeadService
                        
                        print(f"Creating lead for new chat: {chat.name or chat.phone}")
                        lead = LeadService.create_lead_from_contact(conv_data, tenant_id)
                        
                        if lead:
                            print(f"Lead created successfully with ID: {lead.id}")
                            # Store lead ID reference
                            chat.lead_id = lead.id
                            chat.save()
                        else:
                            print("WARNING: Lead service returned None")
                    except Exception as lead_error:
                        print(f"Error creating lead: {str(lead_error)}")
                        import traceback
                        traceback.print_exc()
            
            except Exception as chat_error:
                print(f"Error creating/updating chat: {str(chat_error)}")
                import traceback
                traceback.print_exc()
        
        except Exception as e:
            print(f"Error processing conversation: {str(e)}")
            import traceback
            traceback.print_exc()
    
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
            # Get tenant ID
            tenant_id = (
                request.data.get('tenant_id') or 
                request.query_params.get('tenant_id') or 
                request.headers.get('X-Tenant-ID') or
                request.COOKIES.get('tenant_id')
            )
            
            if not tenant_id:
                return Response(
                    {"error": "Tenant ID is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Find chat by contact_id
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
