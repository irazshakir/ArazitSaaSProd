from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include('rest_framework.urls')),
    path('api/', include('hajjPackages.urls')),  # Hajj Packages API endpoints
    path('api/', include('umrahPackages.urls')),  # Umrah Packages API endpoints
    path('api/', include('leads.urls')),  # Leads API endpoints
    path('api/', include('teams.urls')),  # Teams API endpoints
    path('api/', include('waba_int.urls')),  # Waba Integration API endpoints
    path('api/', include('company_settings.urls')),  # Company Settings API endpoints
    path('api/', include('invoices.urls')),  # Invoices API endpoints
    path('api/', include('analytics.urls')),  # Analytics API endpoints
    path('api/', include('flights.urls')),  # Flights API endpoints
    path('api/', include('study.urls')),  # Study API endpoints
    path('api/', include('canned_messages.urls')),  # Canned Messages API endpoints
    path('api/', include('location_routing.urls')),
    path('api/', include('fb_webhook.urls')),  # Facebook Webhook API endpoints
    path('api/development-projects/', include('developmentProjects.urls')),  # Development Projects API endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
