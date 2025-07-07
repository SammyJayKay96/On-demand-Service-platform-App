from django.db import models
from users.models import ServiceProviderProfile, User

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    # icon = models.ImageField(upload_to='category_icons/', blank=True, null=True) # Future enhancement

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Service Categories"

class Service(models.Model):
    provider_profile = models.ForeignKey(ServiceProviderProfile, on_delete=models.CASCADE, related_name='services_offered')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField()
    base_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base rate for the service")
    # duration = models.DurationField(null=True, blank=True, help_text="Estimated duration of the service") # Future enhancement
    # is_active = models.BooleanField(default=True) # Future enhancement

    def __str__(self):
        return f"{self.name} by {self.provider_profile.user.email}"

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled_by_customer', 'Cancelled by Customer'),
        ('cancelled_by_provider', 'Cancelled by Provider'),
        ('rejected', 'Rejected'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings_as_customer', limit_choices_to={'user_type': 'customer'})
    provider_profile = models.ForeignKey(ServiceProviderProfile, on_delete=models.CASCADE, related_name='bookings_as_provider')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, related_name='bookings')

    scheduled_time = models.DateTimeField(null=True, blank=True, help_text="For scheduled bookings")
    requested_time = models.DateTimeField(auto_now_add=True, help_text="Time the booking was requested")

    address = models.TextField(help_text="Full address for the service")
    # For simplicity, using CharField for location. In a real app, consider GeoDjango or separate lat/long fields.
    location = models.CharField(max_length=255, blank=True, help_text="Latitude,Longitude of service location if different from address")

    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending')

    customer_notes = models.TextField(blank=True, help_text="Notes from the customer")
    provider_notes = models.TextField(blank=True, help_text="Notes from the provider")

    # Payment related fields (to be expanded later)
    # total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # payment_status = models.CharField(max_length=20, default='pending') # e.g., pending, paid, failed

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking for {self.service.name if self.service else 'N/A'} by {self.customer.email} with {self.provider_profile.user.email}"

    class Meta:
        ordering = ['-requested_time']
