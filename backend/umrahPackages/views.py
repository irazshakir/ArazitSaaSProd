from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.db import transaction

from users.models import User
from .models import UmrahPackage, UmrahHotel
from .serializers import UmrahPackageSerializer, UmrahHotelSerializer

class UmrahPackageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UmrahPackage model.
    Provides CRUD operations for Umrah Packages.
    """
    queryset = UmrahPackage.objects.all()
    serializer_class = UmrahPackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return a list of all the umrah packages
        for the currently authenticated user's tenant.
        """
        user = self.request.user
        queryset = UmrahPackage.objects.filter(tenant__in=user.tenant_users.values_list('tenant', flat=True))
        
        # Filter by active status if requested
        active_only = self.request.query_params.get('active', None)
        if active_only and active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
            
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date:
            queryset = queryset.filter(departure_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(return_date__lte=end_date)
            
        return queryset
    
    def perform_create(self, serializer):
        """Set the tenant based on the user's primary tenant."""
        user = self.request.user
        # Get the user's tenant where they are the owner or first active tenant
        tenant_user = user.tenant_users.filter(Q(role='owner') | Q(tenant__is_active=True)).first()
        
        if not tenant_user:
            raise ValidationError("User does not belong to any tenant")
            
        serializer.save(tenant=tenant_user.tenant)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Return only active Umrah packages."""
        active_packages = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_packages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def hotels(self, request, pk=None):
        """Return all hotels associated with this Umrah package."""
        package = self.get_object()
        hotels = package.hotels.all()
        serializer = UmrahHotelSerializer(hotels, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_hotel(self, request, pk=None):
        """Add a new hotel to an existing Umrah package."""
        package = self.get_object()
        
        # Validate hotel data
        serializer = UmrahHotelSerializer(data=request.data)
        if serializer.is_valid():
            # Associate the hotel with this package
            serializer.save(umrah_package=package)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a package."""
        package = self.get_object()
        package.is_active = not package.is_active
        package.save()
        
        serializer = self.get_serializer(package)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vehicle_types(self, request):
        """Return available vehicle types when transportation is included."""
        vehicle_types = [
            {"value": choice[0], "label": choice[1]} 
            for choice in UmrahPackage.VEHICLE_TYPE_CHOICES
        ]
        return Response(vehicle_types)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Return basic statistics about packages."""
        user = request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        
        # Get counts
        total_packages = UmrahPackage.objects.filter(tenant__in=tenant_ids).count()
        active_packages = UmrahPackage.objects.filter(tenant__in=tenant_ids, is_active=True).count()
        
        return Response({
            "total": total_packages,
            "active": active_packages,
            "inactive": total_packages - active_packages
        })


class UmrahHotelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UmrahHotel model.
    Provides CRUD operations for hotels associated with Umrah Packages.
    """
    queryset = UmrahHotel.objects.all()
    serializer_class = UmrahHotelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return a list of hotels for umrah packages
        belonging to the currently authenticated user's tenant.
        Optionally filtered by umrah_package_id query parameter.
        """
        user = self.request.user
        queryset = UmrahHotel.objects.filter(
            umrah_package__tenant__in=user.tenant_users.values_list('tenant', flat=True)
        )
        
        # Filter by umrah package if provided
        package_id = self.request.query_params.get('umrah_package_id', None)
        if package_id:
            queryset = queryset.filter(umrah_package_id=package_id)
            
        # Filter by city if provided
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(hotel_city=city)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_city(self, request):
        """Return hotels grouped by city."""
        user = request.user
        tenant_ids = user.tenant_users.values_list('tenant', flat=True)
        
        makkah_hotels = UmrahHotel.objects.filter(
            umrah_package__tenant__in=tenant_ids,
            hotel_city='Makkah'
        )
        
        madinah_hotels = UmrahHotel.objects.filter(
            umrah_package__tenant__in=tenant_ids,
            hotel_city='Madinah'
        )
        
        makkah_serializer = UmrahHotelSerializer(makkah_hotels, many=True)
        madinah_serializer = UmrahHotelSerializer(madinah_hotels, many=True)
        
        return Response({
            "Makkah": makkah_serializer.data,
            "Madinah": madinah_serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def calculate_nights(self, request, pk=None):
        """Calculate number of nights based on check-in and check-out dates."""
        hotel = self.get_object()
        
        if hotel.checkin_date and hotel.checkout_date:
            # Calculate nights
            nights = (hotel.checkout_date - hotel.checkin_date).days
            hotel.no_of_nights = nights if nights > 0 else 0
            hotel.save()
            
            serializer = self.get_serializer(hotel)
            return Response(serializer.data)
            
        return Response(
            {"error": "Both check-in and check-out dates are required to calculate nights"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
