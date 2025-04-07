from rest_framework import serializers
from .models import Flight, PassengerDetail, CostDetail


class PassengerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassengerDetail
        fields = ['id', 'passenger_fname', 'passenger_lname', 'passport_no', 'expiry_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CostDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostDetail
        fields = ['id', 'adult_price', 'child_price', 'infant_price', 'total_cost', 'total_sell', 'total_profit', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class FlightSerializer(serializers.ModelSerializer):
    passengers_details = PassengerDetailSerializer(source='passenger_details', many=True, read_only=True)
    cost_details = CostDetailSerializer(source='cost_details', many=True, read_only=True)
    
    class Meta:
        model = Flight
        fields = [
            'id', 'travelling_from', 'travelling_to', 'travel_date', 'return_date', 
            'passengers', 'pnr', 'ticket_status', 'carrier', 'created_by', 
            'created_at', 'updated_at', 'passengers_details', 'cost_details'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class FlightCreateSerializer(serializers.ModelSerializer):
    passengers_details = PassengerDetailSerializer(many=True)
    cost_details = CostDetailSerializer(many=True)
    
    class Meta:
        model = Flight
        fields = [
            'travelling_from', 'travelling_to', 'travel_date', 'return_date', 
            'passengers', 'pnr', 'ticket_status', 'carrier', 'passengers_details', 'cost_details'
        ]
    
    def create(self, validated_data):
        passengers_data = validated_data.pop('passengers_details')
        cost_details_data = validated_data.pop('cost_details')
        
        # Create the flight
        flight = Flight.objects.create(**validated_data, created_by=self.context['request'].user)
        
        # Create passenger details
        for passenger_data in passengers_data:
            PassengerDetail.objects.create(flight_inquiry=flight, **passenger_data)
        
        # Create cost details
        for cost_detail_data in cost_details_data:
            CostDetail.objects.create(flight_inquiry=flight, **cost_detail_data)
        
        return flight 