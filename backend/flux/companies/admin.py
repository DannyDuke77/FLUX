from django.contrib import admin

from .models import Company
# Register your models here.

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone_number', 'is_active', 'created_at')
    search_fields = ('name', 'email')
    list_filter = ('is_active', 'created_at')