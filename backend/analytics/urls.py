from django.urls import path
from .views import (
    DashboardStatsView,
    LeadAnalyticsView,
    UserPerformanceView,
    SalesAnalyticsView,
    ConversionFunnelView
)

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('lead-analytics/', LeadAnalyticsView.as_view(), name='lead-analytics'),
    path('user-performance/', UserPerformanceView.as_view(), name='user-performance'),
    path('sales-analytics/', SalesAnalyticsView.as_view(), name='sales-analytics'),
    path('conversion-funnel/', ConversionFunnelView.as_view(), name='conversion-funnel'),
]
