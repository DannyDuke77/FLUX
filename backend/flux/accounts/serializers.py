from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from PIL import Image
from rest_framework.exceptions import AuthenticationFailed
from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress, EmailConfirmation

from .models import User
from .validators import normalize_kenyan_phone

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['name'] = user.name
        token['email'] = user.email
        token['is_admin'] = user.is_admin
        token['department'] = user.department.name
        token['department_id'] = str(user.department.id)
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

    def save(self, request):
        adapter = get_adapter()
        user = adapter.new_user(request)

        self.cleaned_data = self.get_cleaned_data()

        user.name = self.cleaned_data.get('name')
        user.email = self.cleaned_data.get('email')
        user.phone_number = self.cleaned_data.get('phone_number')
        user.department_id = self.cleaned_data.get('department')

        adapter.save_user(request, user, self)

        return user
    
class UserDetailSerializer(serializers.ModelSerializer):
    department_id = serializers.SerializerMethodField()

    def get_department_id(self, obj):
        return obj.department.id
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'phone_number', 'department', 'department_id', 'is_admin')
