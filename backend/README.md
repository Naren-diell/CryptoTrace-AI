# CryptoTrace AI — Backend

Cryptocurrency Transaction Analysis & Probable End-Receiver Identification Platform.
Backend service: Node.js + Express + MySQL, with Bitcoin/Ethereum blockchain API
integration, a heuristic risk-scoring engine, a heuristic "follow the funds" end-receiver
tracer, and an AI assistant layer (OpenAI, with a deterministic fallback if no key is set).

> **Read this before your demo / submission:** the risk scoring and end-receiver
> identification in this project are **transparent, rule-based heuristics**, not a
> validated forensic tool. Every flag and prediction is explainable (you can see exactly
> why it fired), which is good for a hackathon demo and bad for treating it as a real
> investigative finding. Real-world AML tooling (Chainalysis, TRM Labs, etc.) relies on
> proprietary labeled-address databases this project does not have access to. Say this
> explicitly in your presentation — judges respect honesty about scope more than an
> oversold black box.

---

## 1. Project Structure

```
cryptotrace-backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MySQL pool
│   │   └── constants.js       # roles, risk thresholds, regex
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── walletController.js
│   │   ├── graphController.js
│   │   ├── assistantController.js
│   │   ├── reportController.js
│   │   ├── investigationController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verify + role guard
│   │   ├── validate.js         # express-validator wrapper
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── ethereumService.js  # Etherscan integration
│   │   ├── bitcoinService.js   # Blockchain.com + Blockchair integration
│   │   ├── blockchainService.js# chain auto-detection + dispatch
│   │   ├── riskEngine.js       # heuristic risk scoring
│   │   ├── endReceiverEngine.js# heuristic fund-tracing
│   │   └── aiAssistantService.js # OpenAI wrapper + fallback
│   ├── routes/
│   │   ├── index.js
│   │   └── *.Routes.js
│   ├── utils/
│   │   ├── token.js
│   │   └── activityLogger.js
│   ├── db/
│   │   ├── schema.sql          # full DB schema
│   │   ├── migrate.js          # run schema.sql
│   │   └── seed.js             # create default admin
│   ├── app.js                  # express app + middleware
│   └── server.js               # entry point
├── generated_reports/          # PDF/XLSX output (gitignored contents)
├── .env.example
├── package.json
└── README.md
```

---

## 2. Prerequisites

- Node.js 18+
- MySQL 8+ running locally or remotely
- Free API keys (optional but recommended):
  - [Etherscan](https://etherscan.io/apis) — required for Ethereum lookups
  - [Blockchair](https://blockchair.com/api) — optional, used as a secondary BTC source
  - [OpenAI](https://platform.openai.com/) — optional; without it, the AI assistant
    endpoint uses a deterministic template-based fallback so the demo still works

Bitcoin lookups via `blockchain.info` do **not** require an API key for the endpoints used here.

---

## 3. Setup

```bash
# 1. Install dependencies
cd cryptotrace-backend
npm install

# 2. Configure environment
cp .env.example .env
# edit .env: DB credentials, JWT_SECRET, ETHERSCAN_API_KEY, etc.

# 3. Create the database schema
npm run migrate

# 4. Seed a default admin user
npm run seed
# -> prints the generated admin email/password. Change the password after first login.

# 5. Start the server
npm run dev      # with nodemon, auto-reload
# or
npm start        # plain node
```

Server boots on `http://localhost:5000` by default. Check `GET /api/health`.

---

## 4. API Overview

All endpoints are prefixed with `/api`. Protected endpoints require:
`Authorization: Bearer <JWT>`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Register (always created as `investigator`) |
| POST | `/auth/login` | none | Login, returns JWT |
| GET  | `/auth/me` | yes | Current user profile |
| POST | `/wallets/search` | yes | Look up a wallet on-chain, run risk + end-receiver analysis, persist to DB |
| GET  | `/wallets/:address/history` | yes | Get previously stored analysis for an address |
| GET  | `/wallets` | yes | List analyzed wallets (filter by `riskLevel`, `chain`) |
| GET  | `/graph/:address?depth=2` | yes | Transaction graph (nodes/edges) for React Flow |
| POST | `/assistant/chat` | yes | Ask the AI assistant about a previously analyzed wallet |
| POST | `/investigations` | yes | Create an investigation case |
| GET  | `/investigations` | yes | List your investigations (admin sees all) |
| GET  | `/investigations/:id` | yes | Investigation detail + linked wallets |
| PATCH| `/investigations/:id/status` | yes | Update case status |
| POST | `/reports/generate` | yes | Generate PDF or XLSX report for an investigation |
| GET  | `/reports/download/:fileName` | yes | Download a generated report |
| GET  | `/admin/users` | admin | List all users |
| PATCH| `/admin/users/:id/status` | admin | Activate/deactivate a user |
| PATCH| `/admin/users/:id/role` | admin | Change a user's role |
| GET  | `/admin/dashboard` | admin | Aggregate stats for the dashboard |

### Example: search a wallet

```bash
curl -X POST http://localhost:5000/api/wallets/search \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"address": "0x...", "investigationId": 1}'
```

Response includes `wallet` (balance, tx history), `risk` (level, score, indicators array
with human-readable reasons), and `endReceiver` (probable address, confidence %, hop path).

---

## 5. Database

Run `src/db/schema.sql` directly in MySQL Workbench/CLI, or use `npm run migrate`.
Tables: `users`, `investigations`, `wallets`, `transactions`, `wallet_clusters`,
`risk_analysis`, `reports`, `activity_logs` — all with primary keys, foreign keys, and
indexes on the columns you'll actually filter/join on (address, chain, status, timestamps).

`wallet_clusters` is schema-ready but the clustering algorithm itself (e.g. common-input-
ownership heuristic for Bitcoin) is not implemented in this first pass — flagged in
Section 7 as the most valuable next addition if you want to extend this.

---

## 6. Security Notes

- Passwords hashed with bcrypt (cost factor 10)
- JWT-based auth, role-based access control (`admin` / `investigator`)
- `express-validator` on all write endpoints
- `helmet` for HTTP security headers
- Rate limiting: stricter on `/auth/*`, general limit on the rest of `/api/*`
- Self-registration always creates an `investigator`; promote to `admin` via the
  admin panel/API only — prevents privilege escalation through the public register form
- All sensitive actions logged to `activity_logs` (login, register, wallet search,
  investigation create)

This covers the basics for a demo. Before any real deployment, also add: HTTPS/TLS
termination, refresh tokens (current JWTs are long-lived access tokens only), secrets
management (don't keep real keys in `.env` on a shared machine), and DB backups.

---

## 7. Known Limitations / Honest Scope (say this in your demo)

1. **End-receiver heuristic** follows the single largest outgoing transaction at each
   hop. Real fund tracing needs to handle transaction splitting/merging, CoinJoin-style
   mixing, and cross-chain bridges/swaps — none of which are handled here.
2. **Risk engine** is rule-based and thresholds are illustrative, not calibrated against
   labeled fraud data.
3. **No known-exchange address database** is bundled. The schema supports it
   (`wallets.is_exchange`) but you'll need to populate it yourself (there are some public
   lists of known exchange hot wallets you can seed).
4. **Wallet clustering** (`wallet_clusters` table) is schema-only; the common-input-
   ownership heuristic for Bitcoin clustering is not yet implemented.
5. Etherscan/Blockchain.com free tiers rate-limit aggressively — expect slower responses
   under load; consider Alchemy for higher-throughput Ethereum reads.

---

## 8. Deployment Guide (basic)

**Option A — Render / Railway / a VPS:**
1. Provision a MySQL instance (PlanetScale, RDS, or a managed MySQL add-on).
2. Set all `.env` variables in your host's environment config.
3. Run `npm run migrate && npm run seed` once against the production DB.
4. `npm start` as your run command; expose `PORT`.

**Option B — Docker** (not included by default, add if needed):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

Remember to set `CLIENT_URL` to your deployed frontend's origin so CORS allows it.

---

## 9. Connecting the Frontend

This backend is designed to pair with a React + Vite + Tailwind + React Flow frontend
(per the original spec). Point its Axios base URL at this server's `/api` prefix and
store the JWT from `/auth/login` for subsequent `Authorization: Bearer` headers.
