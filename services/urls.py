from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceCategoryViewSet, ServiceViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='servicecategory')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]
