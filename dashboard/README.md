# Pulse API — Dashboard

React frontend for the Pulse API monitoring platform.

> For the full project overview, architecture docs, and getting-started guide, see the [root README](../README.md).

## Development

```bash
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000
npm run dev            # http://localhost:5173
```

## Pages

| Route | Page | Auth |
|---|---|---|
| `/` | Landing Page | Public |
| `/login` | Login | Public |
| `/dashboard` | Overview (stats + latency chart) | JWT |
| `/dashboard/traffic` | Live Traffic Explorer | JWT |
| `/dashboard/archive` | Historical Archive | JWT |
| `/dashboard/api-keys` | API Key Management | JWT (admin) |
| `/dashboard/docs` | Integration Guide | JWT |

## Key Dependencies

- **React 18** + Vite
- **@tanstack/react-query** — server state & caching
- **Recharts** — latency trend chart
- **Tailwind CSS** — styling
- **lucide-react** — icons
- **axios** — HTTP client
