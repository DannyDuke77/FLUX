import http.cookies
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

class StatelessUser:
    """
    A lightweight, stateless user object that mocks Django's User model
    using the raw data unpacked from the JWT payload.
    """
    def __init__(self, token_payload):
        self.id = token_payload.get("user_id")
        self.is_authenticated = True
        self.is_anonymous = False
        # Optional: pull out any specific flags needed by consumer guards
        self.is_staff = token_payload.get("is_staff", False)
        self.is_superuser = token_payload.get("is_superuser", False)

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        cookie_header = headers.get(b"cookie", b"").decode()
        
        cookies = http.cookies.SimpleCookie()
        cookies.load(cookie_header)
        
        token_cookie = cookies.get("session_access_token")
        
        if token_cookie:
            try:
                # Decodes, verifies signature, and checks expiration entirely in-memory
                token_string = token_cookie.value
                access_token = AccessToken(token_string)
                
                # Attach the stateless stub directly to the connection scope
                scope["user"] = StatelessUser(access_token.payload)
            except Exception:
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)