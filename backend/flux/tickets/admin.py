from django.contrib import admin

from .models import Ticket, TicketStatusLog

# Register your models here.
@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'company', 'department', 'status', 'priority', 'created_at')
    search_fields = ('ticket_number', 'title', 'company__name', 'description')
    list_filter = ('company', 'department', 'status', 'priority', 'created_at')

@admin.register(TicketStatusLog)
class TicketStatusLogAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'ticket__ticket_number', 'ticket__company__name', 'old_status', 'new_status', 'changed_at')
    search_fields = ('ticket__title', 'ticket__ticket_number', 'ticket__company__name', 'ticket__description')
    list_filter = ('company', 'old_status', 'new_status', 'changed_at')