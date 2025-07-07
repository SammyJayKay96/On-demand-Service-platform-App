from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('customer', 'Customer'),
        ('provider', 'Service Provider'),
    )
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='customer')

    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] # Still require username for superuser creation, but email is login

    def __str__(self):
        return self.email

class ServiceProviderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    bio = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    # For simplicity, using CharField for location. In a real app, consider GeoDjango or separate lat/long fields.
    location = models.CharField(max_length=255, blank=True, help_text="Latitude,Longitude or general area")
    is_verified = models.BooleanField(default=False) # For KYC
    # Add other fields like experience, certifications as needed later

    def __str__(self):
        return f"{self.user.email} - Profile"
