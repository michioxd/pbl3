# PBL3

soon

## Stack

### Frontend

- Bun
- React
- Vite

### Backend

- ASP.NET Core Web API MVC
- RESTful API
- Entity Framework Core
- PostgreSQL

## Development setup

### Frontend

Make sure you have [Bun](https://bun.sh/) installed.

```sh
cd web
bun i
bun dev
```

### Backend

Install PostgreSQL (run in Docker is recommended) and .NET SDK (version 7.0 or higher).

Copy `.env.example` to `.env` and update the database connection string if necessary.

```ini
DATABASE_URL="Host=localhost;Database=root;Username=root;Password=root;Port=5432"
```

Then run the development server:

```sh
cd server
dotnet watch
```

You may have to initialize the database first by running:

```sh
dotnet ef database update
```
