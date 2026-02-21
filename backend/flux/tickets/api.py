from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.validators import ValidationError
from django.db.models import Q

from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Ticket
from accounts.models import Department
from .serializers import TicketSerializer, DepartmentSerializer

class CustomPagination(PageNumberPagination):
    page_size = 2
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

class DepartmentViewSet(ReadOnlyModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

class TicketViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    pagination_class = CustomPagination

    # Add filtering, searching, ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['title', 'ticket_number']
    ordering_fields = ['priority', 'status', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.all()
        if not user.is_admin:
            qs = qs.filter(
                Q(assigned_to=user.department) | 
                Q(department=user.department)
            )

            print("User:", user, "Department:", user.department)
            print("Queryset:", qs)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            department=self.request.user.department
        )

    def perform_update(self, serializer):
        VALID_TRANSITIONS = {
            'open': ['in_progress', 'resolved', 'closed'],
            'in_progress': ['resolved', 'closed'],
            'resolved': [], # Locked
            'closed': []    # Locked
        }

        instance = self.get_object() # Current ticket in DB
        new_status = self.request.data.get('status')

        if new_status and new_status != instance.status:
            if instance.status in ['resolved', 'closed']:
                raise ValidationError(f"Cannot change status once it is {instance.status}.")

            allowed = VALID_TRANSITIONS.get(instance.status, [])
            if new_status not in allowed:
                raise ValidationError(f"Invalid transition from {instance.status} to {new_status}.")

        serializer.save(_current_user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "tickets": serializer.data,
        })