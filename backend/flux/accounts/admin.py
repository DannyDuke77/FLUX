from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, Department

# Register your models here.
@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('name', 'email', 'company', 'is_active', 'is_admin', 'is_superuser')
    search_fields = ('name', 'email', 'company__name')
    list_filter = ('company', 'is_active', 'is_admin', 'is_superuser')

    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'phone_number', 'department')}),
        ('Company', {'fields': ('company',)}),
        ('Permissions', {'fields': ('is_active', 'is_admin', 'is_staff', 'is_superuser')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'company', 'password1', 'password2'),
        }),
    )

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'is_active')
    search_fields = ('name', 'company__name')
    list_filter = ('company', 'is_active')