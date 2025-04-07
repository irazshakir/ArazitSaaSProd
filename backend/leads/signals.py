from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Lead
from flights.models import Flight, CostDetail, PassengerDetail
import json
import logging

# Set up logger
logger = logging.getLogger(__name__)

@receiver(post_save, sender=Lead)
def create_or_update_flight(sender, instance, created, **kwargs):
    """
    Signal to create or update flight records when a lead is saved
    """
    try:
        # Only process if the lead is for a flight
        if instance.lead_type == 'flight' and instance.flight:
            logger.info(f"Processing flight data for lead {instance.id}")
            flight_data = instance.flight
            
            # Convert flight_data to dict if it's a string
            if isinstance(flight_data, str):
                try:
                    flight_data = json.loads(flight_data)
                except json.JSONDecodeError:
                    logger.error(f"Error decoding flight data: {flight_data}")
                    return
            
            # Log flight data for debugging
            logger.info(f"Flight data: {flight_data}")
            
            # Get or create the flight record
            flight_obj, created = Flight.objects.update_or_create(
                lead_inquiry=instance,
                defaults={
                    'travelling_from': flight_data.get('travelling_from', ''),
                    'travelling_to': flight_data.get('travelling_to', ''),
                    'travel_date': flight_data.get('travel_date'),
                    'return_date': flight_data.get('return_date'),
                    'pnr': flight_data.get('pnr', ''),
                    'ticket_status': flight_data.get('ticket_status', 'inquiry'),
                    'carrier': flight_data.get('carrier', ''),
                    'passengers': flight_data.get('passengers', {})
                }
            )
            
            logger.info(f"Flight record {'created' if created else 'updated'}: {flight_obj.id}")
            
            # Create or update the cost details
            if 'cost_details' in flight_data and flight_data['cost_details']:
                cost_data = flight_data['cost_details']
                
                # Safety check for numeric values
                adult_price = float(cost_data.get('adult_price', 0) or 0)
                child_price = float(cost_data.get('child_price', 0) or 0)
                infant_price = float(cost_data.get('infant_price', 0) or 0)
                
                adult_count = int(flight_data.get('passengers', {}).get('adult', 0) or 0)
                child_count = int(flight_data.get('passengers', {}).get('child', 0) or 0)
                infant_count = int(flight_data.get('passengers', {}).get('infant', 0) or 0)
                
                total_cost = (adult_count * adult_price) + (child_count * child_price) + (infant_count * infant_price)
                
                # Use total_sell from user input or default to total_cost if not provided
                total_sell = float(cost_data.get('total_sell', total_cost) or total_cost)
                
                # Calculate profit
                total_profit = total_sell - total_cost
                
                cost_obj, cost_created = CostDetail.objects.update_or_create(
                    flight_inquiry=flight_obj,
                    defaults={
                        'adult_price': adult_price,
                        'child_price': child_price,
                        'infant_price': infant_price,
                        'total_cost': total_cost,
                        'total_sell': total_sell,
                        'total_profit': total_profit
                    }
                )
                logger.info(f"Cost details {'created' if cost_created else 'updated'}: {cost_obj.id}")
            
            # Create or update passenger details
            if 'passenger_details' in flight_data and flight_data['passenger_details']:
                # First, remove all existing passenger details for this flight
                PassengerDetail.objects.filter(flight_inquiry=flight_obj).delete()
                
                # Create new passenger details
                for passenger in flight_data['passenger_details']:
                    try:
                        # Skip if missing required fields
                        if not passenger.get('passenger_fname') and not passenger.get('passenger_lname'):
                            logger.warning(f"Skipping passenger with missing name: {passenger}")
                            continue
                            
                        passenger_obj = PassengerDetail.objects.create(
                            flight_inquiry=flight_obj,
                            passenger_fname=passenger.get('passenger_fname', ''),
                            passenger_lname=passenger.get('passenger_lname', ''),
                            passport_no=passenger.get('passport_no', ''),
                            expiry_date=passenger.get('expiry_date')
                        )
                        logger.info(f"Passenger detail created: {passenger_obj.id}")
                    except Exception as e:
                        logger.error(f"Error creating passenger detail: {str(e)}")
                        logger.error(f"Passenger data: {passenger}")
            
            # Update passengers count in flight object if not present
            if not flight_obj.passengers or flight_obj.passengers == {}:
                # Try to get passenger counts from the flight data
                flight_obj.passengers = flight_data.get('passengers', {'adult': 0, 'child': 0, 'infant': 0})
                flight_obj.save()
    except Exception as e:
        logger.error(f"Error in create_or_update_flight signal: {str(e)}")
        # Don't re-raise the exception to prevent form submission failure 