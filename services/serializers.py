from rest_framework import serializers
from .models import ServiceCategory, Service, Booking
from users.serializers import UserSerializer, ServiceProviderProfileSerializer
from users.models import ServiceProviderProfile, User # Import User model

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    # provider_profile = ServiceProviderProfileSerializer(read_only=True) # Nested, can be verbose
    provider_profile_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceProviderProfile.objects.all(), source='provider_profile', write_only=True, required=False
        # Made required=False as view sets this. Alternative: remove from fields if view always sets.
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(), source='category', write_only=True
    )
    # For read operations, you might want to show more details of category and provider
    category = ServiceCategorySerializer(read_only=True)
    provider_email = serializers.EmailField(source='provider_profile.user.email', read_only=True)


    class Meta:
        model = Service
        fields = (
            'id', 'provider_profile_id', 'category_id', 'name', 'description',
            'base_rate', 'category', 'provider_email' # provider_profile
        )
        # If you use the nested serializer for provider_profile, add it to fields.

    def validate_provider_profile_id(self, value):
        # Ensure the user creating the service is the owner of the provider profile
        request = self.context.get('request')
        if request and hasattr(request.user, 'provider_profile'):
            if value != request.user.provider_profile:
                raise serializers.ValidationError("You can only create services for your own provider profile.")
        else:
            # This case might occur if the serializer is used in a context without a request
            # or by a user without a provider profile. Handle as per your app's logic.
            raise serializers.ValidationError("User does not have a provider profile or request context is missing.")
        return value


class BookingSerializer(serializers.ModelSerializer):
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(user_type='customer'), source='customer', write_only=True, required=False
        # Made required=False as view sets this.
    )
    # provider_profile_id = serializers.PrimaryKeyRelatedField(
    #     queryset=ServiceProviderProfile.objects.all(), source='provider_profile', write_only=True
    # )
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), source='service', write_only=True
    )

    # Read-only nested serializers for displaying details
    customer = UserSerializer(read_only=True)
    provider_profile = ServiceProviderProfileSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = (
            'id', 'customer_id', 'service_id', # 'provider_profile_id'
            'scheduled_time', 'address', 'location', 'status',
            'customer_notes', 'provider_notes',
            'customer', 'provider_profile', 'service',
            'requested_time', 'created_at', 'updated_at'
        )
        read_only_fields = ('status', 'provider_profile', 'requested_time', 'created_at', 'updated_at')
        # Provider profile is set based on the service chosen.
        # Status is managed by provider actions (accept/reject) or system events.

    def validate_customer_id(self, value):
        request = self.context.get('request')
        if request and request.user != value:
            raise serializers.ValidationError("You can only create bookings for yourself.")
        if value.user_type != 'customer':
            raise serializers.ValidationError("Only customers can create bookings.")
        return value

    def create(self, validated_data):
        service = validated_data['service']
        # Automatically set the provider_profile based on the chosen service
        validated_data['provider_profile'] = service.provider_profile

        # Ensure customer is making the booking for themselves (double check)
        request = self.context.get('request')
        if request and request.user != validated_data['customer']:
             raise serializers.ValidationError({"customer_id": "You can only create bookings for yourself."})

        booking = Booking.objects.create(**validated_data)
        return booking

class BookingUpdateStatusSerializer(serializers.ModelSerializer):
    """
    Serializer for provider to update booking status (e.g., confirm, reject).
    """
    class Meta:
        model = Booking
        fields = ('status',)

    def validate_status(self, value):
        # Define allowed transitions for providers
        allowed_statuses_for_provider = ['confirmed', 'rejected', 'in_progress', 'completed', 'cancelled_by_provider']
        if value not in allowed_statuses_for_provider:
            raise serializers.ValidationError(f"Invalid status. Provider can set status to: {', '.join(allowed_statuses_for_provider)}.")

        # Add more complex status transition logic if needed (e.g., cannot go from 'completed' to 'confirmed')
        # current_status = self.instance.status if self.instance else None
        # if current_status == 'completed' and value != 'completed':
        #     raise serializers.ValidationError("Cannot change status of a completed booking.")
        return value
