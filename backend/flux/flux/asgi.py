import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flux.settings')
# 1. Initialize Django first
django.setup()

# 2. Get the HTTP application
django_asgi_app = get_asgi_application()

# 3. NOW import your routing and Channels tools
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import tickets.routing 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            tickets.routing.websocket_urlpatterns
        )
    ),
})