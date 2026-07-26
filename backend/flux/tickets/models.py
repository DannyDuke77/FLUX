import logging
import secrets
import uuid

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import IntegrityError, models
from django.utils import timezone

from companies.models import BaseCompanyModel, Department

logger = logging.getLogger(__name__)


def generate_ticket_number() -> str:
    date_str = timezone.now().strftime('%Y%m%d')
    unique_part = secrets.token_hex(3).upper()  # e.g. "A3F9C1"
    return f"{date_str}-{unique_part}"


class Ticket(BaseCompanyModel):

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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)

    title = models.CharField(max_length=255)
    description = models.TextField()

    # Department that raised the ticket
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='tickets_created',
        editable=False,
        db_index=True,
    )

    # Department assigned to handle the ticket
    assigned_to = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='tickets_assigned',
        db_index=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets_created',
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        db_index=True,
    )

    image = models.ImageField(upload_to='images/ticket_attachments/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status'], name='ticket_company_status_idx'),
            models.Index(fields=['company', 'created_at'], name='ticket_company_created_idx'),
        ]

    def __str__(self) -> str:
        return f"[{self.department.name}] {self.title} ({self.status})"

    def image_url(self) -> str | None:
        if not self.image:
            return None
        return f'{settings.WEBSITE_URL}{self.image.url}'

    def save(self, *args, **kwargs) -> None:
        if self._state.adding:
            if self.created_by_id and not self.company_id:
                self.company = self.created_by.company

            if not self.ticket_number:
                self._save_with_unique_ticket_number(*args, **kwargs)
                return

        super().save(*args, **kwargs)
        self._broadcast_ws_update()

    def _save_with_unique_ticket_number(self, *args, **kwargs) -> None:
        max_attempts = 5
        for attempt in range(1, max_attempts + 1):
            self.ticket_number = generate_ticket_number()
            try:
                super().save(*args, **kwargs)
                self._broadcast_ws_update()
                return
            except IntegrityError as exc:
                if 'ticket_number' not in str(exc).lower():
                    raise
                logger.warning(
                    "Ticket number collision on attempt %d/%d: %s",
                    attempt,
                    max_attempts,
                    self.ticket_number,
                )
                self.ticket_number = ''

        raise RuntimeError(
            f"Failed to generate a unique ticket number after {max_attempts} attempts."
        )

    def _broadcast_ws_update(self) -> None:
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "tickets_updates",
                    {
                        "type": "ticket_update",
                        "data": {"action": "saved", "ticket_id": str(self.id)},
                    },
                )
        except Exception as exc:
            logger.warning("WebSocket broadcast failed for ticket %s: %s", self.id, exc)


class TicketStatusLog(BaseCompanyModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='status_logs')
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self) -> str:
        return f"Ticket {self.ticket_id}: {self.old_status} → {self.new_status}"