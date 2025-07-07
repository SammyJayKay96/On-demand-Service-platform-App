from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ServiceCategory, Service, Booking
from .serializers import ServiceCategorySerializer, ServiceSerializer, BookingSerializer, BookingUpdateStatusSerializer
from users.models import ServiceProviderProfile #, User
# Assuming permissions are in a separate file, e.g., project/app/permissions.py
# from .permissions import IsProviderAndOwnerOrReadOnly, IsCustomerOwnerOrProviderInteraction, IsProviderOfBookingService

# --- Start Basic Permissions (can be moved to permissions.py later) ---
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Instance must have an attribute named `user` or `customer`.
        # For Service, it's obj.provider_profile.user
        # For Booking, it's obj.customer
        if isinstance(obj, Service):
            return obj.provider_profile.user == request.user
        if isinstance(obj, Booking):
            return obj.customer == request.user
        return False

class IsProviderUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'provider'

class IsCustomerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'customer'
# --- End Basic Permissions ---


class ServiceCategoryViewSet(viewsets.ModelViewSet): # Changed from ReadOnlyModelViewSet
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    # permission_classes = [permissions.AllowAny] # Original

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Admin can Create/Update/Delete. Anyone can Read.
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else: # create, update, partial_update, destroy
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().select_related('category', 'provider_profile__user')
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsProviderUser()]
        if self.action in ['update', 'partial_update', 'destroy']:
            # Check if the user is the provider who owns this service object
            return [IsProviderUser(), IsOwnerOrReadOnly()] # IsOwnerOrReadOnly checks obj.provider_profile.user
        return [permissions.IsAuthenticatedOrReadOnly()] # List, retrieve are open or auth-read-only

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category_id')
        provider_id = self.request.query_params.get('provider_id') # ServiceProviderProfile ID

        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if provider_id:
            queryset = queryset.filter(provider_profile_id=provider_id)
        return queryset

    def perform_create(self, serializer):
        try:
            provider_profile = self.request.user.provider_profile
        except ServiceProviderProfile.DoesNotExist:
            raise permissions.PermissionDenied("You do not have a service provider profile.")

        # The serializer's 'provider_profile_id' field is write_only.
        # We should pass the actual provider_profile instance here.
        serializer.save(provider_profile=provider_profile)

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all().select_related('customer', 'provider_profile__user', 'service__category')
    serializer_class = BookingSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsCustomerUser()] # Only customers can create bookings
        if self.action in ['update', 'partial_update', 'destroy']:
            # Customer can modify/delete their own booking (with caveats, e.g. status)
            # Provider cannot directly update/delete bookings via these actions. They use 'update_status'.
            return [IsCustomerUser(), IsOwnerOrReadOnly()] # IsOwnerOrReadOnly checks obj.customer
        if self.action == 'update_status':
            return [IsProviderUser()] # Special action for providers
        # For list/retrieve, permissions are handled in get_queryset
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()

        if user.user_type == 'customer':
            return self.queryset.filter(customer=user)
        elif user.user_type == 'provider' and hasattr(user, 'provider_profile'):
            return self.queryset.filter(provider_profile=user.provider_profile)
        elif user.is_staff:
            return self.queryset
        return Booking.objects.none()

    def perform_create(self, serializer):
        # Customer is self.request.user. Provider is derived from service.
        # Serializer's 'customer_id' is write_only and validated.
        # Serializer's 'create' method handles setting provider_profile from service.
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['patch'], serializer_class=BookingUpdateStatusSerializer)
    def update_status(self, request, pk=None):
        booking = self.get_object() # Fetches based on get_queryset, so provider sees their bookings

        # Check if the current user is the provider for this booking
        if not (hasattr(request.user, 'provider_profile') and booking.provider_profile == request.user.provider_profile):
            return Response({'detail': 'You do not have permission to update this booking status.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return the full booking details using the main serializer
            full_booking_serializer = BookingSerializer(booking, context={'request': request})
            return Response(full_booking_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Potentially, customers could have a 'cancel_booking' action
    @action(detail=True, methods=['post'], permission_classes=[IsCustomerUser, IsOwnerOrReadOnly])
    def cancel_booking(self, request, pk=None):
        booking = self.get_object() # Ensures customer owns the booking
        if booking.status not in ['pending', 'confirmed']:
             return Response({'detail': f'Booking cannot be cancelled in its current status: {booking.status}.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Perform cancellation
        booking.status = 'cancelled_by_customer'
        booking.save(update_fields=['status'])
        full_booking_serializer = BookingSerializer(booking, context={'request': request})
        return Response(full_booking_serializer.data)
