from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from .permissions import IsCompanyAdmin
from accounts.permissions import IsAdminUserCustom
from accounts.models import User
from companies.models import Department
from tickets.models import Ticket

class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    # GET /api/admin/dashboard/
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        company = request.user.company

        total_users = User.objects.filter(company=company).count()
        total_departments = Department.objects.filter(company=company).count()
        total_tickets = Ticket.objects.filter(company=company).count()

        tickets_by_status = (
            Ticket.objects.filter(company=company)
            .values('status')
            .annotate(count=Count('id'))
        )
        tickets_by_status_dict = {item['status']: item['count'] for item in tickets_by_status}

        users_per_department = (
            User.objects.filter(company=company)
            .values('department__name')
            .annotate(count=Count('id'))
        )

        return Response({
            "total_users": total_users,
            "total_departments": total_departments,
            "total_tickets": total_tickets,
            "tickets_by_status": tickets_by_status_dict,
            "users_per_department": users_per_department,
        })

    # PATCH /api/admin/dashboard/users/{id}/
    @action(detail=True, methods=['patch'])
    def patch_user(self, request, pk=None):
        # Example: update is_admin or department
        user = User.objects.get(pk=pk, company=request.user.company)
        user.is_admin = request.data.get('is_admin', user.is_admin)
        dept_id = request.data.get('department')
        if dept_id:
            user.department_id = dept_id
        user.save()
        return Response({"status": "ok"})