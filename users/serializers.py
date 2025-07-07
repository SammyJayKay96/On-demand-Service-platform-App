from rest_framework import serializers
from .models import User, ServiceProviderProfile
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm password")

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name', 'phone_number', 'user_type')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone_number': {'required': False},
            'user_type': {'required': True} # Make user_type explicit during registration
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if attrs['user_type'] not in ['customer', 'provider']:
            raise serializers.ValidationError({"user_type": "User type must be 'customer' or 'provider'."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number'),
            user_type=validated_data['user_type']
        )
        user.set_password(validated_data['password'])
        user.save()

        # If user_type is 'provider', create a ServiceProviderProfile
        if user.user_type == 'provider':
            ServiceProviderProfile.objects.create(user=user)

        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'user_type', 'date_joined')


class ServiceProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True) # Display user details, but don't allow updating user via this serializer directly
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ServiceProviderProfile
        fields = ('id', 'user', 'email', 'bio', 'address', 'location', 'is_verified')
        read_only_fields = ('is_verified', 'user') # is_verified should be admin controlled

    # If you want to allow updating parts of the user model through this profile,
    # you'd need a more complex serializer, possibly with nested writes.
    # For now, profile updates are limited to profile-specific fields.
    # To update user details like name, phone, they should hit the User endpoint.
    # Or, this serializer's update method can be customized.

    def update(self, instance, validated_data):
        # Pop user data if you were to handle nested updates.
        # For now, only update profile fields.
        instance.bio = validated_data.get('bio', instance.bio)
        instance.address = validated_data.get('address', instance.address)
        instance.location = validated_data.get('location', instance.location)
        # instance.is_verified is not updated here by users
        instance.save()
        return instance
