from django.urls import path
from .views import UserRegistrationView, UserDetailView, ServiceProviderProfileDetailView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserDetailView.as_view(), name='user-profile'), # For current user's details
    path('provider-profile/', ServiceProviderProfileDetailView.as_view(), name='provider-profile-detail'),
]
