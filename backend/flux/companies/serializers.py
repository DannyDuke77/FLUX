from rest_framework import serializers
from PIL import Image

from .models import Company, Department

class CompanySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'email', 'phone_number', 'logo', 'image_url', 'created_at']

    def validate_logo(self, value):
        max_size = 2 * 1024 * 1024  # 2MB
        if value and value.size > max_size:
            raise serializers.ValidationError("Logo size must be less than 2MB.")
        
        img = Image.open(value)
        max_width, max_height = 500, 500
        if img.width > max_width or img.height > max_height:
            raise serializers.ValidationError(f"Logo dimensions must be at most {max_width}x{max_height} pixels.")
        
        if value and not value.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError("Logo must be a JPG or PNG image.")
        
        return value
        
    def get_image_url(self, obj):
        return obj.image_url() if obj.logo else None
    

class DepartmentSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    def get_company_name(self, obj):
        return obj.company.name if obj.company else None
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'company', 'company_name','is_active']