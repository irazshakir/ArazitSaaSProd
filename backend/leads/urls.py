from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, LeadActivityViewSet, LeadNoteViewSet,
    LeadDocumentViewSet, LeadEventViewSet, LeadProfileViewSet,
    LeadOverdueViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'lead-activities', LeadActivityViewSet)
router.register(r'lead-notes', LeadNoteViewSet)
router.register(r'lead-documents', LeadDocumentViewSet)
router.register(r'lead-events', LeadEventViewSet)
router.register(r'lead-profiles', LeadProfileViewSet)
router.register(r'lead-overdues', LeadOverdueViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    # IMPORTANT: Custom actions must be defined BEFORE including router.urls
    # Filtered lead lists
    path('leads/by-role/', LeadViewSet.as_view({'get': 'by_role'}), name='leads-by-role'),
    path('leads/by-type/', LeadViewSet.as_view({'get': 'by_type'}), name='leads-by-type'),
    path('leads/by-status/', LeadViewSet.as_view({'get': 'by_status'}), name='leads-by-status'),
    path('leads/by-branch/', LeadViewSet.as_view({'get': 'by_branch'}), name='leads-by-branch'),
    path('leads/overdue/', LeadViewSet.as_view({'get': 'overdue'}), name='leads-overdue'),
    
    # Lead-specific actions
    path('leads/<uuid:pk>/notes/', LeadViewSet.as_view({'get': 'get_notes'}), name='lead-notes'),
    path('leads/<uuid:pk>/add-note/', LeadViewSet.as_view({'post': 'add_note'}), name='lead-add-note'),
    path('leads/<uuid:pk>/activities/', LeadViewSet.as_view({'get': 'get_activities'}), name='lead-activities'),
    path('leads/<uuid:pk>/add-activity/', LeadViewSet.as_view({'post': 'add_activity'}), name='lead-add-activity'),
    path('leads/<uuid:pk>/upload-document/', LeadViewSet.as_view({'post': 'upload_document'}), name='lead-upload-document'),
    path('leads/<uuid:pk>/update-profile/', LeadViewSet.as_view({'post': 'update_profile'}), name='lead-update-profile'),
    path('leads/<uuid:pk>/mark-overdue/', LeadViewSet.as_view({'post': 'mark_overdue'}), name='lead-mark-overdue'),
    path('leads/<uuid:pk>/resolve-overdue/', LeadViewSet.as_view({'post': 'resolve_overdue'}), name='lead-resolve-overdue'),
    path('leads/<uuid:pk>/assign/', LeadViewSet.as_view({'post': 'assign'}), name='lead-assign'),
    path('leads/<uuid:pk>/update-status/', LeadViewSet.as_view({'post': 'update_status'}), name='lead-update-status'),
    path('leads/<uuid:pk>/update-activity-status/', LeadViewSet.as_view({'post': 'update_activity_status'}), name='lead-update-activity-status'),
    
    # Bulk upload endpoint
    path('leads/bulk-upload/', LeadViewSet.as_view({'post': 'bulk_upload'}), name='leads-bulk-upload'),
    
    # Notification endpoints
    path('notifications/<uuid:pk>/mark-as-read/', NotificationViewSet.as_view({'post': 'mark_as_read'}), name='notification-mark-as-read'),
    path('notifications/mark-all-as-read/', NotificationViewSet.as_view({'post': 'mark_all_as_read'}), name='notification-mark-all-as-read'),
    path('notifications/unread-count/', NotificationViewSet.as_view({'get': 'unread_count'}), name='notification-unread-count'),
    
    # Include router URLs AFTER the custom actions
    path('', include(router.urls)),
] 