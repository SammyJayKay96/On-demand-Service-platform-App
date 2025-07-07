from django.contrib import admin
from .models import ServiceCategory, Service, Booking

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider_email', 'category', 'base_rate')
    search_fields = ('name', 'provider_profile__user__email', 'category__name')
    list_filter = ('category', 'provider_profile__is_verified')
    raw_id_fields = ('provider_profile', 'category')

    def provider_email(self, obj):
        return obj.provider_profile.user.email
    provider_email.short_description = 'Provider Email'

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_email', 'provider_email', 'service_name', 'status', 'scheduled_time', 'requested_time')
    search_fields = (
        'customer__email',
        'provider_profile__user__email',
        'service__name',
        'address'
    )
    list_filter = ('status', 'scheduled_time', 'requested_time', 'service__category')
    raw_id_fields = ('customer', 'provider_profile', 'service')
    date_hierarchy = 'requested_time'
    ordering = ('-requested_time',)

    fieldsets = (
        ('Core Info', {
            'fields': ('customer', 'provider_profile', 'service', 'status')
        }),
        ('Time & Location', {
            'fields': ('scheduled_time', 'requested_time', 'address', 'location')
        }),
        ('Notes', {
            'fields': ('customer_notes', 'provider_notes')
        }),
        # ('Payment Info', { # To be added later
        #     'fields': ('total_amount', 'payment_status'),
        #     'classes': ('collapse',) # Collapsed by default
        # }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('requested_time', 'created_at', 'updated_at')

    def customer_email(self, obj):
        return obj.customer.email
    customer_email.short_description = 'Customer'

    def provider_email(self, obj):
        return obj.provider_profile.user.email
    provider_email.short_description = 'Provider'

    def service_name(self, obj):
        return obj.service.name if obj.service else "N/A"
    service_name.short_description = 'Service'
