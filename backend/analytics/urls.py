from django.urls import path
from .views import (
    DashboardStatsView,
    LeadAnalyticsView,
    UserPerformanceView,
    SalesAnalyticsView,
    ConversionFunnelView,
    FilterOptionsView,
    MarketingAnalyticsView
)

urlpatterns = [
    path('analytics/dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('analytics/lead-analytics/', LeadAnalyticsView.as_view(), name='lead-analytics'),
    path('analytics/user-performance/', UserPerformanceView.as_view(), name='user-performance'),
    path('analytics/sales-analytics/', SalesAnalyticsView.as_view(), name='sales-analytics'),
    path('analytics/marketing-analytics/', MarketingAnalyticsView.as_view(), name='marketing-analytics'),
    path('analytics/conversion-funnel/', ConversionFunnelView.as_view(), name='conversion-funnel'),
    path('analytics/filter-options/', FilterOptionsView.as_view(), name='filter-options'),
    
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats-direct'),
    path('lead-analytics/', LeadAnalyticsView.as_view(), name='lead-analytics-direct'),
    path('user-performance/', UserPerformanceView.as_view(), name='user-performance-direct'),
    path('sales-analytics/', SalesAnalyticsView.as_view(), name='sales-analytics-direct'),
    path('marketing-analytics/', MarketingAnalyticsView.as_view(), name='marketing-analytics-direct'),
    path('conversion-funnel/', ConversionFunnelView.as_view(), name='conversion-funnel-direct'),
    path('filter-options/', FilterOptionsView.as_view(), name='filter-options-direct'),
]
