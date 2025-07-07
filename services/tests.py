from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from users.models import User, ServiceProviderProfile
from .models import ServiceCategory, Service, Booking
from django.utils import timezone
import datetime

class ServiceCategoryTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser('admin_cat_test', 'admin_cat@example.com', 'password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
        # Ensure your router registration for ServiceCategoryViewSet uses 'servicecategory' as basename
        self.category_list_url = reverse('servicecategory-list')

    def test_admin_can_create_service_category(self):
        data = {'name': 'Plumbing Test', 'description': 'All plumbing services for testing.'}
        response = self.client.post(self.category_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(ServiceCategory.objects.filter(name='Plumbing Test').exists())

    def test_list_service_categories(self):
        ServiceCategory.objects.create(name='Electrical Test', description='Electrical repairs testing.')
        # Unauthenticated client can also list categories based on AllowAny permission
        list_client = APIClient()
        response = list_client.get(self.category_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        categories_data = response.data
        if 'results' in categories_data: # Handle pagination
            categories_data = categories_data['results']
        self.assertTrue(any(cat['name'] == 'Electrical Test' for cat in categories_data))

class ServiceManagementTests(APITestCase):
    def setUp(self):
        self.provider_user = User.objects.create_user(
            username='testprovider_svc', email='provider_svc@example.com', password='password123', user_type='provider'
        )
        # Explicitly create ServiceProviderProfile for tests if not created by a signal/model save override
        self.provider_profile, _ = ServiceProviderProfile.objects.get_or_create(user=self.provider_user)

        self.category = ServiceCategory.objects.create(name='Cleaning Test', description='Home cleaning services for testing.')

        self.client = APIClient()
        self.client.force_authenticate(user=self.provider_user)

        self.service_list_url = reverse('service-list')

    def test_provider_can_create_service(self):
        data = {
            'name': 'Basic Home Cleaning Test',
            'description': '2 hours of basic home cleaning test.',
            'base_rate': '50.00',
            'category_id': self.category.id,
            # provider_profile_id is set by the view based on request.user
        }
        response = self.client.post(self.service_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(Service.objects.filter(name='Basic Home Cleaning Test', provider_profile=self.provider_profile).exists())

    def test_list_services_unauthenticated(self):
        Service.objects.create(
            provider_profile=self.provider_profile,
            category=self.category,
            name='Deep Cleaning Test',
            description='Full day deep clean test.',
            base_rate='200.00'
        )
        list_client = APIClient() # Unauthenticated
        response = list_client.get(self.service_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        services_data = response.data
        if 'results' in services_data: # Handle pagination
            services_data = services_data['results']
        self.assertTrue(any(s['name'] == 'Deep Cleaning Test' for s in services_data ))


class BookingTests(APITestCase):
    def setUp(self):
        self.customer_user = User.objects.create_user(
            username='customer_book_test', email='customer_book@example.com', password='password123', user_type='customer'
        )
        self.provider_user = User.objects.create_user(
            username='provider_book_test', email='provider_book@example.com', password='password123', user_type='provider'
        )
        self.provider_profile, _ = ServiceProviderProfile.objects.get_or_create(user=self.provider_user)
        self.category = ServiceCategory.objects.create(name='Repair Test', description='Fixing things for testing.')
        self.service = Service.objects.create(
            provider_profile=self.provider_profile,
            category=self.category,
            name='Leaky Faucet Repair Test',
            description='Fix that drip! Test.',
            base_rate='75.00'
        )

        self.client = APIClient()
        self.booking_list_url = reverse('booking-list')

    def test_customer_can_create_booking(self):
        self.client.force_authenticate(user=self.customer_user)
        booking_data = {
            'service_id': self.service.id,
            'address': '123 Test St, Testville',
            'scheduled_time': (timezone.now() + datetime.timedelta(days=5)).isoformat(),
            'customer_notes': 'Please call before arriving for test.',
        }
        response = self.client.post(self.booking_list_url, booking_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created_booking = Booking.objects.get(id=response.data['id'])
        self.assertEqual(created_booking.customer, self.customer_user)
        self.assertEqual(created_booking.provider_profile, self.provider_profile) # Derived from service
        self.assertEqual(created_booking.status, 'pending')

    def test_provider_can_view_their_bookings(self):
        Booking.objects.create(
            customer=self.customer_user, provider_profile=self.provider_profile, service=self.service,
            address="Provider's test booking view", scheduled_time=timezone.now() + datetime.timedelta(days=2)
        )
        self.client.force_authenticate(user=self.provider_user)
        response = self.client.get(self.booking_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        bookings_data = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(any(b['provider_profile']['id'] == self.provider_profile.id for b in bookings_data))

    def test_provider_can_update_booking_status(self):
        booking = Booking.objects.create(
            customer=self.customer_user, provider_profile=self.provider_profile, service=self.service,
            address="12 Main St Test Update", scheduled_time=timezone.now() + datetime.timedelta(days=3), status='pending'
        )
        self.client.force_authenticate(user=self.provider_user)
        update_status_url = reverse('booking-update-status', kwargs={'pk': booking.pk})

        response = self.client.patch(update_status_url, {'status': 'confirmed'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'confirmed')

    def test_customer_cannot_update_booking_status_via_provider_action(self):
        booking = Booking.objects.create(
            customer=self.customer_user, provider_profile=self.provider_profile, service=self.service,
            address="12 Main St Test Cust Update Fail", status='pending'
        )
        self.client.force_authenticate(user=self.customer_user)
        update_status_url = reverse('booking-update-status', kwargs={'pk': booking.pk})

        response = self.client.patch(update_status_url, {'status': 'confirmed'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_customer_can_cancel_their_booking(self):
        booking = Booking.objects.create(
            customer=self.customer_user, provider_profile=self.provider_profile, service=self.service,
            address="For cancellation test by customer", status='confirmed'
        )
        self.client.force_authenticate(user=self.customer_user)
        cancel_url = reverse('booking-cancel-booking', kwargs={'pk': booking.pk})
        response = self.client.post(cancel_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'cancelled_by_customer')
