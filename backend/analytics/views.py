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
    ConversionFunnelSerializer,
    FilterOptionsSerializer,
    MarketingAnalyticsSerializer
)
from .permissions import AnalyticsPermission
from leads.models import Lead, LeadEvent
from users.models import User, Department, Branch
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
        
        print(f"User filter params - branch_id: {branch_id}, department_id: {department_id}, user_id: {user_id}")
        
        # Debug query params
        print(f"All query params: {request.query_params}")
        
        # Add filters based on request parameters
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
            print(f"Applied branch filter: {branch_id}, remaining records: {queryset.count()}")
            
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            print(f"Applied department filter: {department_id}, remaining records: {queryset.count()}")
            
        if user_id:
            # Debug check what field to use for filtering by user
            print(f"Checking which field to use for user filtering - user_id: {user_id}")
            
            # Try to get a lead to check available fields
            sample_lead = queryset.first()
            if sample_lead:
                print(f"Sample lead fields: {dir(sample_lead)}")
                print(f"Sample lead created_by: {getattr(sample_lead, 'created_by', None)}")
                print(f"Sample lead created_by_id: {getattr(sample_lead, 'created_by_id', None)}")
                print(f"Sample lead assigned_to: {getattr(sample_lead, 'assigned_to', None)}")
                print(f"Sample lead assigned_to_id: {getattr(sample_lead, 'assigned_to_id', None)}")
            
            # Try both fields to see which one works
            # Check leads assigned to the user
            if hasattr(Lead, 'assigned_to_id'):
                assigned_count = queryset.filter(assigned_to_id=user_id).count()
                print(f"Leads assigned to user {user_id}: {assigned_count}")
                
            # Check leads created by the user
            created_count = queryset.filter(created_by_id=user_id).count()
            print(f"Leads created by user {user_id}: {created_count}")
            
            # Filter by both assigned_to and created_by
            if hasattr(Lead, 'assigned_to_id'):
                queryset = queryset.filter(Q(created_by_id=user_id) | Q(assigned_to_id=user_id))
                print(f"Applied user filter using both created_by_id and assigned_to_id: {user_id}, remaining records: {queryset.count()}")
            else:
                queryset = queryset.filter(created_by_id=user_id)
                print(f"Applied user filter using only created_by_id: {user_id}, remaining records: {queryset.count()}")
        
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
            
            # Return formatted response - make sure this matches exactly what Dashboard.jsx expects
            response_data = {
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
                'leadStatuses': lead_statuses,
                # Include empty arrays for recentActivities and upcomingEvents to match expected structure
                'recentActivities': [],
                'upcomingEvents': []
            }
            
            return Response(response_data)
            
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
            # Print debug info
            print(f"Lead Analytics request with params: {request.query_params}")
            
            # Get leads with proper filtering
            try:
                leads_queryset = self.get_filtered_queryset(request, Lead.objects.all())
                print(f"Retrieved {leads_queryset.count()} leads")
            except Exception as e:
                print(f"Error in get_filtered_queryset: {e}")
                return Response(
                    {"error": f"Error filtering queryset: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get leads data for table with pagination
            try:
                page_size = int(request.query_params.get('page_size', 10))
                page = int(request.query_params.get('page', 1))
                
                # Apply additional filters if provided
                status_filter = request.query_params.get('status')
                activity_status_filter = request.query_params.get('activity_status')
                search_query = request.query_params.get('search')
                
                if status_filter:
                    leads_queryset = leads_queryset.filter(status=status_filter)
                    
                if activity_status_filter:
                    leads_queryset = leads_queryset.filter(lead_activity_status=activity_status_filter)
                    
                if search_query:
                    leads_queryset = leads_queryset.filter(
                        Q(name__icontains=search_query) | 
                        Q(email__icontains=search_query) | 
                        Q(phone__icontains=search_query) |
                        Q(lead_id__icontains=search_query)
                    )
                
                # Order by created_at desc by default
                leads_queryset = leads_queryset.order_by('-created_at')
                
                # Calculate total count for pagination
                total_count = leads_queryset.count()
                total_pages = (total_count + page_size - 1) // page_size  # Ceiling division
                
                # Apply pagination
                start = (page - 1) * page_size
                end = start + page_size
                paginated_leads = leads_queryset[start:end]
                
                # Serialize leads
                leads_data = []
                for lead in paginated_leads:
                    try:
                        lead_data = {
                            'id': str(lead.id),  # Convert UUID to string
                            'lead_id': getattr(lead, 'lead_id', str(lead.id)),  # Use lead.id if lead_id doesn't exist
                            'name': getattr(lead, 'name', ''),
                            'email': getattr(lead, 'email', ''),
                            'phone': getattr(lead, 'phone', ''),
                            'source': getattr(lead, 'source', ''),
                            'lead_type': getattr(lead, 'lead_type', ''),
                            'status': getattr(lead, 'status', ''),
                            'activity_status': getattr(lead, 'lead_activity_status', ''),
                            'created_at': lead.created_at.strftime('%Y-%m-%d %H:%M') if hasattr(lead, 'created_at') and lead.created_at else '',
                            'created_by': f"{lead.created_by.first_name} {lead.created_by.last_name}".strip() if hasattr(lead, 'created_by') and lead.created_by else "Unknown",
                            'next_follow_up': lead.next_follow_up.strftime('%Y-%m-%d %H:%M') if hasattr(lead, 'next_follow_up') and lead.next_follow_up else None,
                        }
                        leads_data.append(lead_data)
                    except Exception as e:
                        print(f"Error serializing lead {lead.id}: {e}")
                        print(f"Lead attributes: {dir(lead)}")  # Print all attributes of the lead object
                
                print(f"Processed {len(leads_data)} leads for the table")
            except Exception as e:
                print(f"Error in pagination and lead serialization: {e}")
                return Response(
                    {"error": f"Error in pagination: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Process analytics data
            try:
                # Analysis by lead source
                lead_sources = leads_queryset.values('source').annotate(
                    count=Count('id')
                ).order_by('-count')
                
                # Analysis by lead status
                # Update this to include only active leads and match the exact format needed for the frontend
                active_leads_queryset = leads_queryset.filter(lead_activity_status=Lead.ACTIVITY_STATUS_ACTIVE)
                total_active_leads = active_leads_queryset.count()
                
                # Get all status options from the Lead model
                all_statuses = [status[0] for status in Lead.STATUS_CHOICES]
                status_data = []
                
                # Calculate counts and percentages for each status
                for status_code in all_statuses:
                    # Get the display name from choices
                    status_name = dict(Lead.STATUS_CHOICES).get(status_code, status_code)
                    status_count = active_leads_queryset.filter(status=status_code).count()
                    percentage = (status_count / total_active_leads * 100) if total_active_leads > 0 else 0
                    
                    status_data.append({
                        'status': status_name,  # Use display name (capitalized)
                        'count': status_count,
                        'percentage': round(percentage, 1)  # Round to 1 decimal place
                    })
                
                # Sort by count in descending order
                status_data.sort(key=lambda x: x['count'], reverse=True)
                
                # Analysis by lead type
                lead_types = leads_queryset.values('lead_type').annotate(
                    count=Count('id')
                ).order_by('-count')
                
                # Analysis by conversion rate
                total_leads = leads_queryset.count()
                converted_leads = leads_queryset.filter(status=Lead.STATUS_WON).count()
                conversion_rate = (converted_leads / total_leads) * 100 if total_leads > 0 else 0
                
                # Calculate percentages for lead sources
                total_leads_count = leads_queryset.count()
                lead_sources_with_percentage = []
                for source in lead_sources:
                    percentage = (source['count'] / total_leads_count) * 100 if total_leads_count > 0 else 0
                    lead_sources_with_percentage.append({
                        'source': dict(Lead.SOURCE_CHOICES).get(source['source'], source['source'] or 'Unknown'),
                        'count': source['count'],
                        'percentage': round(percentage, 1)
                    })
                
                # Use the updated status_data instead of recalculating
                status_with_percentage = status_data
                
                # Calculate percentages for lead types
                types_with_percentage = []
                for type_item in lead_types:
                    percentage = (type_item['count'] / total_leads_count) * 100 if total_leads_count > 0 else 0
                    types_with_percentage.append({
                        'type': dict(Lead.TYPE_CHOICES).get(type_item['lead_type'], type_item['lead_type'] or 'Unknown'),
                        'count': type_item['count'],
                        'percentage': round(percentage, 1)
                    })
                
                print(f"Processed analytics data with {len(lead_sources_with_percentage)} sources, {len(status_with_percentage)} statuses, and {len(types_with_percentage)} types")
            except Exception as e:
                print(f"Error in analytics processing: {e}")
                return Response(
                    {"error": f"Error in analytics processing: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get basic stats
            try:
                # Basic stats for the sidebar/overview
                stats = {
                    'newInquiries': leads_queryset.filter(status=Lead.STATUS_NEW).count(),
                    'activeInquiries': leads_queryset.filter(lead_activity_status=Lead.ACTIVITY_STATUS_ACTIVE).count(),
                    'closedInquiries': leads_queryset.filter(status__in=[Lead.STATUS_WON, Lead.STATUS_LOST]).count(),
                    'closeToSales': leads_queryset.filter(status__in=[Lead.STATUS_PROPOSAL, Lead.STATUS_NEGOTIATION]).count(),
                    'sales': leads_queryset.filter(status=Lead.STATUS_WON).count(),
                    'overdue': leads_queryset.filter(
                        Q(status__in=[Lead.STATUS_NEW, Lead.STATUS_QUALIFIED, Lead.STATUS_PROPOSAL, Lead.STATUS_NEGOTIATION]) & 
                        Q(next_follow_up__lt=timezone.now())
                    ).count()
                }
                
                print(f"Calculated stats: {stats}")
            except Exception as e:
                print(f"Error in stats calculation: {e}")
                return Response(
                    {"error": f"Error calculating stats: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get available filters
            try:
                statuses = Lead.STATUS_CHOICES
                activity_statuses = Lead.ACTIVITY_STATUS_CHOICES
                
                print(f"Retrieved {len(statuses)} status options and {len(activity_statuses)} activity status options")
            except Exception as e:
                print(f"Error getting filter options: {e}")
                return Response(
                    {"error": f"Error getting filter options: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Prepare response
            try:
                analytics_data = {
                    'stats': stats,
                    'leadSourceData': lead_sources_with_percentage,
                    'statusWiseData': status_with_percentage,
                    'leadTypeData': types_with_percentage,
                    'conversionRate': conversion_rate,
                    'totalLeads': total_leads,
                    'convertedLeads': converted_leads,
                    'leadsTable': {
                        'leads': leads_data,
                        'pagination': {
                            'page': page,
                            'pageSize': page_size,
                            'totalCount': total_count,
                            'totalPages': total_pages
                        },
                        'filters': {
                            'statuses': [{'value': status[0], 'label': status[1]} for status in statuses],
                            'activityStatuses': [{'value': status[0], 'label': status[1]} for status in activity_statuses]
                        }
                    }
                }
                
                print("Successfully prepared analytics data")
                return Response(analytics_data)
            except Exception as e:
                print(f"Error preparing response: {e}")
                return Response(
                    {"error": f"Error preparing response: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            print(f"Unhandled exception in LeadAnalyticsView: {e}")
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
            # Print debug info
            print(f"User Performance request with params: {request.query_params}")
            
            # Get tenant_id
            tenant_id = self.get_tenant_id(request)
            
            # Get users based on filters and role permissions
            users_queryset = User.objects.filter(tenant_id=tenant_id)
            
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
            
            # Filter users by role to only include sales and support agents
            users_queryset = users_queryset.filter(
                Q(role='sales_agent') | Q(role='support_agent')
            )
            
            # Get date range filters
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            
            print(f"Filtering data from {date_from} to {date_to}")
            
            if date_from:
                try:
                    date_from = datetime.datetime.strptime(date_from, '%Y-%m-%d')
                except ValueError:
                    date_from = None
            
            if date_to:
                try:
                    date_to = datetime.datetime.strptime(date_to, '%Y-%m-%d')
                    # Add one day to include the entire end date
                    date_to = date_to + datetime.timedelta(days=1)
                except ValueError:
                    date_to = None
            
            # Create a leads queryset for filtering by date if needed
            leads_queryset = Lead.objects.filter(tenant_id=tenant_id)
            
            if date_from:
                leads_queryset = leads_queryset.filter(created_at__gte=date_from)
            
            if date_to:
                leads_queryset = leads_queryset.filter(created_at__lt=date_to)
            
            # Get LeadEvent for won leads during the date range
            event_queryset = None
            
            try:
                # Check if LeadEvent is available and has EVENT_WON constant
                if hasattr(LeadEvent, 'EVENT_WON'):
                    event_queryset = LeadEvent.objects.filter(
                        tenant_id=tenant_id,
                        event_type=LeadEvent.EVENT_WON
                    )
                    
                    if date_from:
                        event_queryset = event_queryset.filter(timestamp__gte=date_from)
                    
                    if date_to:
                        event_queryset = event_queryset.filter(timestamp__lt=date_to)
                    
                    print(f"Found {event_queryset.count()} won events for tenant {tenant_id}")
            except Exception as e:
                print(f"Error accessing LeadEvent model: {e}")
                event_queryset = None
            
            print(f"Processing performance data for {users_queryset.count()} users")
            
            # Calculate performance for each user
            user_performance = []
            
            for user in users_queryset:
                try:
                    # 1. Count assigned leads for this user within date range
                    try:
                        assigned_leads = leads_queryset.filter(assigned_to=user).count()
                    except Exception as e:
                        print(f"Error counting assigned leads for user {user.id}: {e}")
                        assigned_leads = 0
                    
                    # 2. Count won leads (sales) for this user
                    # First, count leads that are assigned to the user and have status 'won'
                    try:
                        won_leads_count = leads_queryset.filter(
                            assigned_to=user,
                            status=Lead.STATUS_WON
                        ).count()
                    except Exception as e:
                        print(f"Error counting won leads for user {user.id}: {e}")
                        won_leads_count = 0
                    
                    # If we have access to LeadEvent, use it to get more accurate data
                    won_leads_events = 0
                    if event_queryset is not None:
                        try:
                            # Get leads assigned to this user
                            user_lead_ids = leads_queryset.filter(assigned_to=user).values_list('id', flat=True)
                            
                            # Count events where those leads were marked as won
                            won_leads_events = event_queryset.filter(
                                lead_id__in=user_lead_ids
                            ).count()
                            
                            print(f"User {user.id}: Found {won_leads_events} won events from {len(user_lead_ids)} assigned leads")
                        except Exception as e:
                            print(f"Error processing lead events for user {user.id}: {e}")
                            won_leads_events = 0
                    
                    # Use the higher count between status-based and event-based counts
                    sales_count = max(won_leads_count, won_leads_events)
                    
                    # 3. Calculate conversion ratio
                    conversion_ratio = 0
                    if assigned_leads > 0:
                        conversion_ratio = (sales_count / assigned_leads) * 100
                    
                    # Build user performance data
                    user_data = {
                        'user_id': user.id,
                        'name': f"{user.first_name} {user.last_name}".strip() or user.email,
                        'email': user.email,
                        'role': user.role,
                        'assigned_leads': assigned_leads,
                        'sales': sales_count,
                        'conversion_ratio': round(conversion_ratio, 1)
                    }
                    
                    user_performance.append(user_data)
                except Exception as e:
                    print(f"Error processing performance data for user {user.id}: {e}")
            
            # Sort by sales count in descending order
            user_performance.sort(key=lambda x: x['sales'], reverse=True)
            
            print(f"Returning performance data for {len(user_performance)} users")
            
            return Response({
                'userPerformance': user_performance
            })
            
        except Exception as e:
            print(f"Error in UserPerformanceView: {str(e)}")
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

class MarketingAnalyticsView(BaseAnalyticsView):
    """
    API endpoint for marketing analytics (lead source conversion analysis)
    """
    def get(self, request):
        try:
            # Get filtered leads based on tenant and date range
            leads_queryset = self.get_filtered_queryset(request, Lead.objects.all())
            
            # Get all unique lead sources
            lead_sources = leads_queryset.values_list('source', flat=True).distinct()
            print(f"Unique lead sources found in data: {lead_sources}")
            
            # Ensure all standard lead sources are included even if no leads have those sources yet
            standard_sources = [
                choice[0] for choice in Lead.SOURCE_CHOICES if choice[0]
            ]
            print(f"Standard sources from SOURCE_CHOICES: {standard_sources}")
            
            # Add any missing standard sources to ensure they appear in the report
            for source in standard_sources:
                if source not in lead_sources:
                    lead_sources = list(lead_sources)
                    lead_sources.append(source)
                    print(f"Added missing standard source: {source}")
            
            # Prepare result data
            marketing_data = []
            
            # Get LeadEvent queryset for won events if it exists
            event_queryset = None
            try:
                # Check if we can access LeadEvent model and filter won events
                date_from = request.query_params.get('date_from')
                date_to = request.query_params.get('date_to')
                tenant_id = self.get_tenant_id(request)
                
                event_queryset = LeadEvent.objects.filter(
                    tenant_id=tenant_id,
                    event_type=LeadEvent.EVENT_WON
                )
                
                if date_from:
                    try:
                        date_from = datetime.datetime.strptime(date_from, '%Y-%m-%d')
                        event_queryset = event_queryset.filter(timestamp__gte=date_from)
                    except ValueError:
                        pass
                
                if date_to:
                    try:
                        date_to = datetime.datetime.strptime(date_to, '%Y-%m-%d')
                        # Add one day to include the entire end date
                        date_to = date_to + datetime.timedelta(days=1)
                        event_queryset = event_queryset.filter(timestamp__lt=date_to)
                    except ValueError:
                        pass
                
                print(f"Found {event_queryset.count()} won events for marketing analytics")
            except Exception as e:
                print(f"Error setting up LeadEvent queryset: {e}")
                event_queryset = None
            
            # Process each lead source
            for source in lead_sources:
                try:
                    # Skip empty source values
                    if not source:
                        continue
                    
                    source_display = dict(Lead.SOURCE_CHOICES).get(source, source)
                    
                    # Count all leads for this source
                    source_leads = leads_queryset.filter(source=source)
                    created_count = source_leads.count()
                    
                    # Even if count is zero, we want to include standard sources
                    if created_count == 0 and source not in standard_sources:
                        continue
                    
                    # Count qualified leads
                    qualified_count = source_leads.filter(status=Lead.STATUS_QUALIFIED).count()
                    
                    # Count non-potential leads
                    non_potential_count = source_leads.filter(status=Lead.STATUS_NON_POTENTIAL).count()
                    
                    # Count won leads (sales)
                    # First, count by status
                    won_by_status = source_leads.filter(status=Lead.STATUS_WON).count()
                    
                    # Then, if we have access to LeadEvent, count by won events
                    won_by_events = 0
                    if event_queryset is not None:
                        # Get lead IDs for this source
                        source_lead_ids = source_leads.values_list('id', flat=True)
                        
                        # Count events for these leads
                        won_by_events = event_queryset.filter(lead_id__in=source_lead_ids).count()
                    
                    # Use the higher count between the two methods
                    sales_count = max(won_by_status, won_by_events)
                    
                    # Calculate conversion ratio
                    conversion_ratio = (sales_count / created_count) * 100 if created_count > 0 else 0
                    
                    # Add to result data
                    marketing_data.append({
                        'source': source_display,
                        'created': created_count,
                        'qualified': qualified_count,
                        'non_potential': non_potential_count,
                        'sales': sales_count,
                        'conversion_ratio': round(conversion_ratio, 1)
                    })
                    
                except Exception as e:
                    print(f"Error processing source {source}: {e}")
                    # Continue with next source instead of failing completely
            
            # Sort by created count in descending order
            marketing_data.sort(key=lambda x: x['created'], reverse=True)
            
            # Now reorder to prioritize standard sources first in the order of SOURCE_CHOICES
            # Get display names for standard sources
            standard_source_display = [dict(Lead.SOURCE_CHOICES).get(source, source) for source in standard_sources]
            
            # Create a new sorted list
            sorted_marketing_data = []
            
            # First add all standard sources in their defined order
            for source_display in standard_source_display:
                for item in marketing_data:
                    if item['source'] == source_display:
                        sorted_marketing_data.append(item)
                        break
            
            # Then add any remaining custom sources sorted by created count
            for item in marketing_data:
                if item['source'] not in standard_source_display:
                    sorted_marketing_data.append(item)
            
            # Replace marketing_data with the sorted list
            marketing_data = sorted_marketing_data
            
            # Ensure all standard sources are included (even if they had zero data)
            standard_source_display_set = set(standard_source_display)
            marketing_data_sources = {item['source'] for item in marketing_data}
            
            # Add any missing standard sources with zero counts
            for source_display in standard_source_display:
                if source_display not in marketing_data_sources:
                    print(f"Adding zero entry for standard source: {source_display}")
                    marketing_data.append({
                        'source': source_display,
                        'created': 0,
                        'qualified': 0,
                        'non_potential': 0,
                        'sales': 0,
                        'conversion_ratio': 0.0
                    })
            
            # Re-sort to ensure standard sources are in correct order
            sorted_marketing_data = []
            for source_display in standard_source_display:
                for item in marketing_data:
                    if item['source'] == source_display:
                        sorted_marketing_data.append(item)
                        break
            
            # Add any non-standard sources
            for item in marketing_data:
                if item['source'] not in standard_source_display:
                    sorted_marketing_data.append(item)
            
            marketing_data = sorted_marketing_data
            
            # Calculate totals
            total_created = sum(item['created'] for item in marketing_data)
            total_qualified = sum(item['qualified'] for item in marketing_data)
            total_non_potential = sum(item['non_potential'] for item in marketing_data)
            total_sales = sum(item['sales'] for item in marketing_data)
            
            # Overall conversion ratio
            overall_conversion = (total_sales / total_created) * 100 if total_created > 0 else 0
            
            # Add totals row
            totals = {
                'source': 'Total',
                'created': total_created,
                'qualified': total_qualified,
                'non_potential': total_non_potential,
                'sales': total_sales,
                'conversion_ratio': round(overall_conversion, 1)
            }
            
            # Prepare response data
            response_data = {
                'marketingData': marketing_data,
                'totals': totals
            }
            
            # Validate and serialize the data
            serializer = MarketingAnalyticsSerializer(data=response_data)
            serializer.is_valid(raise_exception=True)
            
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error in MarketingAnalyticsView: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FilterOptionsView(BaseAnalyticsView):
    """
    API endpoint for fetching filter options (branches, departments, users) for a tenant
    """
    def options(self, request, *args, **kwargs):
        """Handle preflight CORS requests"""
        response = Response()
        response['Access-Control-Allow-Origin'] = '*'  # Or specific origin
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
        
    def get(self, request):
        try:
            print(f"FilterOptionsView called with params: {request.query_params}")
            
            tenant_id = self.get_tenant_id(request)
            if not tenant_id:
                print("No tenant_id found")
                return Response(
                    {"error": "Tenant ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Using tenant_id: {tenant_id}")
            
            # Debug User model
            try:
                print(f"User model fields: {[f.name for f in User._meta.fields]}")
                all_users = User.objects.all()
                print(f"Total users in database: {all_users.count()}")
                tenant_users = User.objects.filter(tenant_id=tenant_id)
                print(f"Users for tenant {tenant_id}: {tenant_users.count()}")
            except Exception as e:
                print(f"Error accessing User model: {e}")
            
            # Debug Branch model
            try:
                print(f"Branch model fields: {[f.name for f in Branch._meta.fields]}")
                all_branches = Branch.objects.all()
                print(f"Total branches in database: {all_branches.count()}")
                tenant_branches = Branch.objects.filter(tenant_id=tenant_id)
                print(f"Branches for tenant {tenant_id}: {tenant_branches.count()}")
            except Exception as e:
                print(f"Error accessing Branch model: {e}")
            
            # Debug Department model
            try:
                print(f"Department model fields: {[f.name for f in Department._meta.fields]}")
                all_departments = Department.objects.all()
                print(f"Total departments in database: {all_departments.count()}")
                tenant_departments = Department.objects.filter(tenant_id=tenant_id)
                print(f"Departments for tenant {tenant_id}: {tenant_departments.count()}")
            except Exception as e:
                print(f"Error accessing Department model: {e}")
            
            try:
                # Get branches for this tenant
                branches = Branch.objects.filter(tenant_id=tenant_id)
                print(f"Found {branches.count()} branches")
                branch_data = [{'id': str(branch.id), 'name': branch.name} for branch in branches]
                print(f"Branch data: {branch_data}")
            except Exception as e:
                print(f"Error fetching branches: {e}")
                branch_data = []
            
            try:
                # Get departments for this tenant
                departments = Department.objects.filter(tenant_id=tenant_id)
                print(f"Found {departments.count()} departments")
                department_data = [{'id': str(dept.id), 'name': dept.name} for dept in departments]
                print(f"Department data: {department_data}")
            except Exception as e:
                print(f"Error fetching departments: {e}")
                department_data = []
            
            try:
                # Get users for this tenant
                users = User.objects.filter(tenant_id=tenant_id)
                print(f"Found {users.count()} users for tenant {tenant_id}")
                
                # Check if any users are found
                if users.count() == 0:
                    sample_user = User.objects.first()
                    if sample_user:
                        print(f"Sample user tenant_id: {sample_user.tenant_id}, Requested tenant_id: {tenant_id}")
                    else:
                        print("No users exist in the database")
                        
                # Apply role-based filtering to users
                user_role = request.user.role
                print(f"User role: {user_role}")
                
                if user_role == 'department_head':
                    users = users.filter(department_id=request.user.department_id)
                elif user_role == 'manager':
                    users = users.filter(
                        Q(manager_id=request.user.id) | Q(id=request.user.id)
                    )
                elif user_role == 'team_lead':
                    users = users.filter(
                        Q(team_lead_id=request.user.id) | Q(id=request.user.id)
                    )
                elif user_role not in ['admin']:
                    # Regular users can only see themselves
                    users = users.filter(id=request.user.id)
                
                print(f"After role filtering, found {users.count()} users")
                user_data = [{'id': str(user.id), 'name': f"{user.first_name} {user.last_name}".strip() or user.email} for user in users]
                print(f"User data: {user_data}")
            except Exception as e:
                print(f"Error fetching users: {e}")
                user_data = []
            
            # Return all filter options
            data = {
                'branches': branch_data,
                'departments': department_data,
                'users': user_data
            }
            
            print(f"Returning filter options: {len(branch_data)} branches, {len(department_data)} departments, {len(user_data)} users")
            return Response(data)
            
        except Exception as e:
            print(f"Unhandled error in FilterOptionsView: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 