from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api import CompanyViewSet, DepartmentViewSet

router = DefaultRouter()

router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'departments', DepartmentViewSet, basename='department')


urlpatterns = [
    path('api/', include(router.urls)),
]