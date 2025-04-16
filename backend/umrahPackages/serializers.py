from rest_framework import serializers
from users.serializers import UserSerializer
from .models import UmrahPackage, UmrahHotel

class UmrahHotelSerializer(serializers.ModelSerializer):
    """Serializer for the UmrahHotel model."""
    
    class Meta:
        model = UmrahHotel
        fields = (
            'id', 'umrah_package', 'hotel_name', 'hotel_city',
            'checkin_date', 'checkout_date', 'hotel_star', 
            'hotel_room_type', 'no_of_nights', 'buying_cost', 
            'selling_cost', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class UmrahHotelNestedSerializer(serializers.ModelSerializer):
    """Serializer for UmrahHotel when used as a nested field."""
    
    id = serializers.UUIDField(required=False)
    
    class Meta:
        model = UmrahHotel
        fields = (
            'id', 'hotel_name', 'hotel_city',
            'checkin_date', 'checkout_date', 'hotel_star', 
            'hotel_room_type', 'no_of_nights', 'buying_cost', 
            'selling_cost'
        )


class UmrahPackageSerializer(serializers.ModelSerializer):
    """Serializer for the UmrahPackage model."""
    
    created_by_details = UserSerializer(source='created_by', read_only=True)
    hotels = UmrahHotelNestedSerializer(many=True, required=False)
    
    class Meta:
        model = UmrahPackage
        fields = (
            'id', 'tenant', 'created_by', 'created_by_details',
            'package_name', 'visa', 'transportation', 'vehicle_type', 
            'flight_carrier', 'ziyarat',
            'package_star', 'umrah_days', 'departure_date', 'return_date',
            'total_cost', 'selling_price',
            'tags', 'image', 'hotels',
            'created_at', 'updated_at', 'is_active'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')
    
    def create(self, validated_data):
        # Extract hotels data if present
        hotels_data = validated_data.pop('hotels', [])
        
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        
        # Create the package instance
        umrah_package = UmrahPackage.objects.create(**validated_data)
        
        # Create hotels for this package
        for hotel_data in hotels_data:
            UmrahHotel.objects.create(umrah_package=umrah_package, **hotel_data)
            
        return umrah_package
    
    def update(self, instance, validated_data):
        # Extract hotels data if present
        hotels_data = validated_data.pop('hotels', [])
        
        # Update the package instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle hotel updates
        if hotels_data:
            # Keep track of hotel IDs that should remain
            existing_hotel_ids = set()
            
            # Update or create hotels
            for hotel_data in hotels_data:
                hotel_id = hotel_data.get('id', None)
                
                if hotel_id:
                    # Update existing hotel
                    try:
                        hotel = UmrahHotel.objects.get(id=hotel_id, umrah_package=instance)
                        for attr, value in hotel_data.items():
                            if attr != 'id':
                                setattr(hotel, attr, value)
                        hotel.save()
                        existing_hotel_ids.add(str(hotel.id))
                    except UmrahHotel.DoesNotExist:
                        # If hotel ID doesn't exist, create new one
                        del hotel_data['id']
                        UmrahHotel.objects.create(umrah_package=instance, **hotel_data)
                else:
                    # Create new hotel
                    hotel = UmrahHotel.objects.create(umrah_package=instance, **hotel_data)
                    existing_hotel_ids.add(str(hotel.id))
            
            # Optionally, remove hotels that weren't in the update request
            # This makes the update request fully replace all hotels
            # Comment out if you prefer to keep unmentioned hotels
            instance.hotels.exclude(id__in=existing_hotel_ids).delete()
            
        return instance 