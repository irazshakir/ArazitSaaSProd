import uuid
from django.db import models
from django.utils import timezone
from users.models import User, Tenant, Department, Branch
from hajjPackages.models import HajjPackage

class Lead(models.Model):
    """Model for tracking leads in the CRM system."""
    
    # Lead status choices - updated as requested
    STATUS_NEW = 'new'
    STATUS_QUALIFIED = 'qualified'
    STATUS_NON_POTENTIAL = 'non_potential'
    STATUS_PROPOSAL = 'proposal'
    STATUS_NEGOTIATION = 'negotiation'
    STATUS_WON = 'won'
    STATUS_LOST = 'lost'
    
    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_QUALIFIED, 'Qualified'),
        (STATUS_NON_POTENTIAL, 'Non-Potential'),
        (STATUS_PROPOSAL, 'Proposal'),
        (STATUS_NEGOTIATION, 'Negotiation'),
        (STATUS_WON, 'Won'),
        (STATUS_LOST, 'Lost'),
    ]
    
    # Lead source choices - updated as requested
    SOURCE_FB_FORM = 'fb_form'
    SOURCE_MESSENGER = 'messenger'
    SOURCE_WHATSAPP = 'whatsapp'
    SOURCE_INSTA_FORM = 'insta_form'
    SOURCE_WEBSITE_FORM = 'website_form'
    SOURCE_WEBSITE_CHAT = 'website_chat'
    SOURCE_REFERRAL = 'referral'
    SOURCE_WALK_IN = 'walk_in'
    
    SOURCE_CHOICES = [
        (SOURCE_FB_FORM, 'FB Form'),
        (SOURCE_MESSENGER, 'Messenger'),
        (SOURCE_WHATSAPP, 'WhatsApp'),
        (SOURCE_INSTA_FORM, 'Insta Form'),
        (SOURCE_WEBSITE_FORM, 'Website Form'),
        (SOURCE_WEBSITE_CHAT, 'Website Chat'),
        (SOURCE_REFERRAL, 'Referral'),
        (SOURCE_WALK_IN, 'Walk In'),
    ]
    
    # Lead type choices - will expand as more apps are added
    TYPE_HAJJ_PACKAGE = 'hajj_package'
    TYPE_CUSTOM_UMRAH = 'custom_umrah'
    TYPE_READYMADE_UMRAH = 'readymade_umrah'
    TYPE_FLIGHT = 'flight'
    TYPE_VISA = 'visa'
    TYPE_TRANSFER = 'transfer'
    TYPE_ZIYARAT = 'ziyarat'
    
    # Immigration industry lead types
    TYPE_STUDY_VISA = 'study_visa'
    TYPE_VISIT_VISA = 'visit_visa'
    TYPE_SKILLED_IMMIGRATION = 'skilled_immigration'
    TYPE_JOB_VISA = 'job_visa'
    TYPE_TRC = 'trc'
    TYPE_BUSINESS_IMMIGRATION = 'business_immigration'
    
    # Travel and Tourism industry lead types
    TYPE_TRAVEL_PACKAGE = 'travel_package'
    
    # Real Estate industry lead types
    TYPE_DEVELOPMENT_PROJECT = 'development_project'
    
    TYPE_CHOICES = [
        # Hajj & Umrah lead types
        (TYPE_HAJJ_PACKAGE, 'Hajj Package'),
        (TYPE_CUSTOM_UMRAH, 'Custom Umrah'),
        (TYPE_READYMADE_UMRAH, 'Readymade Umrah'),
        (TYPE_FLIGHT, 'Flight'),
        (TYPE_VISA, 'Visa'),
        (TYPE_TRANSFER, 'Transfer'),
        (TYPE_ZIYARAT, 'Ziyarat'),
        
        # Immigration lead types
        (TYPE_STUDY_VISA, 'Study Visa'),
        (TYPE_VISIT_VISA, 'Visit Visa'),
        (TYPE_SKILLED_IMMIGRATION, 'Skilled Immigration'),
        (TYPE_JOB_VISA, 'Job Visa'),
        (TYPE_TRC, 'TRC'),
        (TYPE_BUSINESS_IMMIGRATION, 'Business Immigration'),
        
        # Travel and Tourism lead types
        (TYPE_TRAVEL_PACKAGE, 'Travel Package'),
        
        # Real Estate lead types
        (TYPE_DEVELOPMENT_PROJECT, 'Development Project'),
    ]
    
    # Lead activity status
    ACTIVITY_STATUS_ACTIVE = 'active'
    ACTIVITY_STATUS_INACTIVE = 'inactive'
    
    ACTIVITY_STATUS_CHOICES = [
        (ACTIVITY_STATUS_ACTIVE, 'Active'),
        (ACTIVITY_STATUS_INACTIVE, 'Inactive'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='leads')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_leads')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    
    # Add branch field
    branch = models.ForeignKey(
        Branch, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='branch_leads'
    )
    
    # Add department field
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='department_leads'
    )
    
    # Lead type and related product
    lead_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_HAJJ_PACKAGE)
    hajj_package = models.ForeignKey(HajjPackage, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    
    # Add development_project field
    development_project = models.CharField(max_length=255, null=True, blank=True, help_text="Development project ID for real estate leads")
    
    # Add flight data field
    flight = models.JSONField(null=True, blank=True, help_text="Flight details for flight leads")
    
    # Basic lead information - updated as requested
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    
    # Query details stored as JSON
    query_for = models.JSONField(default=dict, help_text="Stores details like adults, children, infants, initial remarks")
    
    # Lead details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_WEBSITE_FORM)
    lead_activity_status = models.CharField(max_length=20, choices=ACTIVITY_STATUS_CHOICES, default=ACTIVITY_STATUS_ACTIVE)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_contacted = models.DateTimeField(null=True, blank=True)
    next_follow_up = models.DateTimeField(null=True, blank=True)
    
    # Additional data
    tags = models.JSONField(null=True, blank=True, help_text="Custom tags to categorize leads")
    custom_fields = models.JSONField(null=True, blank=True, help_text="Dynamic custom fields specific to tenant or lead type")
    
    # Add a field to store chat_id - can be null for leads not from WhatsApp
    chat_id = models.CharField(max_length=255, null=True, blank=True, help_text="WhatsApp chat ID if lead originated from WhatsApp")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lead_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['lead_activity_status']),
            models.Index(fields=['chat_id']),  # Add index for chat_id
            models.Index(fields=['branch']),   # Add index for branch
        ]
    
    def __str__(self):
        return f"{self.name} - {self.get_lead_type_display()}"
        
    # save method will be defined after LeadEvent class to avoid circular imports


class LeadEvent(models.Model):
    """Model for tracking lead lifecycle events."""
    
    # Event type choices
    EVENT_OPEN = 'open'
    EVENT_CLOSED = 'closed'
    EVENT_REOPENED = 'reopened'
    EVENT_WON = 'won'
    EVENT_LOST = 'lost'
    
    EVENT_CHOICES = [
        (EVENT_OPEN, 'Open'),
        (EVENT_CLOSED, 'Closed'),
        (EVENT_REOPENED, 'Reopened'),
        (EVENT_WON, 'Won'),
        (EVENT_LOST, 'Lost'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='events')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='lead_events')
    event_type = models.CharField(max_length=20, choices=EVENT_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lead_events')
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.lead.name} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"


# Define the Lead.save method after LeadEvent is defined to avoid circular imports
def lead_save(self, *args, **kwargs):
    """
    Override save method to track changes in activity_status and status,
    and create LeadEvent records accordingly.
    """
    # Check if this is an existing lead
    is_new = not self.pk
    
    # If not new, get the original instance to compare values
    if not is_new:
        try:
            original = Lead.objects.get(pk=self.pk)
            original_activity_status = original.lead_activity_status
            original_status = original.status
        except Lead.DoesNotExist:
            # Should not happen, but just in case
            original_activity_status = None
            original_status = None
    else:
        original_activity_status = None
        original_status = None
    
    # Save the instance first
    super(Lead, self).save(*args, **kwargs)
    
    # Handle LeadEvent creation based on various conditions
    
    # 1. For new leads, create an OPEN event - already handled in serializer
    # This is in the LeadSerializer.create method
    
    # 2. For lead_activity_status changing to inactive (CLOSED)
    if not is_new and original_activity_status == self.ACTIVITY_STATUS_ACTIVE and self.lead_activity_status == self.ACTIVITY_STATUS_INACTIVE:
        # Create CLOSED event
        LeadEvent.objects.create(
            lead=self,
            tenant=self.tenant,
            event_type=LeadEvent.EVENT_CLOSED,
            # We don't have request.user in model, so must be handled in view
            updated_by=self.assigned_to if self.assigned_to else self.created_by
        )
    
    # 3. For lead_activity_status changing from inactive to active (REOPENED)
    elif not is_new and original_activity_status == self.ACTIVITY_STATUS_INACTIVE and self.lead_activity_status == self.ACTIVITY_STATUS_ACTIVE:
        # Create REOPENED event
        LeadEvent.objects.create(
            lead=self,
            tenant=self.tenant,
            event_type=LeadEvent.EVENT_REOPENED,
            # We don't have request.user in model, so must be handled in view
            updated_by=self.assigned_to if self.assigned_to else self.created_by
        )
    
    # 4. For status changing to won (WON)
    if not is_new and original_status != self.STATUS_WON and self.status == self.STATUS_WON:
        # Create WON event
        LeadEvent.objects.create(
            lead=self,
            tenant=self.tenant,
            event_type=LeadEvent.EVENT_WON,
            updated_by=self.assigned_to if self.assigned_to else self.created_by
        )
    
    # 5. For status changing to lost (LOST)
    elif not is_new and original_status != self.STATUS_LOST and self.status == self.STATUS_LOST:
        # Create LOST event
        LeadEvent.objects.create(
            lead=self,
            tenant=self.tenant,
            event_type=LeadEvent.EVENT_LOST,
            updated_by=self.assigned_to if self.assigned_to else self.created_by
        )

# Assign the save method to Lead
Lead.save = lead_save


class LeadNote(models.Model):
    """Model for storing notes related to leads."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='notes')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='lead_notes')
    note = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lead_notes')
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Note for {self.lead.name} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"


class LeadDocument(models.Model):
    """Model for storing documents related to leads."""
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='documents')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='lead_documents')
    document_name = models.CharField(max_length=255, help_text="Name or description of the document")
    document_path = models.FileField(upload_to='lead_documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_lead_documents')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.document_name} for {self.lead.name}"


class LeadProfile(models.Model):
    """Model for evaluating and scoring lead profiles."""
    
    # Buying level choices
    BUYING_HIGH = 'high'
    BUYING_MEDIUM = 'medium'
    BUYING_LOW = 'low'
    BUYING_VERY_LOW = 'very_low'
    
    BUYING_CHOICES = [
        (BUYING_HIGH, 'High'),
        (BUYING_MEDIUM, 'Medium'),
        (BUYING_LOW, 'Low'),
        (BUYING_VERY_LOW, 'Very Low'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.OneToOneField(Lead, on_delete=models.CASCADE, related_name='profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='lead_profiles')
    qualified_lead = models.BooleanField(default=False)
    buying_level = models.CharField(max_length=20, choices=BUYING_CHOICES, default=BUYING_MEDIUM)
    previous_purchase = models.BooleanField(default=False)
    previous_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Additional scoring fields
    engagement_score = models.PositiveSmallIntegerField(default=0, help_text="Score based on engagement level (0-100)")
    response_time_score = models.PositiveSmallIntegerField(default=0, help_text="Score based on response time (0-100)")
    budget_match_score = models.PositiveSmallIntegerField(default=0, help_text="Score based on budget match (0-100)")
    overall_score = models.PositiveSmallIntegerField(default=0, help_text="Overall lead score (0-100)")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-overall_score']
    
    def __str__(self):
        return f"Profile for {self.lead.name}"
    
    def calculate_overall_score(self):
        """Calculate the overall score based on various factors."""
        # Base score from individual components
        base_score = (self.engagement_score + self.response_time_score + self.budget_match_score) / 3
        
        # Adjust for qualification
        if self.qualified_lead:
            base_score += 10
        
        # Adjust for buying level
        buying_level_scores = {
            self.BUYING_HIGH: 20,
            self.BUYING_MEDIUM: 10,
            self.BUYING_LOW: 0,
            self.BUYING_VERY_LOW: -10
        }
        base_score += buying_level_scores.get(self.buying_level, 0)
        
        # Adjust for previous purchase
        if self.previous_purchase:
            base_score += 15
            
            # Additional bonus for high-value previous purchases
            if self.previous_purchase_amount and self.previous_purchase_amount > 200000:
                base_score += min(15, self.previous_purchase_amount / 200000)
        
        # Ensure score is between 0 and 100
        self.overall_score = max(0, min(100, int(base_score)))
        return self.overall_score
    
    def save(self, *args, **kwargs):
        # Calculate overall score before saving
        self.calculate_overall_score()
        super().save(*args, **kwargs)


class LeadOverdue(models.Model):
    """Model for tracking overdue leads."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='overdue_records')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='lead_overdues')
    overdue = models.BooleanField(default=True)
    lead_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='overdue_leads')
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        status = "Overdue" if self.overdue else "Resolved"
        return f"{status} lead: {self.lead.name} ({self.timestamp.strftime('%Y-%m-%d')})"
    
    def resolve(self):
        """Mark the overdue lead as resolved."""
        self.overdue = False
        self.resolved_at = timezone.now()
        self.save()


class LeadActivity(models.Model):
    """Model for tracking activities related to leads."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='lead_activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='lead_activities')
    
    activity_type = models.CharField(max_length=100)  # Changed to simple CharField
    description = models.TextField()
    
    # For tasks
    due_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Lead Activities'
    
    def __str__(self):
        return f"{self.activity_type} for {self.lead.name}"
