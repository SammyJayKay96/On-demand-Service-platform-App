from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from .models import User, ServiceProviderProfile
from django.contrib.auth import get_user_model

UserModel = get_user_model()

class UserRegistrationLoginTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('user-register')
        self.token_obtain_url = reverse('token_obtain_pair')
        self.profile_url = reverse('user-profile')

        self.strong_password = 'ComplexPassword123!'
        self.customer_data = {
            'username': 'testcustomer',
            'email': 'customer@example.com',
            'password': self.strong_password,
            'password2': self.strong_password,
            'user_type': 'customer'
        }
        self.provider_data = {
            'username': 'testprovider',
            'email': 'provider@example.com',
            'password': self.strong_password,
            'password2': self.strong_password,
            'user_type': 'provider'
        }

    def test_customer_registration(self):
        response = self.client.post(self.register_url, self.customer_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(UserModel.objects.filter(email=self.customer_data['email']).exists())
        user = UserModel.objects.get(email=self.customer_data['email'])
        self.assertEqual(user.user_type, 'customer')
        self.assertFalse(hasattr(user, 'provider_profile'))

    def test_provider_registration_creates_profile(self):
        response = self.client.post(self.register_url, self.provider_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(UserModel.objects.filter(email=self.provider_data['email']).exists())
        user = UserModel.objects.get(email=self.provider_data['email'])
        self.assertEqual(user.user_type, 'provider')
        self.assertTrue(ServiceProviderProfile.objects.filter(user=user).exists())
        self.assertTrue(hasattr(user, 'provider_profile'))

    def test_user_login_and_get_profile(self):
        self.client.post(self.register_url, self.customer_data, format='json')
        login_payload = {'email': self.customer_data['email'], 'password': self.customer_data['password']}
        response = self.client.post(self.token_obtain_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn('access', response.data)

        access_token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        profile_response = self.client.get(self.profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK, profile_response.data)
        self.assertEqual(profile_response.data['email'], self.customer_data['email'])

    def test_registration_passwords_must_match(self):
        invalid_data = self.customer_data.copy()
        invalid_data['password2'] = 'wrongpassword'
        response = self.client.post(self.register_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_registration_duplicate_email(self):
        self.client.post(self.register_url, self.customer_data, format='json')
        response = self.client.post(self.register_url, self.customer_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

class ServiceProviderProfileTests(APITestCase):
    def setUp(self):
        self.strong_password = 'ComplexPassword123!' # Added for consistency
        self.provider_user = UserModel.objects.create_user(
            username='provideruser',
            email='provider@test.com',
            password=self.strong_password,
            user_type='provider'
        )
        # UserRegistrationSerializer creates the profile. If testing views directly, ensure profile exists.
        # For this test, assuming User model's save or a signal might create it, or it's created via registration.
        # Let's explicitly ensure it's created if not by user creation signal/override.
        self.provider_profile, created = ServiceProviderProfile.objects.get_or_create(user=self.provider_user)

        self.client = APIClient()
        self.client.force_authenticate(user=self.provider_user)
        # Ensure the URL name is correct as defined in your users/urls.py
        self.profile_url = reverse('provider-profile-detail')

    def test_get_provider_profile(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['user']['email'], self.provider_user.email)
        self.assertEqual(response.data['id'], self.provider_profile.id)

    def test_update_provider_profile(self):
        update_data = {
            'bio': 'Experienced handyman with 10 years of experience.',
            'address': '123 Main St, Anytown, USA',
            'location': '34.0522,-118.2437'
        }
        response = self.client.put(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.provider_profile.refresh_from_db()
        self.assertEqual(self.provider_profile.bio, update_data['bio'])

    def test_customer_cannot_access_provider_profile_endpoint(self):
        customer_user = UserModel.objects.create_user(
            username='customeruser2',
            email='customer2@test.com',
            password=self.strong_password, # Use strong password
            user_type='customer'
        )
        self.client.force_authenticate(user=customer_user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)

    def test_unauthenticated_cannot_access_provider_profile(self):
        unauth_client = APIClient()
        response = unauth_client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, response.data)
