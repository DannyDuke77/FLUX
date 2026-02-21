import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

from accounts.models import Department
import random


def generate_ticket_number():
    """Generate a unique ticket number with date and random digits."""
    date_str = timezone.now().strftime('%Y%m%d')
    rand = random.randint(100, 999)
    return f"{date_str}-{rand}"


class Ticket(models.Model):

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Human-readable unique ticket number
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)

    # Core ticket info
    title = models.CharField(max_length=255)
    description = models.TextField()

    # Department that raised the ticket (auto-filled)
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='tickets_created',
        editable=False
    )

    # Department assigned to handle the ticket (required)
    assigned_to = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='tickets_assigned'
    )

    # User who created the ticket
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets_created'
    )

    # Ticket status and priority
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.department.name}] {self.title} ({self.status})"

    def save(self, *args, **kwargs):
        # 1. Check if this is an update or a new creation
        if self.pk:
            try:
                previous = Ticket.objects.get(pk=self.pk)
                if previous.status != self.status:
                    user = getattr(self, '_current_user', None)
                    TicketStatusLog.objects.create(
                        ticket=self,
                        old_status=previous.status,
                        new_status=self.status,
                        changed_by=user
                    )
            except Ticket.DoesNotExist:
                pass
        
        if not self.pk and self.created_by:
            self.department = self.created_by.department

        if not self.ticket_number:
            while True:
                number = generate_ticket_number()
                if not Ticket.objects.filter(ticket_number=number).exists():
                    self.ticket_number = number
                    break
        
        super().save(*args, **kwargs)

class TicketStatusLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='status_logs')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']