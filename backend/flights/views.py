from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Flight, PassengerDetail, CostDetail
from .serializers import FlightSerializer, FlightCreateSerializer, PassengerDetailSerializer, CostDetailSerializer


class FlightViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return FlightCreateSerializer
        return FlightSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Flight.objects.all()
        return Flight.objects.filter(created_by=user)
    
    @action(detail=True, methods=['get'])
    def passengers(self, request, pk=None):
        flight = self.get_object()
        passengers = PassengerDetail.objects.filter(flight_inquiry=flight)
        serializer = PassengerDetailSerializer(passengers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def cost_details(self, request, pk=None):
        flight = self.get_object()
        cost_details = CostDetail.objects.filter(flight_inquiry=flight)
        serializer = CostDetailSerializer(cost_details, many=True)
        return Response(serializer.data)


class PassengerDetailViewSet(viewsets.ModelViewSet):
    queryset = PassengerDetail.objects.all()
    serializer_class = PassengerDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PassengerDetail.objects.all()
        return PassengerDetail.objects.filter(flight_inquiry__created_by=user)
    
    def create(self, request, *args, **kwargs):
        flight_id = request.data.get('flight_inquiry')
        if not flight_id:
            return Response(
                {"error": "flight_inquiry is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        flight = get_object_or_404(Flight, id=flight_id)
        if not request.user.is_staff and flight.created_by != request.user:
            return Response(
                {"error": "You don't have permission to add passengers to this flight"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)


class CostDetailViewSet(viewsets.ModelViewSet):
    queryset = CostDetail.objects.all()
    serializer_class = CostDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return CostDetail.objects.all()
        return CostDetail.objects.filter(flight_inquiry__created_by=user)
    
    def create(self, request, *args, **kwargs):
        flight_id = request.data.get('flight_inquiry')
        if not flight_id:
            return Response(
                {"error": "flight_inquiry is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        flight = get_object_or_404(Flight, id=flight_id)
        if not request.user.is_staff and flight.created_by != request.user:
            return Response(
                {"error": "You don't have permission to add cost details to this flight"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)
