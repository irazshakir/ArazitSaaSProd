import requests
from django.conf import settings
from django.core.cache import cache
import json
from ..models import WABASettings
import urllib.parse

class OnCloudAPIClient:
    def __init__(self, tenant_id=None):
        self.tenant_id = tenant_id
        self.base_url = None
        self.email = None
        self.password = None
        
        # If tenant_id is provided, try to get tenant-specific settings
        if tenant_id:
            try:
                waba_settings = WABASettings.objects.get(tenant_id=tenant_id, is_active=True)
                
                self.base_url = waba_settings.api_url.rstrip('/')
                self.email = waba_settings.email
                self.password = waba_settings.password
            except WABASettings.DoesNotExist:
                # No tenant-specific settings found
                raise Exception("No WhatsApp API settings configured for this tenant")
        else:
            # No tenant_id provided
            raise Exception("Tenant ID is required to access WhatsApp API")
        
    def _get_access_token(self):
        """
        Get access token from OnCloud API or cache
        """
        # Create a tenant-specific cache key
        cache_key = f'oncloud_access_token_{self.tenant_id}' if self.tenant_id else 'oncloud_access_token'
        
        # Check if token exists in cache
        cached_token = cache.get(cache_key)
        if cached_token:
            return cached_token

        # If no cached token, authenticate and get new token
        login_url = f"{self.base_url}/api/login"
        
        # Try different authentication formats
        auth_attempts = [
            # Attempt 1: Form data with files
            {
                'files': {
                    'email': (None, self.email),
                    'password': (None, self.password)
                }
            },
            # Attempt 2: JSON data
            {
                'json': {
                    'email': self.email,
                    'password': self.password
                },
                'headers': {'Content-Type': 'application/json'}
            },
            # Attempt 3: Form data
            {
                'data': {
                    'email': self.email,
                    'password': self.password
                }
            },
            # Attempt 4: URL-encoded form data
            {
                'data': urllib.parse.urlencode({
                    'email': self.email,
                    'password': self.password
                }),
                'headers': {'Content-Type': 'application/x-www-form-urlencoded'}
            }
        ]
        
        last_error = None
        for i, attempt in enumerate(auth_attempts, 1):
            try:
                response = requests.post(login_url, **attempt)
                
                response_data = response.json()
                
                if response.status_code == 200 and response_data.get('status') == True:
                    token = response_data.get('token')
                    if token:
                        # Cache the token for 23 hours
                        cache.set(cache_key, token, 23 * 60 * 60)
                        return token
                
                last_error = response_data
            except Exception as e:
                last_error = str(e)
        
        raise Exception(f"Authentication failed: {last_error}")
    
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
    
    def get_messages(self, contact_id):
        """
        Fetch messages for a specific contact from OnCloud API
        
        Args:
            contact_id (int): The ID of the contact to fetch messages for
            
        Returns:
            dict: Response containing messages array with message details
        """
        try:
            token = self._get_access_token()
            messages_url = f"{self.base_url}/api/wpbox/getMessages"
            
            # Prepare request data
            data = {
                'token': token,
                'contact_id': contact_id
            }
            
            # Make POST request
            response = requests.post(messages_url, json=data)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch messages: {response.text}")
            
            messages_data = response.json()
            
            if messages_data.get('status') == 'error':
                raise Exception(f"API Error: {messages_data.get('message')}")
                
            return messages_data
            
        except Exception as e:
            raise

    def get_templates(self):
        """
        Fetch WhatsApp message templates from OnCloud API
        """
        try:
            token = self._get_access_token()
            templates_url = "https://apps.oncloudapi.com/api/wpbox/getTemplates"
            
            # Make GET request with token as query parameter
            response = requests.get(
                templates_url,
                params={'token': token}
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch templates: {response.text}")
            
            templates_data = response.json()
            
            if templates_data.get('status') == 'error':
                raise Exception(f"API Error: {templates_data.get('message')}")
                
            return templates_data
            
        except Exception as e:
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
            response = requests.post(
                send_url,
                json=message_data
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to send template message: {response.text}")
                
            return response.json()
            
        except Exception as e:
            raise

    def get_groups(self, show_contacts=False):
        """
        Fetch WhatsApp groups from OnCloud API
        
        Args:
            show_contacts (bool): Whether to include contacts in the response
        """
        try:
            token = self._get_access_token()
            groups_url = f"{self.base_url}/api/wpbox/getGroups"
            
            # Prepare query parameters
            params = {
                'token': token,
                'showContacts': 'yes' if show_contacts else 'no'
            }
            
            # Make GET request
            response = requests.get(groups_url, params=params)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch groups: {response.text}")
            
            groups_data = response.json()
            
            if groups_data.get('status') == 'error':
                raise Exception(f"API Error: {groups_data.get('message')}")
                
            return groups_data
            
        except Exception as e:
            raise

    def get_contacts(self):
        """
        Fetch contacts from OnCloud API
        
        Returns:
            dict: Response containing contacts array with contact details
        """
        try:
            token = self._get_access_token()
            contacts_url = f"{self.base_url}/api/wpbox/getContacts"
            
            # Prepare query parameters
            params = {
                'token': token
            }
            
            # Make GET request
            response = requests.get(contacts_url, params=params)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch contacts: {response.text}")
            
            contacts_data = response.json()
            
            if contacts_data.get('status') == 'error':
                raise Exception(f"API Error: {contacts_data.get('message')}")
                
            return contacts_data
            
        except Exception as e:
            raise

    def get_single_contact(self, phone=None, contact_id=None):
        """
        Fetch a single contact from OnCloud API
        
        Args:
            phone (str, optional): Phone number of the contact
            contact_id (str, optional): ID of the contact
            
        Returns:
            dict: Response containing contact details
            
        Raises:
            ValueError: If neither phone nor contact_id is provided
        """
        try:
            if not phone and not contact_id:
                raise ValueError("Either phone or contact_id must be provided")
                
            token = self._get_access_token()
            contact_url = f"{self.base_url}/api/wpbox/getSingleContact"
            
            # Prepare query parameters
            params = {
                'token': token
            }
            
            # Add either phone or contact_id to params
            if phone:
                params['phone'] = phone
            if contact_id:
                params['contact_id'] = contact_id
            
            # Make GET request
            response = requests.get(contact_url, params=params)
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch contact: {response.text}")
            
            contact_data = response.json()
            
            if contact_data.get('status') == 'error':
                raise Exception(f"API Error: {contact_data.get('message')}")
                
            return contact_data
            
        except Exception as e:
            raise

    def send_message(self, data):
        """
        Send a custom message via WhatsApp
        
        Args:
            data (dict): Contains:
                - phone: recipient's phone number
                - message: message text
                - buttons (optional): list of button objects
                - header (optional): header text for buttons
                - footer (optional): footer text for buttons
        """
        try:
            token = self._get_access_token()
            send_url = f"{self.base_url}/api/wpbox/sendmessage"
            
            # Prepare message data
            message_data = {
                "token": token,
                "phone": data.get("phone"),
                "message": data.get("message")
            }
            
            # Add optional fields if present
            if data.get("buttons"):
                message_data["buttons"] = data.get("buttons")
                if data.get("header"):
                    message_data["header"] = data.get("header")
                if data.get("footer"):
                    message_data["footer"] = data.get("footer")
            
            # Validate required fields
            required_fields = ["phone", "message"]
            missing_fields = [field for field in required_fields if not message_data.get(field)]
            
            if missing_fields:
                raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Send POST request
            response = requests.post(
                send_url,
                json=message_data
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to send message: {response.text}")
                
            return response.json()
            
        except Exception as e:
            raise

    def send_image_message(self, data):
        """
        Send an image message via WhatsApp
        
        Args:
            data (dict): Contains:
                - phone: recipient's phone number
                - image: image file or URL
                - caption (optional): caption text for the image
        """
        try:
            token = self._get_access_token()
            send_url = f"{self.base_url}/api/wpbox/sendmessage"
            
            # Prepare form data
            files = {
                'token': (None, token),
                'phone': (None, data.get("phone")),
                'image': ('image.jpg', data.get("image"), 'image/jpeg')
            }
            
            # Add caption if provided
            if data.get("caption"):
                files['caption'] = (None, data.get("caption"))
            
            # Validate required fields
            required_fields = ["phone", "image"]
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Send POST request
            response = requests.post(
                send_url,
                files=files
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to send image message: {response.text}")
                
            return response.json()
            
        except Exception as e:
            raise

    def get_conversations(self):
        """
        Fetch conversations from OnCloud API
        
        Returns:
            dict: Response containing conversations array with conversation details
        """
        try:
            token = self._get_access_token()
            conversations_url = f"{self.base_url}/api/wpbox/getConversations/none"
            
            # Prepare request body with token
            data = {
                'token': token
            }
            
            # Make POST request
            response = requests.post(
                conversations_url,
                json=data,
                params={'mobile_api': 'true'}
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to fetch conversations: {response.text}")
            
            conversations_data = response.json()
            
            if conversations_data.get('status') == 'error':
                raise Exception(f"API Error: {conversations_data.get('message')}")
                
            return conversations_data
            
        except Exception as e:
            raise

    def send_message_via_contact(self, data):
        """
        Send a message via contact using OnCloud API
        
        Args:
            data (dict): Contains:
                - phone: recipient's phone number
                - message: message text
                - buttons (optional): list of button objects
                - header (optional): header text for buttons
                - footer (optional): footer text for buttons
        """
        try:
            token = self._get_access_token()
            send_url = "https://apps.oncloudapi.com/api/wpbox/sendmessage"
            
            # Prepare message data
            message_data = {
                "token": token,
                "phone": data.get("phone"),
                "message": data.get("message")
            }
            
            # Add optional fields if present
            if data.get("buttons"):
                message_data["buttons"] = data.get("buttons")
            if data.get("header"):
                message_data["header"] = data.get("header")
            if data.get("footer"):
                message_data["footer"] = data.get("footer")
            
            # Validate required fields
            if not message_data.get("phone") or not message_data.get("message"):
                raise ValueError("Both phone and message are required fields")
            
            # Send POST request
            response = requests.post(
                send_url,
                json=message_data
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to send message: {response.text}")
                
            response_data = response.json()
            if response_data.get('status') == 'error':
                raise Exception(f"API Error: {response_data.get('message')}")
                
            return response_data
            
        except Exception as e:
            raise