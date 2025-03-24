from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services.waba_int import OnCloudAPIClient
from .models import Chat, Message

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
            conversations = client.get_conversations()
            return Response(conversations, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
