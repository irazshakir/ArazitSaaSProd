from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from .models import LocationRouting
from .serializers import LocationRoutingSerializer, LocationRoutingUpdateSerializer

class LocationRoutingViewSet(viewsets.ModelViewSet):
    serializer_class = LocationRoutingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter queryset by tenant_id from request
        """
        tenant_id = self.request.tenant_id
        return LocationRouting.objects.filter(tenant_id=tenant_id)

    def perform_create(self, serializer):
        """
        Set tenant_id when creating new instance
        """
        serializer.save(tenant_id=self.request.tenant_id)

    @action(detail=True, methods=['post'])
    def update_routing(self, request, pk=None):
        """
        Handle location and user updates for a routing configuration
        """
        instance = self.get_object()
        serializer = LocationRoutingUpdateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        
        with transaction.atomic():
            if action == 'add_location':
                city_name = serializer.validated_data['city_name']
                success = instance.add_location(city_name)
                message = f"City {city_name} {'added' if success else 'already exists'}"
            
            elif action == 'remove_location':
                city_name = serializer.validated_data['city_name']
                success = instance.remove_location(city_name)
                message = f"City {city_name} {'removed' if success else 'not found'}"
            
            elif action == 'add_user':
                user_id = serializer.validated_data['user_id']
                user_name = serializer.validated_data['user_name']
                success = instance.add_user(user_id, user_name)
                message = f"User {user_name} {'added' if success else 'already exists'}"
            
            elif action == 'remove_user':
                user_id = serializer.validated_data['user_id']
                success = instance.remove_user(user_id)
                message = f"User {'removed' if success else 'not found'}"
        
        return Response({
            'success': success,
            'message': message,
            'data': self.serializer_class(instance).data
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def get_next_user(self, request, pk=None):
        """
        Get next available user for lead assignment based on location routing
        """
        instance = self.get_object()
        user_id = instance.get_next_available_user()
        
        if user_id:
            user_data = instance.assigned_users.get(str(user_id))
            return Response({
                'success': True,
                'user_id': user_id,
                'user_data': user_data
            })
        
        return Response({
            'success': False,
            'message': 'No available users found'
        }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def get_by_city(self, request):
        """
        Get routing configuration by city name
        """
        city_name = request.query_params.get('city')
        if not city_name:
            return Response({
                'success': False,
                'message': 'City name is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        city_key = city_name.lower().strip()
        routing = self.get_queryset().filter(locations__has_key=city_key).first()
        
        if routing:
            return Response({
                'success': True,
                'data': self.serializer_class(routing).data
            })
        
        return Response({
            'success': False,
            'message': f'No routing configuration found for city: {city_name}'
        }, status=status.HTTP_404_NOT_FOUND) 