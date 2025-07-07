from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserRegistrationSerializer, UserSerializer, ServiceProviderProfileSerializer
from .models import User, ServiceProviderProfile
from rest_framework.permissions import IsAuthenticated, AllowAny

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny] # Anyone can register

class CustomTokenObtainPairView(TokenObtainPairView):
    # You can customize the response of the token obtain view here if needed
    # by overriding the post method or customizing the serializer.
    # For example, to include user details in the token response:
    # from .serializers import MyTokenObtainPairSerializer
    # serializer_class = MyTokenObtainPairSerializer
    pass

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Users can only access/update their own details
        return self.request.user

class ServiceProviderProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = ServiceProviderProfile.objects.all()
    serializer_class = ServiceProviderProfileSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users

    def get_queryset(self):
        # Filter to only allow a provider to see/edit their own profile
        if self.request.user.is_authenticated and hasattr(self.request.user, 'provider_profile'):
            return ServiceProviderProfile.objects.filter(user=self.request.user)
        return ServiceProviderProfile.objects.none() # Or handle error appropriately

    def get_object(self):
        # Retrieve the profile for the current logged-in user
        # This assumes that only providers will try to access their profile via this view.
        # If a non-provider user (who has a User account but no ServiceProviderProfile)
        # tries to PUT/PATCH, they won't have an object.
        # If a customer tries to GET /api/users/profile/, they will get a 404 if get_queryset returns none().
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(queryset) # Get object or raise 404
        self.check_object_permissions(self.request, obj) # Check permissions
        return obj

    def perform_update(self, serializer):
        # This check is somewhat redundant given get_object, but good for defense in depth.
        if serializer.instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to edit this profile.")
        serializer.save()

# Example of a view accessible only by admin (or specific group)
# from rest_framework.permissions import IsAdminUser
# class AllUsersView(generics.ListAPIView):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
#     permission_classes = [IsAdminUser]
