from rest_framework import serializers
from .models import TravelPackage, TravelHotel, TravelFlight, TravelTransfer

class TravelPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelPackage
        fields = '__all__'

class TravelHotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelHotel
        fields = '__all__'

class TravelFlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelFlight
        fields = '__all__'

class TravelTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = TravelTransfer
        fields = '__all__' 