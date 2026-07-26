import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TicketConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001) 
            return

        self.group_name = "tickets_updates"
        await self.accept()
        
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        except Exception as e:
            print(f"Channel Layer Group Add Error: {e}")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def ticket_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))