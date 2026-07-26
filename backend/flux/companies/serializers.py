from rest_framework import serializers
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile

from accounts.validators import normalize_kenyan_phone
from .models import Company, Department

class CompanySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'email', 'phone_number', 'logo', 'image_url', 'created_at']

    def validate_logo(self, value):
        max_size = 2 * 1024 * 1024  # 2MB

        if not value:
            return value

        if value.size > max_size:
            raise serializers.ValidationError("Logo must be under 2MB.")

        if value.content_type not in ['image/jpeg', 'image/png']:
            raise serializers.ValidationError("Only JPG and PNG images are allowed.")

        try:
            img = Image.open(value)
        except Exception:
            raise serializers.ValidationError("Invalid image file.")

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        max_dimension = 500
        if img.width > max_dimension or img.height > max_dimension:
            img.thumbnail((max_dimension, max_dimension))

        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)

        return ContentFile(buffer.read(), name=value.name)
    
    def validate_phone_number(self, value):
        return normalize_kenyan_phone(value)
    
    def get_image_url(self, obj):
        return obj.image_url() if obj.logo else None
    

class DepartmentSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'company', 'company_name','is_active']
        read_only_fields = ['company', 'is_active']