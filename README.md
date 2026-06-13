# ⚡ Pulse API — Real-Time API Observability Platform

> A scalable, self-hosted API monitoring and telemetry platform. Drop in a single middleware and get sub-second visibility into your application's traffic, latency, and error rates — no third-party vendor, no data leaving your servers.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-time--series-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-metadata-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-message--broker-FF6600?style=flat&logo=rabbitmq&logoColor=white)](https://rabbitmq.com)

---

## 🏗️ Architecture & Engineering

Building a monitoring tool means the monitor itself must be highly resilient — if monitoring goes down, it **must not** take your main API down with it. Here's how Pulse is engineered for that:

### 1. Asynchronous Ingestion Pipeline

- **Zero-Blocking Middleware:** The client middleware batches telemetry and sends it asynchronously. It never blocks the actual HTTP response cycle.
- **Event-Driven Processing:** The backend Ingest Service receives data and immediately pushes it to a **RabbitMQ** exchange — returning `202 Accepted` in under `5ms`. Database writes happen separately via a Consumer Worker.

### 2. Fault Tolerance & Reliability

- **RabbitMQ Message Broker:** Decouples ingestion from DB writes. Handles burst traffic without overwhelming the databases.
- **Custom Circuit Breaker:** Prevents cascade failures. If the DB struggles, the circuit trips, queues messages, and retries with exponential backoff.
- **No Telemetry Loss:** Retry strategies ensure data is preserved through temporary network partitions or DB restarts.

### 3. Polyglot Persistence

| Store | Role |
|---|---|
| **MongoDB** | Users, Clients, API Keys, RBAC, Leads (relational metadata) |
| **PostgreSQL** | Time-series metrics — optimized with raw SQL + `generate_series` for lightning-fast hourly/daily aggregations |

---

## ✨ Key Features

### 🛡️ Backend

- **Multi-Tenant System** — Complete data isolation per organisation under a single deployment
- **Role-Based Access Control (RBAC)** — `super_admin`, `client_admin`, `client_viewer` with granular permissions
- **API Key Management** — Generate, view, and delete per-environment keys (Production / Staging / Dev)
- **Smart Aggregation** — Raw hits bucketed into hourly/daily windows; frontend charts render at 60fps

### 💻 Frontend & UX

- **Real-Time Traffic Explorer** — Live traffic table polling backend every 10s, zero page refresh
- **Premium Dark Dashboard** — Minimalist, brutalist aesthetic (Tailwind CSS, Recharts)
- **Historical Archive** — Query up to 30 days of metrics filtered by service, endpoint, method, and date range
- **Guest Demo Mode** — Anyone can explore with live sample data without signing up
- **Intelligent Caching** — `@tanstack/react-query` minimises redundant backend hits

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, `@tanstack/react-query`, Recharts |
| **Backend** | Node.js, Express.js, JSON Web Tokens, bcryptjs |
| **Messaging** | RabbitMQ (`amqplib`) |
| **Databases** | PostgreSQL (`pg`), MongoDB (Mongoose) |
| **Infrastructure** | Docker & Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (for infrastructure)
- **Node.js v18+** (for the dashboard dev server)

### 1. Clone the repository

```bash
git clone https://github.com/prashantvashisth1/api_monitoring.git
cd api_monitoring
```

### 2. Start the backend (Docker)

```bash
cd server

# Copy and configure environment
cp .env.example .env

# Spin up: API server, Consumer Worker, RabbitMQ, PostgreSQL, MongoDB
docker-compose up -d --build
```

Backend API will be live at `http://localhost:5000`

### 3. Start the dashboard

```bash
cd ../dashboard
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000
npm run dev
```

Dashboard will be live at `http://localhost:5173`

---

## 🔌 Middleware Integration (Express)

Integrating Pulse API into your existing Express application takes under **2 minutes**.

**Step 1 — Copy the middleware file** from `docs/middleware/apim.js` into your project:

```
your-project/
└── middleware/
    └── apim.js   ← copy this file
```

**Step 2 — Configure your `.env`:**

```env
MONITORING_API_KEY=apim_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MONITORING_SERVICE_NAME=payments-core
MONITORING_ENV=production
```

**Step 3 — Register the middleware in your Express app:**

```js
const monitorMiddleware = require('./middleware/apim');

const app = express();

// Register BEFORE your route definitions
app.use(monitorMiddleware({
    apiKey:      process.env.MONITORING_API_KEY,
    serviceName: process.env.MONITORING_SERVICE_NAME,
    environment: process.env.MONITORING_ENV,
}));

// All your existing routes are now monitored automatically
app.get('/api/users', (req, res) => res.json({ ok: true }));
```

> No npm install required — the middleware is a single self-contained file.

---

## 🗂️ Project Structure

```
api_monitoring/
├── server/                  # Node.js backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── analytics/   # Dashboard metrics, archive queries
│   │   │   ├── auth/        # JWT auth, login
│   │   │   ├── client/      # Organisations, API keys, RBAC
│   │   │   ├── ingest/      # Telemetry ingestion endpoint
│   │   │   └── processor/   # RabbitMQ consumer → PostgreSQL writer
│   │   └── shared/          # Models, middlewares, config, utils
│   ├── docker-compose.yml
│   └── .env.example
│
├── dashboard/               # React frontend (Vite)
│   ├── src/
│   │   ├── pages/           # OverviewPage, TrafficPage, ArchivePage, ApiKeysPage, DocsPage
│   │   ├── components/      # Charts, Layout, UI primitives
│   │   ├── contexts/        # AuthContext, TimeWindowContext, ToastContext
│   │   ├── hooks/           # useDashboardQuery, useAuth
│   │   └── api/             # Axios API client
│   └── .env.example
│
└── monitoring-sdk/          # Reference middleware implementation
    └── src/
        └── middleware/      # apim.js — the drop-in Express middleware
```

---

## 📡 API Reference (Key Endpoints)

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate and receive JWT |
| `POST` | `/api/leads` | Public | Submit a "Request Access" lead |
| `POST` | `/api/ingest` | API Key | Receive telemetry from middleware |
| `GET` | `/api/analytics/dashboard` | JWT | Dashboard stats + live traffic |
| `GET` | `/api/analytics/archive` | JWT | Paginated historical metrics |
| `GET` | `/api/admin/clients/:id/api/keys` | JWT | List API keys for a client |
| `POST` | `/api/admin/clients/:id/api/keys` | JWT | Generate a new API key |
| `DELETE` | `/api/admin/clients/:id/api/keys/:keyId` | JWT | Delete an API key |

---

## 👨‍💻 Author

**Prashant Vashisth**

- 🐙 GitHub: [@prashantvashisth1](https://github.com/prashantvashisth1)
- 💼 LinkedIn: [prashant-vashisth](https://www.linkedin.com/in/prashant-vashisth-5ba6a7286/)

---

<p align="center">
  Built with ⚡ by Prashant Vashisth &nbsp;|&nbsp; Self-hosted &nbsp;|&nbsp; Open Source
</p>
