from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ServiceProviderProfile

class UserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'username', 'phone_number', 'user_type', 'is_staff', 'is_active')
    list_filter = ('user_type', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'username', 'phone_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('User Type', {'fields': ('user_type',)}),
    )
    search_fields = ('email', 'username', 'phone_number')
    ordering = ('email',)

class ServiceProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'address', 'location', 'is_verified')
    search_fields = ('user__email', 'user__username', 'address')
    list_filter = ('is_verified',)
    raw_id_fields = ('user',) # Easier to select user

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'

admin.site.register(User, UserAdmin)
admin.site.register(ServiceProviderProfile, ServiceProviderProfileAdmin)
