from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import TravelPackage, TravelHotel, TravelFlight, TravelTransfer
from .serializers import (
    TravelPackageSerializer,
    TravelHotelSerializer,
    TravelFlightSerializer,
    TravelTransferSerializer
)

# Create your views here.

class TravelPackageViewSet(viewsets.ModelViewSet):
    queryset = TravelPackage.objects.all()
    serializer_class = TravelPackageSerializer
    permission_classes = [IsAuthenticated]

class TravelHotelViewSet(viewsets.ModelViewSet):
    queryset = TravelHotel.objects.all()
    serializer_class = TravelHotelSerializer
    permission_classes = [IsAuthenticated]

class TravelFlightViewSet(viewsets.ModelViewSet):
    queryset = TravelFlight.objects.all()
    serializer_class = TravelFlightSerializer
    permission_classes = [IsAuthenticated]

class TravelTransferViewSet(viewsets.ModelViewSet):
    queryset = TravelTransfer.objects.all()
    serializer_class = TravelTransferSerializer
    permission_classes = [IsAuthenticated]
