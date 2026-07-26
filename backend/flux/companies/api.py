from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType
from django.utils.encoding import force_str

from accounts.permissions import IsAdminUserCustom, IsAdminOrReadOnly
from .models import Company, Department
from .serializers import CompanySerializer, DepartmentSerializer


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })
    
class CompanyViewSet(ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    pagination_class = CustomPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUserCustom()]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Company.objects.all()
        return Company.objects.filter(id=user.company.id)
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        # 1. Grab the current unedited record from the database
        instance = self.get_object()
        
        # 2. Track changes with old and new values
        log_messages = []
        data = self.request.data

        # Track text fields
        for field in ['name', 'email', 'phone_number']:
            if field in data:
                old_val = getattr(instance, field) or "None"
                new_val = data[field]
                
                if str(new_val) != str(old_val):
                    friendly_name = field.replace('_', ' ').capitalize()
                    log_messages.append(f"Changed {friendly_name} from '{old_val}' to '{new_val}'")
        
        # Track logo changes separately
        if 'logo' in self.request.FILES:
            log_messages.append("Updated company logo image")

        # 3. Save the changes through the serializer
        updated_instance = serializer.save()

        # 4. Log the changes
        if log_messages:
            # Combine the changes into a single message
            full_message = f"{'; '.join(log_messages)} via Profile API Dashboard."
            
            LogEntry.objects.log_action(
                user_id=self.request.user.id,
                content_type_id=ContentType.objects.get_for_model(updated_instance).id,
                object_id=updated_instance.id,
                object_repr=force_str(updated_instance),
                action_flag=CHANGE,
                change_message=full_message
            )

class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    pagination_class = CustomPagination

    def get_queryset(self):
        user = self.request.user
        return Department.objects.filter(company=user.company, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company
        )

    def perform_update(self, serializer):
        serializer.save()