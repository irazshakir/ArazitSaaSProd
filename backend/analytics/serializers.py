from rest_framework import serializers
from leads.models import Lead
from users.models import User

class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics data
    """
    # Stats
    new_inquiries = serializers.IntegerField()
    active_inquiries = serializers.IntegerField()
    close_to_sales = serializers.IntegerField()
    sales = serializers.IntegerField()
    overdue = serializers.IntegerField()
    
    # Trends (percentage change)
    new_inquiries_trend = serializers.FloatField()
    active_inquiries_trend = serializers.FloatField()
    close_to_sales_trend = serializers.FloatField()
    sales_trend = serializers.FloatField()
    overdue_trend = serializers.FloatField()
    
    class Meta:
        fields = '__all__'

class StatusDistributionSerializer(serializers.Serializer):
    """
    Serializer for lead status distribution data
    """
    status = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()
    
    class Meta:
        fields = ['status', 'count', 'percentage']

class LeadTypeDistributionSerializer(serializers.Serializer):
    """
    Serializer for lead type distribution data
    """
    type = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()
    
    class Meta:
        fields = ['type', 'count', 'percentage']

class LeadSourceDistributionSerializer(serializers.Serializer):
    """
    Serializer for lead source distribution data
    """
    source = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()
    
    class Meta:
        fields = ['source', 'count', 'percentage']

class LeadAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for lead analytics data
    """
    # Summary statistics
    stats = DashboardStatsSerializer()
    
    # Distribution data
    statusWiseData = StatusDistributionSerializer(many=True)
    leadTypeData = LeadTypeDistributionSerializer(many=True)
    leadSourceData = LeadSourceDistributionSerializer(many=True)
    
    # Conversion metrics
    conversion_rate = serializers.FloatField()
    
    # Time-based metrics
    lead_response_time_avg = serializers.FloatField(required=False)
    
    class Meta:
        fields = '__all__'

class UserPerformanceItemSerializer(serializers.Serializer):
    """
    Serializer for individual user performance data
    """
    user_id = serializers.CharField()
    name = serializers.CharField()
    role = serializers.CharField()
    total_leads = serializers.IntegerField()
    converted_leads = serializers.IntegerField()
    conversion_rate = serializers.FloatField()
    total_sales = serializers.IntegerField()
    total_sales_value = serializers.FloatField()
    response_time_avg = serializers.FloatField(required=False)
    
    class Meta:
        fields = '__all__'

class UserPerformanceSerializer(serializers.Serializer):
    """
    Serializer for user performance data
    """
    userPerformance = UserPerformanceItemSerializer(many=True)
    
    class Meta:
        fields = ['userPerformance']

class SalesByTypeSerializer(serializers.Serializer):
    """
    Serializer for sales by type data
    """
    type = serializers.CharField()
    count = serializers.IntegerField()
    value = serializers.FloatField()
    
    class Meta:
        fields = ['type', 'count', 'value']

class MonthlyStatsSerializer(serializers.Serializer):
    """
    Serializer for monthly statistics
    """
    month = serializers.IntegerField()
    count = serializers.IntegerField()
    value = serializers.FloatField()
    
    class Meta:
        fields = ['month', 'count', 'value']
        
class SalesAnalyticsSerializer(serializers.Serializer):
    """
    Serializer for sales analytics data
    """
    # Summary metrics
    totalSales = serializers.IntegerField()
    totalValue = serializers.FloatField()
    averageValue = serializers.FloatField()
    
    # Distribution data
    salesByType = SalesByTypeSerializer(many=True)
    monthlySales = MonthlyStatsSerializer(many=True)
    
    class Meta:
        fields = '__all__'

class FunnelStageSerializer(serializers.Serializer):
    """
    Serializer for conversion funnel stages
    """
    stage = serializers.CharField()
    count = serializers.IntegerField()
    drop_off = serializers.IntegerField()
    drop_off_percentage = serializers.FloatField()
    
    class Meta:
        fields = ['stage', 'count', 'drop_off', 'drop_off_percentage']

class ConversionFunnelSerializer(serializers.Serializer):
    """
    Serializer for conversion funnel data
    """
    funnelData = FunnelStageSerializer(many=True)
    totalLeads = serializers.IntegerField()
    wonLeads = serializers.IntegerField()
    overallConversion = serializers.FloatField()
    
    class Meta:
        fields = '__all__' 