from django.db import transaction
from rest_framework.exceptions import ValidationError

from tickets.models import Ticket, TicketStatusLog

VALID_TRANSITIONS: dict[str, list[str]] = {
    'open':        ['in_progress', 'resolved', 'closed'],
    'in_progress': ['resolved', 'closed'],
    'resolved':    ['open', 'closed'],
    'closed':      [],
}


def validate_status_transition(*, old_status: str, new_status: str, note: str = '') -> None:
    if old_status == 'closed':
        raise ValidationError({"error": "Cannot change status of a closed ticket."})

    allowed = VALID_TRANSITIONS.get(old_status, [])
    if new_status not in allowed:
        raise ValidationError(
            {"error": f"Invalid transition from '{old_status}' to '{new_status}'."}
        )

    if new_status == 'resolved' and not note:
        raise ValidationError(
            {"resolution_note": "A resolution note is required when resolving a ticket."}
        )

    if old_status == 'resolved' and new_status == 'open' and not note:
        raise ValidationError(
            {"resolution_note": "A reason is required when re-opening a resolved ticket."}
        )


@transaction.atomic
def change_ticket_status(
    *,
    ticket: Ticket,
    new_status: str,
    user,
    note: str | None = None,
) -> Ticket:
    old_status = ticket.status

    if old_status == new_status:
        return ticket

    validate_status_transition(old_status=old_status, new_status=new_status, note=note or '')

    ticket.status = new_status
    ticket.save(update_fields=['status', 'updated_at'])

    TicketStatusLog.objects.create(
        ticket=ticket,
        old_status=old_status,
        new_status=new_status,
        changed_by=user,
        company=ticket.company,
        note=note,
    )

    return ticket