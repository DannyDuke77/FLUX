from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from accounts.permissions import IsAdminUserCustom
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
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Company.objects.all()
        return Company.objects.filter(id=user.company.id)
    
    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all().filter
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminUserCustom]
    pagination_class = CustomPagination

    def get_queryset(self):
        user = self.request.user
        return Department.objects.filter(company=user.company) if not user.is_superuser else Department.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company
        )

    def perform_update(self, serializer):
        serializer.save()