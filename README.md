# BudgetApp 💰

A modern, full-stack budgeting PWA utilizing AI to provide financial insights and trend analysis. Built with the latest web technologies for speed, reliability, and detailed data visualization.

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://polite-island-04cc6960f.4.azurestaticapps.net |
| **Backend API** | https://ca-budgeting-be.politemushroom-e27ed289.eastus.azurecontainerapps.io |
| **API Docs (Scalar)** | https://ca-budgeting-be.politemushroom-e27ed289.eastus.azurecontainerapps.io/scalar/v1 |

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS 4, Recharts |
| **Backend** | .NET 10, Minimal APIs, Entity Framework Core |
| **Database** | PostgreSQL (Neon - Serverless) |
| **AI** | OpenRouter (LLM Integration) |
| **PWA** | vite-plugin-pwa, Workbox (Offline support, Installable) |
| **Auth** | JWT (Secure Access Tokens), BCrypt |
| **Container** | Docker & Docker Compose |
| **Hosting** | Azure Static Web Apps (FE), Azure Container Apps (BE) |
| **CI/CD** | GitHub Actions |

## ✨ Features

- **🤖 AI Financial Assistant** - Chat with your data! Ask about spending trends, savings advice, or specific transaction history.
- **💸 Smart Transaction Tracking** - Log income and expenses with automatic category mapping.
- **📈 Rich Visualizations** - Interactive pie charts for category breakdowns and trend lines for monthly spending/income.
- **📊 Dynamic Stats** - Real-time calculation of month-over-month trends (e.g., "+12% vs last month").
- **📱 Mobile-First PWA** - Installable on iOS and Android. Works offline.
- **🏷️ Custom Categories** - Create personalized categories with distinct colors and icons.
- **🌙 Dark Mode UI** - Sleek "Fintech Glass" aesthetic with smooth animations.

## 🛠️ Local Development

### Docker (Recommended)

1.  **Configure Environment**:
    Create a `.env.local` file in the root directory:
    ```env
    OpenRouter__ApiKey=sk-or-your-key-here
    OpenRouter__Model=nvidia/nemotron-3-nano-30b-a3b:free
    Jwt__SecretKey=your-secret-key-at-least-32-characters
    ```

2.  **Run Application**:
    ```bash
    docker-compose up --build
    ```

3.  **Access App**:
    - **Frontend**: http://localhost:4200
    - **Backend API Docs**: http://localhost:5008/scalar/v1
    - **Database**: localhost:5432

## ☁️ Azure Deployment

This project is configured for automated deployment to Azure using GitHub Actions.

### Architecture

```
┌─────────────────────────────────┐
│     Azure Static Web Apps       │
│         React Frontend          │
└───────────────┬─────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────┐
│     Azure Container Apps        │
│        .NET 10 Backend          │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│       Neon PostgreSQL           │
│       Serverless Database       │
└─────────────────────────────────┘
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | Service principal JSON from `az ad sp create-for-rbac` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure SWA |
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password/token |
| `NEON_CONNECTION_STRING` | PostgreSQL connection string (ADO.NET format) |
| `VITE_API_BASE_URL` | Backend URL with `/api` suffix |

### Initial Setup

1. **Install Azure CLI**: `brew install azure-cli`
2. **Login**: `az login`
3. **Run Setup Script**: `./setup_azure.sh`
4. **Add GitHub Secrets** from the script output
5. **Push to main** to trigger deployment

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/transactions` | List filtered transactions |
| POST | `/api/transactions` | Create transaction |
| GET | `/api/categories` | List categories |
| GET | `/api/stats/summary` | Get totals and trends |
| GET | `/api/stats/over-time` | Get daily/monthly history |
| POST | `/api/ai/chat` | Send message to AI assistant |

## 🧪 Testing

**Backend:**
```bash
cd BudgetingBE
dotnet test
```

**Frontend:**
```bash
cd BudgetingFE
npm run test
```

## 📲 Testing PWA on Mobile

**Option 1: Local Network**
```bash
ipconfig getifaddr en0  # Get your local IP
# Open http://<your-ip>:4200 on your phone
```

**Option 2: ngrok Tunnel (Full PWA)**
```bash
brew install ngrok/ngrok/ngrok
ngrok http 4200
# Use the HTTPS URL on your phone
```

## 📄 License

MIT
