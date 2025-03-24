from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .services.waba_int import OnCloudAPIClient
from .models import Chat, Message

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
    def get(self, request, chat_id):
        # Initialize OnCloud client
        client = OnCloudAPIClient()
        
        try:
            # Fetch messages for the chat
            messages = client.get_messages(chat_id)
            return Response(messages, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
