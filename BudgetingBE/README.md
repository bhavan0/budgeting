# BudgetingBE - .NET 10 Backend

A minimal API backend built with .NET 10.

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)

### Running the API

```bash
cd src/BudgetingBE.Api
dotnet run
```

The API will be available at `http://localhost:5008`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check endpoint |
| GET | `/scalar` | Scalar API Reference (dev only) |
| GET | `/openapi/v1.json` | OpenAPI specification |

### Running Tests

```bash
cd tests/BudgetingBE.Api.Tests
dotnet test
```

### Docker

Build and run with Docker:

```bash
docker build -t {{backendName | lowercase}} .
docker run -p 5008:8080 {{backendName | lowercase}}
```

## Project Structure

```
BudgetingBE/
├── src/
│   └── BudgetingBE.Api/
│       ├── Program.cs
│       └── BudgetingBE.Api.csproj
├── tests/
│   └── BudgetingBE.Api.Tests/
│       └── HealthEndpointTests.cs
├── Dockerfile
├── .editorconfig
└── README.md
```
