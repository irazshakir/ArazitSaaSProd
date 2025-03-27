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
            messages = client.get_messages(contact_id)
            return Response(messages, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
                # Try to get from localStorage via JavaScript in browser
                tenant_id = request.COOKIES.get('tenant_id')
            
            conversations = client.get_conversations()
            
            # Process each conversation to create/update local records and leads
            if conversations.get('status') == True and 'data' in conversations:
                for conv_data in conversations.get('data', []):
                    if tenant_id:
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
            from users.models import Tenant
            
            # Get the tenant object
            tenant = Tenant.objects.get(id=tenant_id)
            
            contact_id = conv_data.get('id')
            if not contact_id:
                return
                
            # Check if we already have this chat for this tenant
            chat, created = Chat.objects.get_or_create(
                contact_id=contact_id,
                tenant=tenant,
                defaults={
                    'phone': conv_data.get('phone', ''),
                    'name': conv_data.get('name', ''),
                    'avatar': conv_data.get('avatar', ''),
                    'last_message': conv_data.get('last_message', ''),
                    'last_message_time': self._parse_timestamp(conv_data.get('last_reply_at'))
                }
            )
            
            # If chat exists, update its fields
            if not created:
                chat.name = conv_data.get('name', chat.name)
                chat.avatar = conv_data.get('avatar', chat.avatar)
                chat.last_message = conv_data.get('last_message', chat.last_message)
                if conv_data.get('last_reply_at'):
                    chat.last_message_time = self._parse_timestamp(conv_data.get('last_reply_at'))
                chat.save()
            
            # If this is a new chat, create a lead
            if created:
                try:
                    lead = LeadService.create_lead_from_contact(conv_data, tenant_id)
                    # Store lead ID reference
                    chat.lead_id = lead.id
                    chat.save()
                except Exception as lead_error:
                    print(f"Error creating lead: {str(lead_error)}")
        
        except Exception as e:
            print(f"Error processing conversation: {str(e)}")
    
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
