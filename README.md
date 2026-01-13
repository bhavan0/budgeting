# BudgetingBE + BudgetingFE

A .NET 10 backend + Angular 21 frontend + PostgreSQL database application.

## Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up --build
```

- **Backend**: http://localhost:5008
- **Frontend**: http://localhost:4200
- **Database**: localhost:5432

### Option 2: Run Separately

**Backend:**
```bash
cd BudgetingBE/src/BudgetingBE.Api
dotnet run
```

**Frontend:**
```bash
cd BudgetingFE
npm install
npm run dev
```

**Database:**
```bash
docker-compose up database
```


## Project Structure

```
.
├── BudgetingBE/          # .NET 10 Backend
│   ├── src/
│   ├── tests/
│   └── Dockerfile
├── BudgetingFE/         # Angular 21 Frontend
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Testing

**Backend:**
```bash
cd BudgetingBE/tests/BudgetingBE.Api.Tests
dotnet test
```

**Frontend:**
```bash
cd BudgetingFE
npm run test
```


## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | .NET 10, Minimal APIs |
| Frontend | React 19 |
| Database | PostgreSQL 17 |
| Testing | xUnit, Vitest |
| Container | Docker |
