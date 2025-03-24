import requests
from django.conf import settings
from django.core.cache import cache
import json

class OnCloudAPIClient:
    def __init__(self):
        self.base_url = settings.ONCLOUD_API_URL.rstrip('/')
        self.email = settings.ONCLOUD_EMAIL
        self.password = settings.ONCLOUD_PASSWORD
        
    def _get_access_token(self):
        """
        Get access token from OnCloud API or cache
        """
        # Check if token exists in cache
        cached_token = cache.get('oncloud_access_token')
        if cached_token:
            return cached_token

        # If no cached token, authenticate and get new token
        login_url = f"{self.base_url}/api/login"
        
        try:
            # Create form-data as it worked in Postman
            files = {
                'email': (None, self.email),
                'password': (None, self.password)
            }
            
            response = requests.post(login_url, files=files)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status') == True:
                token = response_data.get('token')
                if token:
                    # Cache the token for 23 hours
                    cache.set('oncloud_access_token', token, 23 * 60 * 60)
                    return token
            
            raise Exception(f"Authentication failed: {response_data}")
            
        except Exception as e:
            print(f"OnCloud API Error: {str(e)}")
            raise
    
    def test_connection(self):
        """
        Test the connection to OnCloud API
        """
        try:
            token = self._get_access_token()
            return {
                "success": True,
                "message": "Successfully connected to OnCloud API",
                "token": token,
                "status": "Connected"
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "status": "Failed"
            }

    def get_chats(self, filters=None):
        """Fetch chats from OnCloud API"""
        endpoint = f"{self.base_url}/chats"
        params = filters or {}
        
        response = requests.get(endpoint, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_messages(self, chat_id):
        """Fetch messages for a specific chat"""
        endpoint = f"{self.base_url}/chats/{chat_id}/messages"
        
        response = requests.get(endpoint, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_templates(self):
        """
        Fetch WhatsApp message templates from OnCloud API
        """
        try:
            token = self._get_access_token()
            templates_url = "https://apps.oncloudapi.com/api/wpbox/getTemplates"
            
            # Make GET request with token as query parameter
            print(f"Fetching templates with URL: {templates_url}")
            response = requests.get(
                templates_url,
                params={'token': token}
            )
            
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {response.headers}")
            print(f"Response body: {response.text}")
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch templates: {response.text}")
            
            templates_data = response.json()
            
            if templates_data.get('status') == 'error':
                raise Exception(f"API Error: {templates_data.get('message')}")
                
            return templates_data
            
        except Exception as e:
            print(f"Template fetch error: {str(e)}")
            raise

    def send_template_message(self, data):
        """
        Send a template message via WhatsApp
        
        Args:
            data (dict): Contains:
                - phone: recipient's phone number
                - template_name: name of the template
                - template_language: language code
                - components: array of message components
        """
        try:
            token = self._get_access_token()
            send_url = f"{self.base_url}/api/wpbox/sendtemplatemessage"
            
            # Prepare message data
            message_data = {
                "token": token,
                "phone": data.get("phone"),
                "template_name": data.get("template_name"),
                "template_language": data.get("template_language"),
                "components": data.get("components", [])
            }
            
            # Validate required fields
            required_fields = ["phone", "template_name", "template_language", "components"]
            missing_fields = [field for field in required_fields if not message_data.get(field)]
            
            if missing_fields:
                raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Send POST request
            print(f"Sending template message: {message_data}")  # Debug log
            response = requests.post(
                send_url,
                json=message_data
            )
            
            print(f"Response status: {response.status_code}")  # Debug log
            print(f"Response body: {response.text}")  # Debug log
            
            if response.status_code != 200:
                raise Exception(f"Failed to send template message: {response.text}")
                
            return response.json()
            
        except Exception as e:
            print(f"Template message send error: {str(e)}")
            raise