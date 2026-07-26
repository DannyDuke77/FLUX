from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_date
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.models import Department
from accounts.permissions import IsAdminUserCustom, IsEmailVerified

from .models import Ticket, TicketStatusLog
from .serializers import TicketSerializer
from .services.reports import ReportService
from .services.ticket_service import validate_status_transition


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


class TicketViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, IsEmailVerified]
    serializer_class = TicketSerializer
    pagination_class = CustomPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'department', 'assigned_to']
    search_fields = ['title', 'ticket_number']
    ordering_fields = ['priority', 'status', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user

        base_qs = (
            Ticket.objects
            .select_related('department', 'assigned_to', 'created_by', 'company')
            .prefetch_related('status_logs__changed_by')
        )

        if user.is_admin:
            return base_qs.filter(company=user.company)
        
        
        return base_qs.filter(
            Q(company=user.company)
        ).filter(
            Q(department=user.department) | Q(assigned_to=user.department)
        )

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            department=self.request.user.department,
            company=self.request.user.company,
        )

    @transaction.atomic
    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = self.request.data.get('status')
        note = self.request.data.get('resolution_note', '').strip() or None

        if (not self.request.user.is_admin and instance.department == self.request.user.department):
            raise ValidationError(
                {"error": "You cannot change a ticket created by your department."}
            )

        status_is_changing = bool(new_status and new_status != old_status)

        if status_is_changing:
            validate_status_transition(
                old_status=old_status,
                new_status=new_status,
                note=note or '',
            )

        updated_instance = serializer.save(_current_user=self.request.user)

        if status_is_changing:
            TicketStatusLog.objects.create(
                ticket=updated_instance,
                old_status=old_status,
                new_status=new_status,
                changed_by=self.request.user,
                company=updated_instance.company,
                note=note,
            )

    @action(detail=True, methods=['get'], url_path='export_detail_pdf')
    def export_detail_pdf(self, request, pk=None):
        ticket = self.get_object()
        user = request.user
        return ReportService.generate_single_ticket_pdf(ticket, user)

    @action(detail=False, methods=['get'], url_path='export_csv')
    def export_csv(self, request):
        queryset = self._get_filtered_report_queryset(request)
        return ReportService.generate_csv_report(queryset, request.user)

    @action(detail=False, methods=['get'], url_path='export_pdf')
    def export_pdf(self, request):
        queryset = self._get_filtered_report_queryset(request)

        department_id = request.GET.get('department', 'all')
        department_name = None

        if department_id != 'all':
            try:
                department = Department.objects.get(
                    id=department_id,
                    company=request.user.company,
                )
                department_name = department.name
            except Department.DoesNotExist:
                raise ValidationError({"department": "Invalid department."})

        return ReportService.generate_pdf_report(
            queryset,
            request.user,
            department_name,
            request.GET.get('start'),
            request.GET.get('end'),
        )

    def _get_filtered_report_queryset(self, request):
        user = request.user

        queryset = (
            self.get_queryset()
            .select_related('department', 'assigned_to', 'created_by')
        )

        department_id = request.GET.get('department', 'all')
        start_date = request.GET.get('start')
        end_date = request.GET.get('end')

        if department_id != 'all':
            try:
                department = Department.objects.get(
                    id=department_id,
                    company=user.company,
                )
            except Department.DoesNotExist:
                raise ValidationError({"department": "Invalid department."})

            if user.is_admin:
                queryset = queryset.filter(
                    Q(department=department) | Q(assigned_to=department)
                )
            else:
                if str(user.department.id) != str(department_id):
                    raise ValidationError({"department": "Not allowed."})

                queryset = queryset.filter(
                    Q(department=user.department) | Q(assigned_to=user.department)
                )

        if start_date and end_date:
            start = parse_date(start_date)
            end = parse_date(end_date)

            if not start or not end:
                raise ValidationError({"date": "Invalid date format. Use YYYY-MM-DD."})

            if start > end:
                raise ValidationError({"date": "Start date cannot be after end date."})

            queryset = queryset.filter(
                created_at__date__gte=start,
                created_at__date__lte=end,
            )

        return queryset