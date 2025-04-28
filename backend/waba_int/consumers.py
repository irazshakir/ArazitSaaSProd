import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist

class WhatsAppConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token and tenant from query string
        query_string = self.scope['query_string'].decode()
        params = dict(param.split('=') for param in query_string.split('&') if param)
        
        token = params.get('token')
        tenant_id = params.get('tenant')
        
        if not token or not tenant_id:
            await self.close()
            return
            
        # Validate token and get user
        try:
            user = await self.get_user_from_token(token)
            if not user:
                await self.close()
                return
                
            # Verify tenant access
            has_access = await self.verify_tenant_access(user, tenant_id)
            if not has_access:
                await self.close()
                return
            
            # Store user and tenant info
            self.user = user
            self.tenant_id = tenant_id
            
            # Create room group names
            self.tenant_group = f'whatsapp_{tenant_id}'
            
            # If user has a specific role, join role-specific group too
            self.user_id = str(user.id)
            self.user_group = f'whatsapp_user_{self.user_id}'
            
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
            
            await self.accept()
            
        except Exception as e:
            print(f"WebSocket connection error: {str(e)}")
            await self.close()
    
    async def disconnect(self, close_code):
        # Leave groups
        if hasattr(self, 'tenant_group'):
            await self.channel_layer.group_discard(
                self.tenant_group,
                self.channel_name
            )
        
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming messages"""
        pass
    
    async def new_message(self, event):
        """Handle new message event"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'data': event['data']
        }))
    
    async def new_chat(self, event):
        """Handle new chat event"""
        await self.send(text_data=json.dumps({
            'type': 'new_chat',
            'data': event['data']
        }))
        
    async def chat_assigned(self, event):
        """Handle chat assignment event"""
        await self.send(text_data=json.dumps({
            'type': 'chat_assigned',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        from users.models import User
        from rest_framework_simplejwt.tokens import AccessToken
        
        try:
            # Decode token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user
            return User.objects.get(id=user_id)
        except Exception:
            return None
    
    @database_sync_to_async
    def verify_tenant_access(self, user, tenant_id):
        try:
            return user.tenant_users.filter(tenant_id=tenant_id).exists()
        except Exception:
            return False
