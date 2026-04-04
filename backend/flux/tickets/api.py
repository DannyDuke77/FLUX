from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.validators import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from django.db.models import Q
from rest_framework.viewsets import ReadOnlyModelViewSet
from django.shortcuts import get_object_or_404

from .models import Ticket, TicketStatusLog
from accounts.models import Department
from .serializers import TicketSerializer
from .services.reports import ReportService
from accounts.permissions import IsAdminUserCustom, IsEmailVerified

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

    # Add filtering, searching, ordering
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'department', 'assigned_to']
    search_fields = ['title', 'ticket_number']
    ordering_fields = ['priority', 'status', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Ticket.objects.all().filter(company=user.company)
        return Ticket.objects.filter(Q(company=user.company) | Q(assigned_to=user.department) | Q(department=user.department))

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            department=self.request.user.department,
            company=self.request.user.company
        )

    def perform_update(self, serializer):
        VALID_TRANSITIONS = {
            'open': ['in_progress', 'resolved', 'closed'],
            'in_progress': ['resolved', 'closed'],
            'resolved': ['open', 'closed'], 
            'closed': []
        }

        instance = self.get_object()
        old_status = instance.status
        new_status = self.request.data.get('status')
        note = self.request.data.get('resolution_note', '').strip()

        if instance.department == self.request.user.department:
            raise ValidationError({"error": "You cannot change a ticket created by your department."})

        if new_status and new_status != old_status:
            if old_status == 'closed':
                raise ValidationError({"error": "Cannot change status once it is closed."})

            allowed = VALID_TRANSITIONS.get(old_status, [])
            if new_status not in allowed:
                raise ValidationError({"error": f"Invalid transition from {old_status} to {new_status}."})

            if new_status == 'resolved' and not note:
                raise ValidationError({"resolution_note": "A resolution note is required to resolve a ticket."})
            
            if old_status == 'resolved' and new_status == 'open' and not note:
                raise ValidationError({"resolution_note": "A reason is required to re-open a resolved ticket."})

        updated_instance = serializer.save(_current_user=self.request.user)

        if new_status and new_status != old_status:
            log_entry = TicketStatusLog.objects.filter(
                ticket=updated_instance,
                new_status=new_status,
                company=self.request.user.company
            ).first()
            
            if log_entry:
                final_note = note if note else f"Status changed to {new_status}."
                log_entry.note = final_note
                log_entry.save()

    @action(detail=True, methods=['get'], url_path='export_detail_pdf')
    def export_detail_pdf(self, request, pk=None):
        ticket = self.get_object()
        return ReportService.generate_single_ticket_pdf(ticket)

    @action(detail=False, methods=['get'], url_path='export_csv')
    def export_csv(self, request):
        queryset = self._get_filtered_report_queryset(request)
        return ReportService.generate_csv_report(queryset, request.user)

    @action(detail=False, methods=['get'], url_path='export_pdf')
    def export_pdf(self, request):
        queryset = self._get_filtered_report_queryset(request)
        if request.GET.get('department') == 'all':
            return ReportService.generate_pdf_report(queryset, request.user, 'all', None, request.GET.get('start'), request.GET.get('end'))

        department_id = request.GET.get('department')
        department = get_object_or_404(Department, id=department_id)
        return ReportService.generate_pdf_report(
            queryset, 
            request.user,
            request.GET.get('department', 'all'),
            department.name if department else None,
            request.GET.get('start'),
            request.GET.get('end')
        )

    def _get_filtered_report_queryset(self, request):
        """Shared logic to filter tickets for both report types"""
        user = request.user
        queryset = self.get_queryset().select_related('department', 'assigned_to')
        
        department = request.GET.get('department', 'all')
        if user.is_admin and department != 'all':
            queryset = queryset.filter(Q(department_id=department) | Q(assigned_to_id=department))

        start_date = request.GET.get('start')
        end_date = request.GET.get('end')
        if start_date and end_date:
            start = parse_date(start_date)
            end = parse_date(end_date)
            if start and end:
                queryset = queryset.filter(created_at__date__gte=start, created_at__date__lte=end)
        
        return queryset