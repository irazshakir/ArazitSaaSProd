import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist


class LeadConsumer(AsyncWebsocketConsumer):
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
            
            # Add to lead group for this tenant
            self.room_group_name = f'leads_{tenant_id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
        except Exception as e:
            print(f"WebSocket connection error: {str(e)}")
            await self.close()
    
    async def disconnect(self, close_code):
        # Leave lead group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming messages (if needed)"""
        pass
    
    async def lead_update(self, event):
        """Handle lead update event and send to WebSocket"""
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'lead_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        from users.models import User
        from rest_framework_simplejwt.tokens import AccessToken
        """Validate JWT token and return user"""
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
        from users.models import Tenant
        """Verify user has access to the specified tenant"""
        try:
            return user.tenant_users.filter(tenant_id=tenant_id).exists()
        except Exception:
            return False 