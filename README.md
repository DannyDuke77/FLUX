# FLUX | Ticketing System

FLUX is a web-based, cross-department ticketing system designed to streamline internal issue reporting, assignment and resolution.

It enables employees to raise support requests, route them to the appropriate departments, track their progress and receive real-time updates as tickets change.

The application uses a Django REST Framework backend, a Next.js frontend and Django Channels with Redis for real-time communication.

## Features

### Ticket Management
- Create and submit tickets.
- Automatically generate unique ticket reference numbers.
- Assign tickets to other departments within the organisation.
- Attach supporting images to tickets.
- Track ticket priority and status.
- View ticket details and historical status changes.

### Ticket Lifecycle

FLUX implements a controlled ticket lifecycle with four statuses:

| Status | Description |
|---|---|
| `open` | Newly created ticket awaiting action. |
| `in_progress` | Ticket currently being handled. |
| `resolved` | Issue has been addressed. |
| `closed` | Ticket has been closed permanently. |

Supported transitions:

```text
OPEN
 ├── IN_PROGRESS
 ├── RESOLVED
 └── CLOSED

IN_PROGRESS
 ├── RESOLVED
 └── CLOSED

RESOLVED
 ├── OPEN
 └── CLOSED

CLOSED
 └── No further transitions
```

Additional lifecycle rules:
- A resolution note is required when resolving a ticket.
- A reason is required when reopening a resolved ticket.
- Closed tickets cannot be modified through the status lifecycle.
- Status changes are recorded in a ticket activity log, including the previous status, new status, user, timestamp and note.

### Real-Time Updates
- WebSocket communication powered by Django Channels.
- Redis Pub/Sub channel layer for distributing ticket events.
- Automatic notifications when tickets are saved.
- Frontend WebSocket connection management and reconnection handling.
- JWT-based WebSocket authentication using the session access-token cookie.

### Department-Based Access Control
- Tickets belong to an organisation and are associated with originating and assigned departments.
- Employees can access tickets created by their department or assigned to their department.
- Administrators can access tickets belonging to their organisation.
- Employees cannot update tickets originating from their own department.
- Ticket assignments are restricted to departments within the same organisation.
- Email verification is required for authenticated ticket operations.

### Search, Filtering and Pagination
- Search by ticket title or reference number.
- Filter by status, priority, originating department and assigned department.
- Sort by priority, status and creation date.
- Paginated API responses.
- Configurable page size, with a maximum of 100 records.

### Reporting and Exports
- Export ticket listings as CSV.
- Generate PDF ticket reports.
- Generate individual ticket PDF documents.
- Filter reports by department and date range.
- Include ticket details and lifecycle activity history in individual ticket reports.
- Include organisation branding in PDF reports.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16 |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Python 3.12, Django |
| API | Django REST Framework |
| Authentication | JWT, SimpleJWT, django-allauth |
| Real-time communication | Django Channels, WebSockets |
| Message distribution | Redis 7 |
| Database | PostgreSQL 16 |
| Reverse proxy | Nginx |
| PDF generation | ReportLab |
| Containerisation | Docker, Docker Compose |

## Architecture

FLUX follows a decoupled frontend/backend architecture.

```text
                    CLIENT
                      |
                      v
                 NGINX :80
                      |
             +--------+--------+
             |                 |
             v                 v
        NEXT.JS :3000     DJANGO :8000
        Frontend          REST API
                              |
                              v
                         POSTGRESQL
                              |
                              |
                         DJANGO CHANNELS
                              |
                              v
                            REDIS
                              |
                              v
                       WEBSOCKET EVENTS
                              |
                              v
                       NEXT.JS CLIENT
```

### Request Flow

**HTTP requests**

1. The frontend sends API requests to the Django backend.
2. Nginx reverse-proxies API requests to Django.
3. Django REST Framework authenticates the user and enforces permissions.
4. The backend retrieves or modifies the relevant database records.
5. The API returns the response to the frontend.

**Real-time ticket updates**

1. A ticket is created or saved.
2. The ticket model broadcasts an event through Django Channels.
3. Redis distributes the event through the `tickets_updates` channel group.
4. Connected WebSocket clients receive the event.
5. The frontend refreshes its ticket data.

## Project Structure

```text
FLUX/
│
├── backend/
│   └── flux/
│       ├── accounts/
│       │   ├── models.py
│       │   ├── permissions.py
│       │   ├── serializers.py
│       │   └── ...
│       │
│       ├── companies/
│       │   └── models.py
│       │
│       ├── tickets/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── api.py
│       │   ├── consumers.py
│       │   ├── routing.py
│       │   └── services/
│       │       ├── ticket_service.py
│       │       └── reports.py
│       │
│       ├── flux/
│       │   ├── settings.py
│       │   ├── urls.py
│       │   ├── asgi.py
│       │   └── channels_middleware.py
│       │
│       ├── Dockerfile
│       ├── entrypoint.sh
│       ├── requirements.txt
│       └── manage.py
│
├── frontend/
│   ├── app/
│   │   ├── hooks/
│   │   │   └── useTicketSocket.ts
│   │   ├── services/
│   │   │   └── apiService.ts
│   │   └── ...
│   ├── public/
│   ├── proxy.ts
│   ├── Dockerfile.dev
│   └── package.json
│
├── nginx/
│   └── nginx.conf
│
├── docker-compose.dev.yml
├── Makefile
└── package.json
```

## Getting Started

### Prerequisites

Ensure the following are installed:

- Docker
- Docker Compose
- Git

### 1. Clone the repository

```bash
git clone https://github.com/DannyDuke77/FLUX.git
cd FLUX
```

### 2. Configure environment variables

Create a `.env` file in the project root for the backend and database configuration.

Example:

```env
DEBUG=True
SECRET_KEY=your-secret-key
WEBSITE_URL=http://localhost

DATABASE=postgres

SQL_ENGINE=django.db.backends.postgresql
SQL_DATABASE=flux_db
SQL_USER=flux_user
SQL_PASSWORD=your-database-password
SQL_HOST=db
SQL_PORT=5432

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Create `frontend/.env.local.dev` for frontend configuration:

```env
INTERNAL_API_URL=http://backend:8000
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_URL=ws://localhost/ws
```

Adjust the frontend URLs if you are using a different hostname or deployment configuration.

### 3. Start the application

The repository includes a Docker Compose development configuration.

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

Alternatively, use the provided Makefile:

```bash
make dev
```

Docker Compose starts:

- PostgreSQL
- Django backend
- Next.js frontend
- Redis
- Nginx

The backend entrypoint waits for PostgreSQL, runs Django migrations and starts the configured application command.

### 4. Create an administrator

```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

Or:

```bash
make superuser
```

### 5. Access the application

| Service | Address |
|---|---|
| Frontend | http://localhost |
| Django API | http://localhost/api/ |
| Django Admin | http://localhost/admin/ |
| Backend direct access | http://localhost:8000/ |
| Frontend direct access | http://localhost:3000/ |

The frontend is served through Nginx on port 80.

### 6. Stop the application

```bash
docker compose -f docker-compose.dev.yml down
```

To remove containers and persistent database volumes:

```bash
docker compose -f docker-compose.dev.yml down -v
```

**Warning:** The `-v` option deletes the Compose-managed database and media volumes.

## API Overview

The ticket API is implemented using Django REST Framework's `ModelViewSet`.

The API supports standard CRUD operations:

| Method | Operation |
|---|---|
| GET | Retrieve tickets and ticket details |
| POST | Create a ticket |
| PATCH | Update ticket information |
| PUT | Update a ticket |
| DELETE | Delete a ticket |

Additional ticket endpoints:

| Endpoint | Description |
|---|---|
| `export_csv/` | Export filtered tickets as CSV |
| `export_pdf/` | Generate a PDF ticket report |
| `{id}/export_detail_pdf/` | Generate an individual ticket PDF |

### Filtering and Search

The ticket API supports:

```text
?status=open
?priority=critical
?department=<department_id>
?assigned_to=<department_id>
?search=network
?ordering=-created_at
?page=1
?page_size=20
```

These parameters can be combined.

### Pagination Response

Paginated responses follow this structure:

```json
{
  "success": true,
  "count": 25,
  "next": "http://localhost/api/tickets/?page=2",
  "previous": null,
  "results": []
}
```

The default page size is 10, with a maximum of 100 records per page.

## WebSocket Communication

FLUX uses Django Channels to deliver real-time ticket events.

The WebSocket route is:

```text
/ws/tickets/
```

Example event:

```json
{
  "action": "saved",
  "ticket_id": "ticket-uuid"
}
```

The WebSocket consumer authenticates connections using the `session_access_token` cookie.

Redis acts as the channel layer, allowing ticket events to be distributed to connected clients.

The frontend manages the WebSocket connection through the `useTicketSocket` React hook.

## Security and Data Isolation

Several mechanisms are implemented to protect organisational data:

- JWT authentication for API requests.
- Email verification requirements for ticket operations.
- Organisation-level data isolation.
- Department-based ticket visibility.
- Restricted ticket assignment across organisations.
- JWT validation during WebSocket connection establishment.
- API request rate limiting at the Nginx layer.
- Upload size and image-format validation.

## Development Notes

The development environment uses:

- Django's development server.
- Next.js development server.
- PostgreSQL for persistent application data.
- Redis for WebSocket event distribution.
- Nginx as the reverse proxy.

The Compose configuration mounts source directories into the containers to support development.

For production deployment, configure appropriate production-grade application servers, secure environment variables, HTTPS, persistent storage and production-specific frontend and backend settings.

## Author

**Danny Duke**

GitHub: [@DannyDuke77](https://github.com/DannyDuke77)

Project: [FLUX](https://github.com/DannyDuke77/FLUX)

---

*FLUX – Streamlining internal support through structured ticket management and real-time collaboration.*
