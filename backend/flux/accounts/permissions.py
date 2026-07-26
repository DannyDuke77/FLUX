from rest_framework.permissions import BasePermission, SAFE_METHODS
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
    
class IsAdminOrReadOnly(BasePermission):
    """
    Allows read access to authenticated users, but write operations
    are restricted to admin users.
    """
    def has_permission(self, request, view):
        # Grant access for safe methods (GET, HEAD, OPTIONS)
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed if the user is an admin
        return request.user and request.user.is_authenticated and request.user.is_admin