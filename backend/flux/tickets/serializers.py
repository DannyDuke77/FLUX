from rest_framework import serializers

from accounts.models import Department
from .models import Ticket, TicketStatusLog

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class TicketStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.name', read_only=True)
    
    class Meta:
        model = TicketStatusLog
        fields = ['old_status', 'new_status', 'changed_by_name', 'changed_at']

class TicketSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    assigned_to_dept_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    status_logs = TicketStatusLogSerializer(many=True, read_only=True)

    def get_department_name(self, obj):
        return obj.department.name

    def get_assigned_to_dept_name(self, obj):
        return obj.assigned_to.name

    def get_created_by_name(self, obj):
        return obj.created_by.name
    
    class Meta:
        model = Ticket
        fields = [
            'id', 
            'ticket_number',
            'title', 
            'description', 
            'assigned_to',
            'department',
            'department_name', 
            'assigned_to_dept_name', 
            'created_by_name', 
            'status', 
            'priority', 
            'created_at', 
            'updated_at',
            'status_logs',
            
        ]
        read_only_fields = [
            'id',
            'ticket_number',
            'department',
            'department_name',
            'assigned_to_dept_name',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
            'status_logs',
        ]

        def validate_assigned_to(self, value):
            request = self.context.get('request')
            if not isinstance(value, Department):
                raise serializers.ValidationError("Assigned department is invalid.")
            
            user_department = getattr(request.user, 'department', None)
            if user_department and value == user_department:
                raise serializers.ValidationError("You cannot assign a ticket to your own department.")
            
            return value

        def create(self, validated_data):
            return super().create(validated_data)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']