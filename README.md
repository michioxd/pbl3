# Bus Ticket Booking & Management System (PBL3)

A comprehensive, full-stack web application designed for bus ticket booking and fleet management. This project serves as a complete solution for passengers to book tickets and for bus operators (BusAdmins) and system administrators (SysAdmins) to manage buses, trips, ticket sales, and statistical reporting. 

Built with a focus on modern development practices, clean architecture, and performance.

## Key Features

- **Role-Based Access Control (RBAC):** Distinct interfaces and permissions for Passengers, Bus Admins, and System Admins.
- **Trip & Fleet Management:** Complete CRUD operations for buses and trips by Bus Admins.
- **Ticket Booking System:** Seamless seat selection, booking, and ticket management for passengers.
- **Analytics & Dashboard:** Statistical reporting on revenue, ticket counts, and top routes for administrators.
- **Authentication:** Secure JWT-based authentication and Google OAuth integration.
- **Modern UI/UX:** Responsive, accessible, and interactive frontend powered by Shadcn UI and Tailwind CSS.

## Tech Stack

- **Backend Framework:** ASP.NET Core Web API (C#)
- **Frontend Framework:** React 19, Vite, Bun
- **Database:** PostgreSQL
- **ORM:** Entity Framework Core
- **State Management:** MobX
- **Styling:** Tailwind CSS, Shadcn UI
- **Deployment & Containerization:** Docker, Docker Compose, GitHub Container Registry

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose (recommended for database and easy setup)
- [.NET SDK 7.0+](https://dotnet.microsoft.com/download) (for backend development)
- [Bun](https://bun.sh/) (for frontend development)
- Node.js (as an alternative to Bun, though Bun is used in the project)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/michioxd/pbl3.git
cd pbl3
```

### 2. Environment Setup

Copy the example environment files for both the root (Docker) and the backend/frontend.

**Backend & Docker Environment:**
Create a `.env` file in the root directory based on `docker-compose.example.yml`:
```bash
cp .env.example .env # if exists, or manually create
```
Configure the `.env` variables:
```ini
POSTGRES_PASSWORD=your_db_password
DATABASE_URL="Host=localhost;Database=pbl3;Username=pbl3;Password=your_db_password;Port=5432"
JWT_KEY=your_super_secret_jwt_key
JWT_ISSUER=your_jwt_issuer
JWT_AUDIENCE=your_jwt_audience
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Database Setup (using Docker)

Start the PostgreSQL database:
```bash
docker-compose up -d postgres
```

Initialize the database schema:
```bash
cd server
dotnet ef database update
```
*(Alternatively, you can run `docker-compose run --rm migrate` if configured).*

### 4. Start the Backend Server

```bash
cd server
dotnet watch run
```
The API will be available at `http://localhost:5026` (or the port specified in `launchSettings.json`).
Swagger documentation is available at `http://localhost:5026/swagger`.

### 5. Start the Frontend Development Server

Open a new terminal and navigate to the `web` directory:
```bash
cd web
bun install
bun dev
```
The frontend will be available at [http://localhost:5173](http://localhost:5173).

## Architecture Overview

The project follows a clean separation of concerns with a decoupled frontend and backend, communicating via RESTful APIs.

### Directory Structure

```
├── server/                 # ASP.NET Core Backend
│   ├── Controllers/        # API Endpoints
│   ├── Models/             # Domain Entities
│   ├── Dtos/               # Data Transfer Objects
│   ├── Services/           # Business Logic Interfaces & Implementations
│   ├── Data/               # EF Core DbContext
│   ├── Migrations/         # EF Core Database Migrations
│   ├── Enums/              # Shared Enumerations (Roles, Statuses)
│   └── Program.cs          # Application Entry Point & DI Configuration
├── web/                    # React Frontend
│   ├── src/
│   │   ├── api/            # Auto-generated API client from Swagger/OpenAPI
│   │   ├── pages/          # Route-level components (BusAdmin, SysAdmin, etc.)
│   │   ├── components/     # Reusable UI components (Shadcn UI)
│   │   └── ...
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite build configuration
└── docker-compose.example.yml # Infrastructure orchestration
```

### Request Lifecycle

1. **Client Request:** User interacts with the React frontend.
2. **API Call:** Frontend makes a RESTful HTTP request to the ASP.NET Core backend.
3. **Authentication:** Request is validated via JWT middleware.
4. **Controller & Service:** Controller routes the request to the appropriate Service layer for business logic.
5. **Data Access:** Service layer queries/updates PostgreSQL via Entity Framework Core.
6. **Response:** Data is serialized and returned to the client, where MobX/React updates the UI.

### Database Schema Highlights

- **Users:** Authentication and Role tracking (Passenger, BusAdmin, SysAdmin).
- **Buses & Trips:** Fleet inventory and scheduling.
- **Tickets:** Booking records linked to Users, Trips, and specific Seats.
- **Companies/Stations:** Core entities for the transportation network.

## Available Scripts

### Frontend (`web/`)

| Command | Description |
|---|---|
| `bun dev` | Start the Vite development server |
| `bun run build` | Build the project for production |
| `bun run lint` | Run ESLint |
| `bun run generate-api` | Auto-generate TypeScript API client from Swagger OpenAPI spec |
| `bun run format` | Format code using Prettier |

### Backend (`server/`)

| Command | Description |
|---|---|
| `dotnet run` | Run the backend server |
| `dotnet watch run` | Run the server with hot-reload |
| `dotnet ef database update` | Apply pending EF Core migrations |
| `dotnet run -- --migrate` | Run custom migration initialization |
| `dotnet run -- --seed` | Seed the database with initial/dummy data |

## Deployment

The application is fully dockerized for easy deployment to any container-compatible hosting provider (AWS, DigitalOcean, Azure, Render, etc.).

### Docker Compose

You can deploy the entire stack using the provided `docker-compose` setup:

```bash
# Ensure your .env is correctly configured
docker-compose up -d
```
This will spin up:
1. `postgres` database container.
2. `server` backend container (pulled from GitHub Container Registry or built locally).

For the frontend, build the static assets and serve them via an Nginx container or a static hosting provider like Vercel/Netlify.

```bash
cd web
bun run build
# Deploy the /dist folder
```

## Troubleshooting

### API Client out of sync
**Error:** Frontend typescript errors related to API calls.
**Solution:** Ensure the backend server is running, then run `bun run generate-api` in the `web` folder to synchronize the frontend API client with the latest Swagger definitions.

### Database Connection Refused
**Error:** Backend fails to start, complaining about PostgreSQL connection.
**Solution:** Ensure the PostgreSQL container is running (`docker ps`). Verify the `DATABASE_URL` in your `.env` matches the docker-compose credentials.

### Migrations Failing
**Error:** Entity Framework complains about out-of-sync migrations.
**Solution:** Drop the database and re-apply migrations:
```bash
dotnet ef database drop
dotnet ef database update
dotnet run -- --seed
```

---
*Developed by michioxd / Team PBL3.*
