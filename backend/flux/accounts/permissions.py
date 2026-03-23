from rest_framework.permissions import BasePermission
from rest_framework import permissions

class IsAdminUserCustom(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_admin
        )

class IsEmailVerified(permissions.BasePermission):
    message = "You must verify your email address to access this resource."

    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.emailaddress_set.filter(verified=True).exists()
        )