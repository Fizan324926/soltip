# SolTip Deployment Guide

Complete guide to deploying SolTip from development to production on Solana mainnet.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [1. Solana Wallet Setup](#1-solana-wallet-setup)
- [2. Get a Solana RPC Endpoint](#2-get-a-solana-rpc-endpoint)
- [3. Deploy the On-Chain Program](#3-deploy-the-on-chain-program)
  - [3a. Deploy to Devnet](#3a-deploy-to-devnet)
  - [3b. Deploy to Mainnet](#3b-deploy-to-mainnet)
- [4. Initialize the Platform](#4-initialize-the-platform)
- [5. Database Setup](#5-database-setup)
  - [5a. Local PostgreSQL](#5a-local-postgresql)
  - [5b. Managed PostgreSQL](#5b-managed-postgresql)
- [6. Backend Deployment](#6-backend-deployment)
  - [6a. Environment Variables](#6a-backend-environment-variables)
  - [6b. Run Locally](#6b-run-locally)
  - [6c. Deploy with Docker](#6c-deploy-with-docker)
  - [6d. Deploy to a VPS](#6d-deploy-to-a-vps)
  - [6e. Deploy to Railway / Render](#6e-deploy-to-railway--render)
- [7. Frontend Deployment](#7-frontend-deployment)
  - [7a. Environment Variables](#7a-frontend-environment-variables)
  - [7b. Build](#7b-build)
  - [7c. Deploy to Vercel](#7c-deploy-to-vercel)
  - [7d. Deploy to Cloudflare Pages](#7d-deploy-to-cloudflare-pages)
  - [7e. Deploy with Nginx](#7e-deploy-with-nginx)
- [8. DNS and SSL](#8-dns-and-ssl)
- [9. Post-Deployment Checklist](#9-post-deployment-checklist)
- [10. Monitoring and Maintenance](#10-monitoring-and-maintenance)
- [Environment Variable Reference](#environment-variable-reference)

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Rust | 1.75+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI | 1.18+ | `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` |
| Anchor CLI | 0.30+ | `cargo install --git https://github.com/coral-xyz/anchor avm && avm install 0.30.1 && avm use 0.30.1` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) or `nvm install 18` |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org/download/) |

---

## 1. Solana Wallet Setup

You need two wallets:

### Deploy Wallet (Program Authority)
This wallet deploys the program and becomes the platform authority.

```bash
# Generate a new keypair (save the seed phrase!)
solana-keygen new -o ~/.config/solana/deploy-wallet.json

# View the public key
solana-keygen pubkey ~/.config/solana/deploy-wallet.json
# Example output: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

> **IMPORTANT**: Back up `~/.config/solana/deploy-wallet.json` and the seed phrase securely. Loss of this key means losing program upgrade authority.

### Treasury Wallet
This wallet receives platform fees. It can be the same as the deploy wallet or a separate multisig.

```bash
# Use a separate wallet for production
solana-keygen new -o ~/.config/solana/treasury-wallet.json
solana-keygen pubkey ~/.config/solana/treasury-wallet.json
```

---

## 2. Get a Solana RPC Endpoint

The public endpoints (`api.devnet.solana.com`, `api.mainnet-beta.solana.com`) are rate-limited and unreliable for production. You need a paid RPC provider.

### Recommended Providers

| Provider | Free Tier | Pricing | Sign Up |
|----------|-----------|---------|---------|
| **Helius** | 100K credits/day | From $49/mo | [helius.dev](https://www.helius.dev/) |
| **QuickNode** | 50M API credits/mo | From $49/mo | [quicknode.com](https://www.quicknode.com/) |
| **Triton (RPC Pool)** | Limited free | From $30/mo | [triton.one](https://triton.one/) |
| **Alchemy** | 300M compute units/mo | From $49/mo | [alchemy.com](https://www.alchemy.com/solana) |
| **Shyft** | 100 req/sec free | From $25/mo | [shyft.to](https://shyft.to/) |

### How to Get Your RPC URL

1. **Helius** (recommended):
   - Sign up at [helius.dev](https://www.helius.dev/)
   - Create a new project
   - Copy your RPC URL: `https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY`
   - Use for both backend `SOLANA_RPC_URL` and frontend `VITE_SOLANA_RPC_URL`

2. **QuickNode**:
   - Sign up at [quicknode.com](https://www.quicknode.com/)
   - Create a Solana Mainnet endpoint
   - Copy the HTTP URL: `https://your-endpoint.solana-mainnet.quiknode.pro/YOUR_KEY/`

---

## 3. Deploy the On-Chain Program

### 3a. Deploy to Devnet

```bash
cd soltip

# Set CLI to devnet
solana config set --url devnet
solana config set --keypair ~/.config/solana/deploy-wallet.json

# Fund wallet with devnet SOL (need ~5 SOL for deploy)
solana airdrop 2
solana airdrop 2
solana airdrop 2

# Build
anchor build --skip-lint

# Get the program ID from your keypair
anchor keys list
# Output: soltip: BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo

# Deploy
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo
```

### 3b. Deploy to Mainnet

```bash
cd soltip

# Set CLI to mainnet
solana config set --url mainnet-beta
# Or use your paid RPC:
solana config set --url https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
solana config set --keypair ~/.config/solana/deploy-wallet.json

# Ensure wallet has enough SOL for deployment (~5-10 SOL)
solana balance

# Build
anchor build --skip-lint

# Deploy
anchor deploy --provider.cluster mainnet

# Verify
solana program show YOUR_PROGRAM_ID
```

### Updating the Program ID

If `anchor keys list` shows a different program ID than what's in the code:

1. Update `soltip/Anchor.toml`:
   ```toml
   [programs.devnet]
   soltip = "YOUR_NEW_PROGRAM_ID"
   ```

2. Update `soltip/programs/soltip/src/lib.rs`:
   ```rust
   declare_id!("YOUR_NEW_PROGRAM_ID");
   ```

3. Rebuild: `anchor build --skip-lint`

4. Update all `.env` files (backend and frontend) with the new `PROGRAM_ID` / `VITE_PROGRAM_ID`

---

## 4. Initialize the Platform

After deploying the program, you must run `initialize_platform` once to set up the platform config PDA.

```bash
cd soltip

# Run the initialization script (uses the test framework)
# Or do it manually with a script:
npx ts-node scripts/initialize-platform.ts
```

If no script exists, you can initialize via the Admin page in the frontend, or write a quick script:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Soltip;

// Derive PDAs
const [platformConfig] = PublicKey.findProgramAddressSync(
  [Buffer.from("platform_config")],
  program.programId
);
const [treasury] = PublicKey.findProgramAddressSync(
  [Buffer.from("treasury")],
  program.programId
);

// Initialize
await program.methods
  .initializePlatform()
  .accounts({
    authority: provider.wallet.publicKey,
    platformConfig,
    treasury,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

console.log("Platform initialized!");
console.log("Platform Config PDA:", platformConfig.toBase58());
console.log("Treasury PDA:", treasury.toBase58());
```

**Save the output PDAs** - you'll need them for the frontend `.env`:
- `VITE_PLATFORM_CONFIG_ADDRESS` = Platform Config PDA
- `VITE_PLATFORM_TREASURY` = Treasury PDA

---

## 5. Database Setup

### 5a. Local PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Create user and database
sudo -u postgres psql -c "CREATE USER soltip WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "CREATE DATABASE soltip OWNER soltip;"

# Connection string
# DATABASE_URL=postgres://soltip:your-secure-password@localhost:5432/soltip
```

### 5b. Managed PostgreSQL

For production, use a managed database:

| Provider | Free Tier | Sign Up |
|----------|-----------|---------|
| **Neon** | 0.5 GB, always free | [neon.tech](https://neon.tech/) |
| **Supabase** | 500 MB, 2 projects | [supabase.com](https://supabase.com/) |
| **Railway** | $5 credit/mo | [railway.app](https://railway.app/) |
| **AWS RDS** | 12 months free tier | [aws.amazon.com/rds](https://aws.amazon.com/rds/) |
| **DigitalOcean** | From $15/mo | [digitalocean.com](https://www.digitalocean.com/products/managed-databases) |

**How to get your DATABASE_URL:**

1. **Neon** (recommended for starting out):
   - Sign up at [neon.tech](https://neon.tech/)
   - Create a new project, select your region
   - Copy the connection string from the dashboard
   - Format: `postgres://user:password@ep-xxx.region.aws.neon.tech/soltip?sslmode=require`

2. **Supabase**:
   - Sign up at [supabase.com](https://supabase.com/)
   - Create a new project
   - Go to Settings > Database > Connection string
   - Use the "URI" format

> **Note**: Migrations run automatically when the backend starts. No manual migration step needed.

---

## 6. Backend Deployment

### 6a. Backend Environment Variables

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Fill in all values. Here's a production example:

```env
DATABASE_URL=postgres://soltip:xxx@ep-cool-night-123.us-east-1.aws.neon.tech/soltip?sslmode=require
DB_MAX_CONNECTIONS=20

SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
PLATFORM_AUTHORITY=YOUR_AUTHORITY_WALLET_PUBKEY

HOST=0.0.0.0
PORT=8080

CORS_ORIGINS=https://soltip.xyz,https://www.soltip.xyz

AUTH_TOKEN_MAX_AGE_SECS=300

WEBHOOK_TIMEOUT_SECS=10
WEBHOOK_MAX_RETRIES=3

COINGECKO_API_KEY=
PRICE_CACHE_TTL_SECS=60

RUST_LOG=info,soltip_backend=info
```

### 6b. Run Locally

```bash
cd backend
cargo run
# Server starts at http://localhost:8080
# Test: curl http://localhost:8080/api/v1/health
```

### 6c. Deploy with Docker

Create `backend/Dockerfile`:

```dockerfile
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/soltip-backend /usr/local/bin/soltip-backend
COPY --from=builder /app/migrations /app/migrations
WORKDIR /app
CMD ["soltip-backend"]
```

```bash
# Build
docker build -t soltip-backend ./backend

# Run
docker run -d \
  --name soltip-backend \
  -p 8080:8080 \
  --env-file backend/.env \
  soltip-backend
```

### 6d. Deploy to a VPS

```bash
# On your VPS (Ubuntu 22.04+)

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Clone and build
git clone https://github.com/YOUR_USER/soltip.git
cd soltip/backend
cargo build --release

# Create systemd service
sudo tee /etc/systemd/system/soltip-backend.service > /dev/null <<EOF
[Unit]
Description=SolTip Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=soltip
WorkingDirectory=/home/soltip/soltip/backend
EnvironmentFile=/home/soltip/soltip/backend/.env
ExecStart=/home/soltip/soltip/backend/target/release/soltip-backend
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Start
sudo systemctl enable soltip-backend
sudo systemctl start soltip-backend
sudo systemctl status soltip-backend

# View logs
sudo journalctl -u soltip-backend -f
```

### 6e. Deploy to Railway / Render

**Railway:**
1. Push your repo to GitHub
2. Sign up at [railway.app](https://railway.app/)
3. New Project > Deploy from GitHub repo
4. Set the root directory to `backend`
5. Add environment variables from `.env.example`
6. Railway auto-detects Rust and builds

**Render:**
1. Sign up at [render.com](https://render.com/)
2. New > Web Service > Connect GitHub repo
3. Root directory: `backend`
4. Build command: `cargo build --release`
5. Start command: `./target/release/soltip-backend`
6. Add environment variables

---

## 7. Frontend Deployment

### 7a. Frontend Environment Variables

Create `app/.env.local`:

```bash
cp app/.env.example app/.env.local
```

Production example:

```env
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
VITE_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
VITE_PLATFORM_CONFIG_ADDRESS=YOUR_PLATFORM_CONFIG_PDA
VITE_PLATFORM_TREASURY=YOUR_TREASURY_PDA
VITE_API_URL=https://api.soltip.xyz/api/v1

VITE_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
VITE_USDT_MINT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

VITE_FEATURE_SUBSCRIPTIONS=true
VITE_FEATURE_GOALS=true
VITE_FEATURE_SPLIT_TIPS=true
VITE_FEATURE_POLLS=true
VITE_FEATURE_CONTENT_GATES=true
VITE_FEATURE_REFERRALS=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_WIDGET=true

VITE_DEVTOOLS=false

VITE_APP_NAME=SolTip
VITE_APP_URL=https://soltip.xyz
```

### 7b. Build

```bash
cd app
npm install
npm run build
# Output: dist/ directory with static files
```

### 7c. Deploy to Vercel

1. Push repo to GitHub
2. Sign up at [vercel.com](https://vercel.com/)
3. Import your GitHub repo
4. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables (all `VITE_*` vars)
6. Deploy

Add `app/vercel.json` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 7d. Deploy to Cloudflare Pages

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Pages > Create a project > Connect to Git
3. Settings:
   - **Build command**: `cd app && npm install && npm run build`
   - **Build output directory**: `app/dist`
4. Add environment variables
5. Deploy

### 7e. Deploy with Nginx

```nginx
server {
    listen 80;
    server_name soltip.xyz www.soltip.xyz;
    root /var/www/soltip/dist;
    index index.html;

    # SPA fallback - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 8. DNS and SSL

### DNS Setup

Point your domain to your hosting:

| Record | Name | Value | TTL |
|--------|------|-------|-----|
| A | `@` | Your server IP | 300 |
| A | `api` | Your backend server IP | 300 |
| CNAME | `www` | `soltip.xyz` | 300 |

### SSL with Let's Encrypt (Nginx)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d soltip.xyz -d www.soltip.xyz -d api.soltip.xyz

# Auto-renewal (runs twice daily)
sudo certbot renew --dry-run
```

### SSL with Cloudflare

If using Cloudflare as DNS proxy:
1. Enable "Full (strict)" SSL mode in Cloudflare dashboard
2. SSL is automatic, no certbot needed

---

## 9. Post-Deployment Checklist

### Security

- [ ] `CORS_ORIGINS` set to specific domains (not `*`)
- [ ] `AUTH_TOKEN_MAX_AGE_SECS` is 300 (5 minutes)
- [ ] `VITE_DEVTOOLS` is `false`
- [ ] Deploy wallet keypair backed up securely
- [ ] Database password is strong and unique
- [ ] RPC API key is not exposed in frontend (use separate keys for frontend/backend if provider supports it)
- [ ] `.env` and `.env.local` files are in `.gitignore`

### Functionality

- [ ] `curl https://api.soltip.xyz/api/v1/health` returns `200`
- [ ] Frontend loads and connects to wallet
- [ ] Can create a profile on-chain
- [ ] Can send a tip and see it in history
- [ ] Analytics page shows SOL price
- [ ] Widget embed works: `https://soltip.xyz/widget/USERNAME`
- [ ] OBS overlay works: `https://soltip.xyz/overlay/USERNAME`

### Performance

- [ ] Using paid RPC endpoint (not public devnet/mainnet)
- [ ] `DB_MAX_CONNECTIONS` set appropriately for your plan
- [ ] Frontend assets are cached (check `Cache-Control` headers)
- [ ] Gzip/Brotli compression enabled on web server

---

## 10. Monitoring and Maintenance

### Health Check

```bash
# Backend health
curl https://api.soltip.xyz/api/v1/health

# Solana program status
solana program show YOUR_PROGRAM_ID --url mainnet-beta
```

### Logs

```bash
# Backend logs (systemd)
sudo journalctl -u soltip-backend -f --since "1 hour ago"

# Backend logs (Docker)
docker logs -f soltip-backend
```

### Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20260220.sql
```

For managed databases (Neon, Supabase, RDS), backups are automatic.

### Upgrading the Program

```bash
cd soltip

# Make code changes
# ...

# Build
anchor build --skip-lint

# Deploy upgrade (uses same program ID)
anchor upgrade target/deploy/soltip.so --program-id YOUR_PROGRAM_ID --provider.cluster mainnet
```

> **Warning**: Program upgrades on mainnet affect all users immediately. Test thoroughly on devnet first.

---

## Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `DB_MAX_CONNECTIONS` | No | `10` | Connection pool size |
| `SOLANA_RPC_URL` | No | devnet | Solana RPC endpoint |
| `PROGRAM_ID` | No | devnet ID | Deployed program address |
| `PLATFORM_AUTHORITY` | No | - | Admin wallet public key |
| `HOST` | No | `127.0.0.1` | Bind address |
| `PORT` | No | `8080` | Bind port |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins (comma-separated) |
| `AUTH_TOKEN_MAX_AGE_SECS` | No | `300` | Signature validity window |
| `WEBHOOK_TIMEOUT_SECS` | No | `10` | Webhook HTTP timeout |
| `WEBHOOK_MAX_RETRIES` | No | `3` | Webhook retry count |
| `COINGECKO_API_KEY` | No | - | CoinGecko Pro API key |
| `PRICE_CACHE_TTL_SECS` | No | `60` | SOL price cache duration |
| `RUST_LOG` | No | `info` | Log level filter |

### Frontend (`app/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SOLANA_NETWORK` | No | `devnet` | Network name |
| `VITE_SOLANA_RPC_URL` | No | devnet | Solana RPC endpoint |
| `VITE_PROGRAM_ID` | No | devnet ID | Program address |
| `VITE_PLATFORM_CONFIG_ADDRESS` | No | - | Platform config PDA |
| `VITE_PLATFORM_TREASURY` | No | - | Treasury PDA |
| `VITE_API_URL` | No | `http://localhost:8080/api/v1` | Backend API URL |
| `VITE_USDC_MINT` | No | devnet USDC | USDC token mint |
| `VITE_USDT_MINT` | No | devnet USDT | USDT token mint |
| `VITE_PLATFORM_FEE_BPS` | No | `100` | Platform fee (UI display) |
| `VITE_FEATURE_SUBSCRIPTIONS` | No | `true` | Enable subscriptions |
| `VITE_FEATURE_GOALS` | No | `true` | Enable goals |
| `VITE_FEATURE_SPLIT_TIPS` | No | `true` | Enable tip splits |
| `VITE_FEATURE_POLLS` | No | `true` | Enable polls |
| `VITE_FEATURE_CONTENT_GATES` | No | `true` | Enable content gates |
| `VITE_FEATURE_REFERRALS` | No | `true` | Enable referrals |
| `VITE_FEATURE_ANALYTICS` | No | `true` | Enable analytics |
| `VITE_FEATURE_WIDGET` | No | `true` | Enable embeddable widget |
| `VITE_DEVTOOLS` | No | `true` | Show dev tools |
| `VITE_APP_NAME` | No | `SolTip` | App display name |
| `VITE_APP_URL` | No | `https://soltip.xyz` | App URL |

### Anchor (`soltip/Anchor.toml`)

| Setting | Description |
|---------|-------------|
| `[programs.localnet].soltip` | Program ID for local validator |
| `[programs.devnet].soltip` | Program ID for devnet |
| `[programs.mainnet].soltip` | Program ID for mainnet |
| `[provider].cluster` | Default cluster (Localnet/Devnet/Mainnet) |
| `[provider].wallet` | Path to deploy keypair |

---

## Quick Start (TL;DR)

```bash
# 1. Clone
git clone https://github.com/YOUR_USER/soltip.git && cd soltip

# 2. Deploy program to devnet
cd soltip
solana config set --url devnet
solana airdrop 5
anchor build --skip-lint && anchor deploy --provider.cluster devnet

# 3. Start backend
cd ../backend
cp .env.example .env
# Edit .env: set DATABASE_URL
cargo run

# 4. Start frontend
cd ../app
npm install
cp .env.example .env.local
# Edit .env.local: set VITE_PROGRAM_ID, VITE_API_URL
npm run dev
```
