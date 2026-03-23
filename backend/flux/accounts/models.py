from django.db import models
import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, UserManager, PermissionsMixin

from .validators import normalize_kenyan_phone
from companies.models import BaseCompanyModel

# Create your models here.
class CustomUserManager(UserManager):
    def _create_user(self, name, email, password, **extra_fields):
        if not name:
            raise ValueError('The given name must be set')
        
        email = self.normalize_email(email)
        user = self.model(name=name, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_user(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(name, email, password, **extra_fields)
    
    def create_superuser(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(name, email, password, **extra_fields)
    
class Department(BaseCompanyModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
class User(AbstractBaseUser, PermissionsMixin, BaseCompanyModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True)

    is_admin = models.BooleanField(default=False)

    is_verified = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email
    
    
    def clean(self):
        super().clean()
        if self.phone_number:
            self.phone_number = normalize_kenyan_phone(self.phone_number)
