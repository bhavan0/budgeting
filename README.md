# BudgetApp 💰

A modern, full-stack budgeting PWA utilizing AI to provide financial insights and trend analysis. Built with the latest web technologies for speed, reliability, and detailed data visualization.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, **Vite**, **TailwindCSS 4**, Recharts |
| **Backend** | .NET 10, Minimal APIs, Entity Framework Core |
| **Database** | PostgreSQL 17 |
| **AI** | OpenRouter (LLM Integration) |
| **PWA** | vite-plugin-pwa, Workbox (Offline support, Installable) |
| **Auth** | JWT (Secure Access Tokens), BCrypt |
| **Container** | Docker & Docker Compose |

## ✨ Features

- **🤖 AI Financial Assistant** - Chat with your data! Ask about spending trends, savings advice, or specific transaction history.
- **💸 Smart Transaction Tracking** - Log income and expenses with automatic category mapping.
- **📈 Rich Visualizations** - Interactive pie charts for category breakdowns and trend lines for monthly spending/income.
- **📊 Dynamic Stats** - Real-time calculation of month-over-month trends (e.g., "+12% vs last month").
- **📱 Mobile-First PWA** - Installable on iOS and Android. Works offline.
- **🏷️ Custom Categories** - Create personalized categories with distinct colors and icons.
- **🌙 Dark Mode UI** - Sleek "Fintech Glass" aesthetic with smooth animations.

## 🛠️ Quick Start

### Docker (Recommended)

1.  **Configure Environment**:
    Create a `.env.local` file in the root directory (same level as `docker-compose.yml`) and add your OpenRouter configuration:
    ```env
    OpenRouter__ApiKey=sk-or-your-key-here
    OpenRouter__Model=nvidia/nemotron-3-nano-30b-a3b:free
    ```

2.  **Run Application**:
    ```bash
    docker-compose up --build
    ```

3.  **Access App**:
    - **Frontend**: http://localhost:4200
    - **Backend API Docs**: http://localhost:5008/scalar/v1
    - **Database**: localhost:5432

### 📲 Testing PWA on Mobile

To test the PWA features (installing to home screen) on your phone while running locally:

**Option 1: Local Network (UI Only)**
1.  Find your Mac's IP: `ipconfig getifaddr en0` (e.g. `192.168.1.15`)
2.  Open phone browser to: `http://192.168.1.15:4200`
    *(Note: PWA installation may be disabled on HTTP)*

**Option 2: Public Tunnel (Full PWA)**
Use ngrok to create an HTTPS tunnel for full PWA support:
```bash
brew install ngrok/ngrok/ngrok
ngrok http 4200
```
Open the `https://...` link on your phone.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/transactions` | List filtered transactions |
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
