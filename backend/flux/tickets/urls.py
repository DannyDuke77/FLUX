from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api import TicketViewSet, DepartmentViewSet

router = DefaultRouter()

router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('api/', include(router.urls)),
]