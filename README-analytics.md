# Analytics Service Architecture

This document outlines the architecture of the analytics service for our SaaS-based Multi-Tenant CRM system.

## Overview

The analytics service provides a unified approach to accessing analytics data with proper tenant isolation and role-based access controls. Rather than creating separate analytics applications for each role, we've implemented a single, secure analytics service with built-in filtering based on user roles.

## Key Components

### Frontend

1. **Analytics Service** (`frontend/src/services/analyticsService.js`)
   - Centralizes all analytics data access
   - Implements tenant isolation middleware
   - Applies role-based filtering to all queries
   - Provides permission checking for UI elements

2. **Dashboard Component** (`frontend/src/components/dashboard/Dashboard.jsx`)
   - Shows summary analytics
   - Uses the analytics service to fetch data
   - Conditionally renders UI elements based on user permissions

3. **Analytical Report Component** (`frontend/src/components/analytics/AnalyticalReport.jsx`)
   - Provides detailed analytics reports
   - Implements filtering capabilities
   - Respects role-based access controls

### Backend

1. **Base Analytics View** (`backend-example/analytics/views.py`)
   - Abstract base class for all analytics endpoints
   - Implements tenant isolation
   - Applies role-based query filtering
   - Handles date range filtering

2. **Specific Analytics Endpoints**
   - `DashboardStatsView` - Basic dashboard statistics
   - `LeadAnalyticsView` - Lead source and status analysis
   - `UserPerformanceView` - User performance metrics
   - `SalesAnalyticsView` - Sales data analysis
   - `ConversionFunnelView` - Conversion funnel metrics

3. **Analytics Permissions** (`backend-example/analytics/permissions.py`)
   - Custom permission class to enforce role-based access
   - Ensures users can only access data they are authorized to see

## Role-Based Access Matrix

| Role           | View All Branches | View All Depts | User Performance | Lead Analysis | Sales Analysis | Conversion Metrics |
|----------------|-------------------|----------------|------------------|---------------|----------------|-------------------|
| Admin          | ✅                | ✅             | ✅               | ✅            | ✅             | ✅                |
| Department Head| ❌                | ✅             | ✅               | ✅            | ✅             | ✅                |
| Manager        | ❌                | ❌             | ✅               | ✅            | ✅             | ✅                |
| Team Lead      | ❌                | ❌             | ✅               | ✅            | ✅             | ✅                |
| Agent          | ❌                | ❌             | Self-only        | ✅            | ❌             | ❌                |

## Data Access Filters by Role

- **Admin**: Can view all data for their tenant
- **Department Head**: Filtered to their department
- **Manager**: Filtered to team leads and agents under them
- **Team Lead**: Filtered to agents in their team
- **Agent** (Sales, Support, Processor): Filtered to their own data only

## Implementation Notes

1. **Tenant Isolation**: Every query is automatically filtered by tenant_id, ensuring complete data separation between tenants.

2. **Middleware Approach**: The role-based filtering is implemented as middleware that runs before any data is returned to the client.

3. **UI Permission Flags**: UI elements are conditionally rendered based on permission checks, ensuring users only see what they're allowed to access.

4. **Fallback Mechanism**: When API calls fail, the frontend falls back to dummy data for a smooth user experience during development.

## Security Considerations

- All analytics queries enforce tenant isolation as the first layer of security
- Role-based filtering is applied after tenant isolation
- Permission checks are performed on both frontend and backend
- Authentication is required for all analytics endpoints

## Future Enhancements

1. **Caching Layer**: Implement Redis caching for frequently accessed analytics data
2. **Export Capabilities**: Add Excel/PDF export functionality for reports
3. **Customizable Dashboards**: Allow users to customize their analytics views
4. **Real-time Analytics**: Implement WebSocket connections for real-time updates
5. **AI Insights**: Add ML-powered insights and recommendations based on analytics data 