from django.urls import path
from .views import (
    DashboardStatsView,
    LeadAnalyticsView,
    UserPerformanceView,
    SalesAnalyticsView,
    ConversionFunnelView
)

urlpatterns = [
    path('analytics/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('analytics/lead-analytics/', LeadAnalyticsView.as_view(), name='lead-analytics'),
    path('analytics/user-performance/', UserPerformanceView.as_view(), name='user-performance'),
    path('analytics/sales-analytics/', SalesAnalyticsView.as_view(), name='sales-analytics'),
    path('analytics/conversion-funnel/', ConversionFunnelView.as_view(), name='conversion-funnel'),
]
