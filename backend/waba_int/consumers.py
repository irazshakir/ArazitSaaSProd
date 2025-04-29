import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist

# Set up logger
logger = logging.getLogger('waba_websocket')

class WhatsAppConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token and tenant from query string
        query_string = self.scope['query_string'].decode()
        params = dict(param.split('=') for param in query_string.split('&') if param)
        
        token = params.get('token')
        tenant_id = params.get('tenant')
        
        logger.info(f"WebSocket connect attempt - tenant_id: {tenant_id}, client: {self.scope['client']}")
        
        if not token or not tenant_id:
            logger.warning(f"WebSocket connection rejected - missing token or tenant_id: {params}")
            await self.close()
            return
            
        # Validate token and get user
        try:
            logger.info(f"Validating token for tenant_id: {tenant_id}")
            user = await self.get_user_from_token(token)
            if not user:
                logger.warning(f"WebSocket connection rejected - invalid token for tenant_id: {tenant_id}")
                await self.close()
                return
                
            # Verify tenant access
            logger.info(f"Verifying tenant access for user_id: {user.id}, tenant_id: {tenant_id}")
            has_access = await self.verify_tenant_access(user, tenant_id)
            if not has_access:
                logger.warning(f"WebSocket connection rejected - user_id: {user.id} doesn't have access to tenant_id: {tenant_id}")
                await self.close()
                return
            
            # Store user and tenant info
            self.user = user
            self.tenant_id = tenant_id
            self.user_id = str(user.id)
            
            # Create room group names
            self.tenant_group = f'whatsapp_{tenant_id}'
            self.user_group = f'whatsapp_user_{self.user_id}'
            
            logger.info(f"User authenticated - Adding to groups: tenant_group={self.tenant_group}, user_group={self.user_group}")
            
            # Join tenant group
            await self.channel_layer.group_add(
                self.tenant_group,
                self.channel_name
            )
            
            # Join user-specific group
            await self.channel_layer.group_add(
                self.user_group,
                self.channel_name
            )
            
            logger.info(f"WebSocket connection accepted for user_id: {self.user_id}, tenant_id: {self.tenant_id}")
            await self.accept()
            
        except Exception as e:
            logger.error(f"WebSocket connection error: {str(e)}", exc_info=True)
            await self.close()
    
    async def disconnect(self, close_code):
        # Leave groups
        logger.info(f"WebSocket disconnect - user_id: {getattr(self, 'user_id', 'unknown')}, tenant_id: {getattr(self, 'tenant_id', 'unknown')}, code: {close_code}")
        
        if hasattr(self, 'tenant_group'):
            logger.info(f"Leaving tenant group: {self.tenant_group}")
            await self.channel_layer.group_discard(
                self.tenant_group,
                self.channel_name
            )
        
        if hasattr(self, 'user_group'):
            logger.info(f"Leaving user group: {self.user_group}")
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        logger.info(f"Received WebSocket message from user_id: {getattr(self, 'user_id', 'unknown')}")
        try:
            data = json.loads(text_data)
            logger.info(f"Received data: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            logger.error(f"Received invalid JSON: {text_data}")
    
    async def new_message(self, event):
        """Handle new message event"""
        logger.info(f"Broadcasting new_message event to user_id: {getattr(self, 'user_id', 'unknown')}")
        logger.debug(f"Message data: {json.dumps(event['data'], indent=2)}")
        
        try:
            await self.send(text_data=json.dumps({
                'type': 'new_message',
                'data': event['data']
            }))
            logger.info("Message broadcast successful")
        except Exception as e:
            logger.error(f"Error broadcasting message: {str(e)}", exc_info=True)
    
    async def new_chat(self, event):
        """Handle new chat event"""
        logger.info(f"Broadcasting new_chat event to user_id: {getattr(self, 'user_id', 'unknown')}")
        logger.debug(f"Chat data: {json.dumps(event['data'], indent=2)}")
        
        try:
            await self.send(text_data=json.dumps({
                'type': 'new_chat',
                'data': event['data']
            }))
            logger.info("Chat broadcast successful")
        except Exception as e:
            logger.error(f"Error broadcasting chat: {str(e)}", exc_info=True)
        
    async def chat_assigned(self, event):
        """Handle chat assignment event"""
        logger.info(f"Broadcasting chat_assigned event to user_id: {getattr(self, 'user_id', 'unknown')}")
        logger.debug(f"Assignment data: {json.dumps(event['data'], indent=2)}")
        
        try:
            await self.send(text_data=json.dumps({
                'type': 'chat_assigned',
                'data': event['data']
            }))
            logger.info("Assignment broadcast successful")
        except Exception as e:
            logger.error(f"Error broadcasting assignment: {str(e)}", exc_info=True)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        from users.models import User
        from rest_framework_simplejwt.tokens import AccessToken
        
        try:
            # Decode token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            user = User.objects.get(id=user_id)
            logger.info(f"Token validated for user_id: {user_id}")
            return user
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return None
    
    @database_sync_to_async
    def verify_tenant_access(self, user, tenant_id):
        try:
            has_access = user.tenant_users.filter(tenant_id=tenant_id).exists()
            logger.info(f"Tenant access verification: user_id={user.id}, tenant_id={tenant_id}, has_access={has_access}")
            return has_access
        except Exception as e:
            logger.error(f"Tenant access verification error: {str(e)}")
            return False
