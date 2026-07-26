import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'flux.settings')
# 1. Fully initialize Django applications and configurations
django.setup()

# 2. Instantiate the HTTP ASGI handler immediately
django_asgi_app = get_asgi_application()

# 3. Import routing AFTER django.setup() to avoid race conditions
from channels.routing import ProtocolTypeRouter, URLRouter
from flux.channels_middleware import JWTAuthMiddleware
import tickets.routing 

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            tickets.routing.websocket_urlpatterns
        )
    ),
})