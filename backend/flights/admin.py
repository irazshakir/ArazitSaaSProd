from django.contrib import admin
from .models import Flight, PassengerDetail, CostDetail


@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ('pnr', 'travelling_from', 'travelling_to', 'travel_date', 'ticket_status', 'carrier', 'created_by', 'created_at')
    list_filter = ('ticket_status', 'carrier', 'created_by', 'created_at')
    search_fields = ('pnr', 'travelling_from', 'travelling_to', 'carrier')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PassengerDetail)
class PassengerDetailAdmin(admin.ModelAdmin):
    list_display = ('passenger_fname', 'passenger_lname', 'passport_no', 'expiry_date', 'flight_inquiry', 'created_at')
    list_filter = ('flight_inquiry', 'created_at')
    search_fields = ('passenger_fname', 'passenger_lname', 'passport_no')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CostDetail)
class CostDetailAdmin(admin.ModelAdmin):
    list_display = ('flight_inquiry', 'total_cost', 'total_sell', 'total_profit', 'created_at')
    list_filter = ('flight_inquiry', 'created_at')
    search_fields = ('flight_inquiry__pnr',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
