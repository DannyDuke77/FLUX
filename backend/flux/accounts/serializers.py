from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from PIL import Image
from rest_framework.exceptions import AuthenticationFailed
from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress, EmailConfirmation
from django.db import transaction

from .models import User
from companies.models import Department
from .validators import normalize_kenyan_phone

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name'] = user.name
        token['email'] = user.email
        token['is_admin'] = user.is_admin
        token['is_superuser'] = user.is_superuser
        token['department'] = user.department.name
        token['department_id'] = str(user.department.id)
        token['company'] = str(user.company.name)
        token['company_logo'] = str(user.company.image_url()) if user.company.logo else None
        token["sub"] = str(user.id)
        return token
    
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            raise AuthenticationFailed("Invalid credentials, please try again.")

        email_obj = EmailAddress.objects.filter(
            user=self.user, 
            email=self.user.email
        ).first()

        if not email_obj or not email_obj.verified:
            if email_obj:
                pass
                # email_obj.send_confirmation(self.context['request'])
            
            raise AuthenticationFailed(
                "Your email is not verified. ****** A new link has been sent to your inbox."
            )

        return data
    
class CustomRegisterSerializer(RegisterSerializer):
    username = None

    name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(required=True)
    department = serializers.UUIDField(required=True)
        
    def validate_phone_number(self, value):
        return normalize_kenyan_phone(value)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['name'] = self.validated_data.get('name', '')
        data['email'] = self.validated_data.get('email', '')
        data['phone_number'] = self.validated_data.get('phone_number', '')
        data['department'] = self.validated_data.get('department', '')
        return data
    
    def validate(self, attrs):
        if attrs.get('password1') != attrs.get('password2'):
            raise serializers.ValidationError({
                'password2': ['The two password fields did not match.']
            })
        return super().validate(attrs)
    
    def validate_department(self, value):
        request = self.context.get('request')

        try:
            department = Department.objects.get(id=value)
        except Department.DoesNotExist:
            raise serializers.ValidationError("Department does not exist.")

        if department.company != request.user.company:
            raise serializers.ValidationError("Department must belong to your company.")

        return value
    
    def save(self, request):
        with transaction.atomic():
            user = super().save(request)
            
            name = self.validated_data.get('name', '')
            phone_number = self.validated_data.get('phone_number', '')
            department_id = self.validated_data.get('department')
            
            user.name = name
            user.phone_number = phone_number
            user.department_id = department_id
            user.company = request.user.company
            
            user.save()
            
            return user
    
class UserDetailSerializer(serializers.ModelSerializer):
    department_id = serializers.SerializerMethodField()

    def get_department_id(self, obj):
        return obj.department.id
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'phone_number', 'company', 'department', 'department_id', 'is_admin')
