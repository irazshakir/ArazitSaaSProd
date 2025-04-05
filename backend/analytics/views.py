from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
import datetime

from .serializers import (
    DashboardStatsSerializer, 
    LeadAnalyticsSerializer,
    UserPerformanceSerializer,
    SalesAnalyticsSerializer,
    ConversionFunnelSerializer
)
from .permissions import AnalyticsPermission
from leads.models import Lead
from users.models import User
from teams.models import Team

class BaseAnalyticsView(APIView):
    """Base class for all analytics views with tenant isolation and role filtering"""
    permission_classes = [IsAuthenticated, AnalyticsPermission]
    
    def get_tenant_id(self, request):
        """Extract tenant_id from request parameters or user object"""
        tenant_id = request.query_params.get('tenant_id')
        if not tenant_id:
            # Fall back to user's tenant_id
            tenant_id = request.user.tenant_id
            
        if not tenant_id:
            # If still no tenant_id, this is an error
            return None
            
        return tenant_id
    
    def apply_tenant_isolation(self, queryset, tenant_id):
        """Filter queryset to only include data for the specified tenant"""
        return queryset.filter(tenant_id=tenant_id)
    
    def apply_role_based_filters(self, request, queryset):
        """Apply role-based filtering to the queryset"""
        user = request.user
        role = user.role
        
        # Apply parameters from request first
        branch_id = request.query_params.get('branch_id')
        department_id = request.query_params.get('department_id')
        user_id = request.query_params.get('user_id')
        
        # Add filters based on request parameters
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
            
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            
        if user_id:
            queryset = queryset.filter(created_by_id=user_id)
        
        # Add additional filters based on user role
        if role == 'admin':
            # Admin can see all data for the tenant, no additional filters
            pass
        elif role == 'department_head':
            # Department head can only see data for their department
            if not department_id:  # Only apply if not already filtered by department
                queryset = queryset.filter(department_id=user.department_id)
        elif role == 'manager':
            # Manager can see data for all team leads assigned to them
            team_leads = User.objects.filter(manager_id=user.id).values_list('id', flat=True)
            team_members = User.objects.filter(
                Q(team_lead_id__in=team_leads) | Q(id__in=team_leads)
            ).values_list('id', flat=True)
            queryset = queryset.filter(created_by_id__in=team_members)
        elif role == 'team_lead':
            # Team lead can see data for all agents assigned to them
            team_members = User.objects.filter(team_lead_id=user.id).values_list('id', flat=True)
            # Include their own records too
            queryset = queryset.filter(
                Q(created_by_id__in=team_members) | Q(created_by_id=user.id)
            )
        else:
            # Regular users can only see their own data
            queryset = queryset.filter(created_by_id=user.id)
            
        return queryset
    
    def get_filtered_queryset(self, request, base_queryset):
        """Get queryset with all filters applied"""
        tenant_id = self.get_tenant_id(request)
        if not tenant_id:
            return Response(
                {"error": "Tenant ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # First apply tenant isolation
        queryset = self.apply_tenant_isolation(base_queryset, tenant_id)
        
        # Then apply role-based filtering
        queryset = self.apply_role_based_filters(request, queryset)
        
        # Apply date filters if provided
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = datetime.datetime.strptime(date_from, '%Y-%m-%d')
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to = datetime.datetime.strptime(date_to, '%Y-%m-%d')
                # Add one day to include the entire end date
                date_to = date_to + datetime.timedelta(days=1)
                queryset = queryset.filter(created_at__lt=date_to)
            except ValueError:
                pass
                
        return queryset

class DashboardStatsView(BaseAnalyticsView):
    """
    API endpoint for dashboard summary statistics
    """
    def get(self, request):
        try:
            # Get leads with proper filtering
            leads_queryset = self.get_filtered_queryset(request, Lead.objects.all())
            
            # Current month filter
            current_month = timezone.now().month
            current_year = timezone.now().year
            
            # Filter leads for current month
            current_month_filter = Q(created_at__month=current_month, created_at__year=current_year)
            current_month_leads = leads_queryset.filter(current_month_filter)
            
            # Apply specific filters for each metric as per requirements
            # New Inquiries -> all leads created in current month
            new_inquiries = current_month_leads.count()
            
            # Active Inquiries -> leads with activity status "active" in current month
            active_inquiries = current_month_leads.filter(lead_activity_status=Lead.ACTIVITY_STATUS_ACTIVE).count()
            
            # Close to Sales -> leads with status "negotiation" in current month
            close_to_sales = current_month_leads.filter(status=Lead.STATUS_NEGOTIATION).count()
            
            # Sales -> leads with status "won" in current month
            sales = current_month_leads.filter(status=Lead.STATUS_WON).count()
            
            # Overdue -> leads with next_follow_up date in the past
            overdue = current_month_leads.filter(next_follow_up__lt=timezone.now()).count()
            
            # Calculate percentage changes from previous month
            # Get previous month data
            prev_month = current_month - 1
            prev_year = current_year
            if prev_month == 0:
                prev_month = 12
                prev_year -= 1
                
            prev_month_filter = Q(created_at__month=prev_month, created_at__year=prev_year)
            prev_month_leads = leads_queryset.filter(prev_month_filter)
            
            # Previous month metrics
            prev_new_inquiries = prev_month_leads.count()
            prev_active_inquiries = prev_month_leads.filter(lead_activity_status=Lead.ACTIVITY_STATUS_ACTIVE).count()
            prev_close_to_sales = prev_month_leads.filter(status=Lead.STATUS_NEGOTIATION).count()
            prev_sales = prev_month_leads.filter(status=Lead.STATUS_WON).count()
            prev_overdue = prev_month_leads.filter(next_follow_up__lt=timezone.now()).count()
            
            # Calculate percentage changes (handle division by zero)
            new_inquiries_trend = calculate_percentage_change(prev_new_inquiries, new_inquiries)
            active_inquiries_trend = calculate_percentage_change(prev_active_inquiries, active_inquiries)
            close_to_sales_trend = calculate_percentage_change(prev_close_to_sales, close_to_sales)
            sales_trend = calculate_percentage_change(prev_sales, sales)
            overdue_trend = calculate_percentage_change(prev_overdue, overdue)
            
            # Get monthly data for the chart
            monthly_sales_data = get_monthly_sales_data(leads_queryset, current_year)
            monthly_inquiries_data = get_monthly_inquiries_data(leads_queryset, current_year)
            
            # Get lead status distribution
            lead_statuses = {
                'new': current_month_leads.filter(status=Lead.STATUS_NEW).count(),
                'qualified': current_month_leads.filter(status=Lead.STATUS_QUALIFIED).count(),
                'nonPotential': current_month_leads.filter(status=Lead.STATUS_NON_POTENTIAL).count(),
                'proposal': current_month_leads.filter(status=Lead.STATUS_PROPOSAL).count(),
                'negotiation': current_month_leads.filter(status=Lead.STATUS_NEGOTIATION).count(),
                'won': current_month_leads.filter(status=Lead.STATUS_WON).count(),
                'lost': current_month_leads.filter(status=Lead.STATUS_LOST).count()
            }
            
            # Return formatted response
            stats = {
                'stats': {
                    'newInquiries': new_inquiries,
                    'activeInquiries': active_inquiries,
                    'closeToSales': close_to_sales,
                    'sales': sales,
                    'overdue': overdue
                },
                'trends': {
                    'newInquiries': round(new_inquiries_trend, 1),
                    'activeInquiries': round(active_inquiries_trend, 1),
                    'closeToSales': round(close_to_sales_trend, 1),
                    'sales': round(sales_trend, 1),
                    'overdue': round(overdue_trend, 1)
                },
                'salesVsInquiries': {
                    'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    'sales': monthly_sales_data,
                    'inquiries': monthly_inquiries_data
                },
                'leadStatuses': lead_statuses
            }
            
            return Response(stats)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Helper functions for DashboardStatsView

def calculate_percentage_change(old_value, new_value):
    """Calculate percentage change between two values"""
    if old_value == 0:
        return 100 if new_value > 0 else 0
    
    return ((new_value - old_value) / old_value) * 100

def get_monthly_sales_data(queryset, year):
    """Get monthly sales data for the current year"""
    monthly_data = []
    
    for month in range(1, 13):
        count = queryset.filter(
            status=Lead.STATUS_WON,
            created_at__year=year,
            created_at__month=month
        ).count()
        
        monthly_data.append(count)
    
    return monthly_data

def get_monthly_inquiries_data(queryset, year):
    """Get monthly inquiries data for the current year"""
    monthly_data = []
    
    for month in range(1, 13):
        count = queryset.filter(
            created_at__year=year,
            created_at__month=month
        ).count()
        
        monthly_data.append(count)
    
    return monthly_data

class LeadAnalyticsView(BaseAnalyticsView):
    """
    API endpoint for detailed lead analytics
    """
    def get(self, request):
        try:
            # Get leads with proper filtering
            leads_queryset = self.get_filtered_queryset(request, Lead.objects.all())
            
            # Analysis by lead source
            lead_sources = leads_queryset.values('source').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Analysis by lead status
            lead_statuses = leads_queryset.values('status').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Analysis by lead type
            lead_types = leads_queryset.values('lead_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Analysis by conversion rate
            total_leads = leads_queryset.count()
            converted_leads = leads_queryset.filter(status='won').count()
            conversion_rate = (converted_leads / total_leads) * 100 if total_leads > 0 else 0
            
            # Calculate percentages for lead sources
            total_leads_count = leads_queryset.count()
            lead_sources_with_percentage = []
            for source in lead_sources:
                percentage = (source['count'] / total_leads_count) * 100 if total_leads_count > 0 else 0
                lead_sources_with_percentage.append({
                    'source': source['source'],
                    'count': source['count'],
                    'percentage': round(percentage, 2)
                })
            
            # Calculate percentages for lead statuses
            status_with_percentage = []
            for status_item in lead_statuses:
                percentage = (status_item['count'] / total_leads_count) * 100 if total_leads_count > 0 else 0
                status_with_percentage.append({
                    'status': status_item['status'],
                    'count': status_item['count'],
                    'percentage': round(percentage, 2)
                })
            
            # Calculate percentages for lead types
            types_with_percentage = []
            for type_item in lead_types:
                percentage = (type_item['count'] / total_leads_count) * 100 if total_leads_count > 0 else 0
                types_with_percentage.append({
                    'type': type_item['lead_type'],
                    'count': type_item['count'],
                    'percentage': round(percentage, 2)
                })
            
            # Basic stats for the sidebar/overview
            stats = {
                'newInquiries': leads_queryset.filter(status='new').count(),
                'activeInquiries': leads_queryset.filter(status__in=['active', 'in_progress']).count(),
                'closedInquiries': leads_queryset.filter(status__in=['won', 'lost']).count(),
                'closeToSales': leads_queryset.filter(status__in=['proposal', 'negotiation']).count(),
                'sales': leads_queryset.filter(status='won').count(),
                'overdue': leads_queryset.filter(
                    Q(status__in=['active', 'in_progress']) & 
                    Q(next_follow_up__lt=timezone.now())
                ).count()
            }
            
            analytics_data = {
                'stats': stats,
                'leadSourceData': lead_sources_with_percentage,
                'statusWiseData': status_with_percentage,
                'leadTypeData': types_with_percentage,
                'conversionRate': conversion_rate,
                'totalLeads': total_leads,
                'convertedLeads': converted_leads
            }
            
            return Response(analytics_data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserPerformanceView(BaseAnalyticsView):
    """
    API endpoint for user performance analytics
    """
    def get(self, request):
        try:
            # Get filtered leads
            leads_queryset = self.get_filtered_queryset(request, Lead.objects.all())
            
            # Get performance metrics by user
            user_performance = []
            
            # Get users based on filters and role permissions
            users_queryset = User.objects.filter(tenant_id=self.get_tenant_id(request))
            
            # Apply role-based filtering to users
            role = request.user.role
            if role == 'department_head':
                users_queryset = users_queryset.filter(department_id=request.user.department_id)
            elif role == 'manager':
                users_queryset = users_queryset.filter(
                    Q(manager_id=request.user.id) | Q(id=request.user.id)
                )
            elif role == 'team_lead':
                users_queryset = users_queryset.filter(
                    Q(team_lead_id=request.user.id) | Q(id=request.user.id)
                )
            elif role not in ['admin']:
                # Regular users can only see their own data
                users_queryset = users_queryset.filter(id=request.user.id)
            
            # Get department_id filter if provided
            department_id = request.query_params.get('department_id')
            if department_id:
                users_queryset = users_queryset.filter(department_id=department_id)
                
            # Get branch_id filter if provided
            branch_id = request.query_params.get('branch_id')
            if branch_id:
                users_queryset = users_queryset.filter(branch_id=branch_id)
            
            # Calculate performance for each user
            for user in users_queryset:
                user_leads = leads_queryset.filter(created_by=user)
                
                total_leads = user_leads.count()
                converted_leads = user_leads.filter(status='won').count()
                conversion_rate = (converted_leads / total_leads) * 100 if total_leads > 0 else 0
                
                # Calculate total sales value if leads have a value field
                total_sales_value = 0
                sales_leads = user_leads.filter(status='won')
                if hasattr(Lead, 'value'):
                    total_sales_value = sales_leads.aggregate(Sum('value'))['value__sum'] or 0
                
                user_performance.append({
                    'user_id': user.id,
                    'name': f"{user.first_name} {user.last_name}",
                    'email': user.email,
                    'role': user.role,
                    'total_leads': total_leads,
                    'converted_leads': converted_leads,
                    'conversion_rate': conversion_rate,
                    'total_sales': sales_leads.count(),
                    'total_sales_value': total_sales_value
                })
            
            # Sort by sales value (can be changed based on requirements)
            user_performance.sort(key=lambda x: x['total_sales_value'], reverse=True)
            
            return Response({
                'userPerformance': user_performance
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SalesAnalyticsView(BaseAnalyticsView):
    """
    API endpoint for sales analytics
    """
    def get(self, request):
        try:
            # Get filtered leads with status='won' (these are our sales)
            sales_queryset = self.get_filtered_queryset(request, Lead.objects.filter(status='won'))
            
            # Calculate total sales
            total_sales = sales_queryset.count()
            
            # Calculate total value and avg value if Lead model has a value field
            total_value = 0
            avg_value = 0
            if hasattr(Lead, 'value'):
                total_value = sales_queryset.aggregate(Sum('value'))['value__sum'] or 0
                avg_value = sales_queryset.aggregate(Avg('value'))['value__avg'] or 0
            
            # Sales by product/service type (lead_type)
            sales_by_type = sales_queryset.values('lead_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Add value information if available
            if hasattr(Lead, 'value'):
                sales_by_type = sales_queryset.values('lead_type').annotate(
                    count=Count('id'),
                    total_value=Sum('value')
                ).order_by('-total_value')
            
            # Sales trend over time (monthly)
            current_year = timezone.now().year
            monthly_sales = []
            
            for month in range(1, 13):
                month_sales = sales_queryset.filter(
                    created_at__year=current_year,
                    created_at__month=month
                )
                
                monthly_data = {
                    'month': month,
                    'count': month_sales.count(),
                    'value': 0
                }
                
                if hasattr(Lead, 'value'):
                    monthly_data['value'] = month_sales.aggregate(Sum('value'))['value__sum'] or 0
                
                monthly_sales.append(monthly_data)
            
            # Prepare the response data
            sales_by_type_data = []
            for item in sales_by_type:
                type_data = {
                    'type': item['lead_type'],
                    'count': item['count'],
                    'value': 0
                }
                
                if hasattr(Lead, 'value') and 'total_value' in item:
                    type_data['value'] = item['total_value']
                
                sales_by_type_data.append(type_data)
            
            analytics_data = {
                'totalSales': total_sales,
                'totalValue': total_value,
                'averageValue': avg_value,
                'salesByType': sales_by_type_data,
                'monthlySales': monthly_sales
            }
            
            return Response(analytics_data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConversionFunnelView(BaseAnalyticsView):
    """
    API endpoint for conversion funnel analytics
    """
    def get(self, request):
        try:
            # Get filtered leads
            leads_queryset = self.get_filtered_queryset(request, Lead.objects.all())
            
            # Define the stages in your conversion funnel
            funnel_stages = [
                {'name': 'New Leads', 'status': 'new'},
                {'name': 'Qualified', 'status': 'qualified'},
                {'name': 'Proposal', 'status': 'proposal'},
                {'name': 'Negotiation', 'status': 'negotiation'},
                {'name': 'Won', 'status': 'won'}
            ]
            
            # Calculate counts for each stage
            funnel_data = []
            previous_count = 0
            
            for index, stage in enumerate(funnel_stages):
                stage_count = leads_queryset.filter(status=stage['status']).count()
                
                # Calculate drop-off from previous stage
                drop_off = 0
                drop_off_percentage = 0
                
                if index > 0 and previous_count > 0:
                    drop_off = previous_count - stage_count
                    drop_off_percentage = (drop_off / previous_count) * 100
                
                funnel_data.append({
                    'stage': stage['name'],
                    'count': stage_count,
                    'drop_off': drop_off,
                    'drop_off_percentage': drop_off_percentage
                })
                
                previous_count = stage_count
            
            # Calculate conversion metrics
            total_leads = leads_queryset.count()
            won_leads = leads_queryset.filter(status='won').count()
            
            overall_conversion = (won_leads / total_leads) * 100 if total_leads > 0 else 0
            
            analytics_data = {
                'funnelData': funnel_data,
                'totalLeads': total_leads,
                'wonLeads': won_leads,
                'overallConversion': overall_conversion
            }
            
            return Response(analytics_data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 