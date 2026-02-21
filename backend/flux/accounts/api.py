from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_object(request):
    return Response({"detail": "object created"})
