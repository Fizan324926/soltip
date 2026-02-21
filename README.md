# SolTip - Decentralized Tipping Platform on Solana

**Live Demo**: [http://45.8.225.219:3050](http://45.8.225.219:3050)

A full-stack decentralized tipping and creator monetization platform built on Solana. Creators set up profiles, receive SOL/SPL token tips, run fundraising goals, accept recurring subscriptions, split tips across wallets, create community polls, gate exclusive content, earn referral commissions, and track analytics -- all enforced on-chain through an Anchor smart contract.

> **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions on deploying to devnet and mainnet, including how to get RPC keys, set up the database, and configure all environment variables.

> **Version Matrix**: See [VERSIONS.md](./VERSIONS.md) for all pinned toolchain and dependency versions.

> **Security Audit**: See [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) for the full security audit report with findings and remediation plan.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Architecture Diagram](#system-architecture-diagram)
- [Features](#features)
- [User Flow](#user-flow)
- [Data Flow: Sending a Tip](#data-flow-sending-a-tip)
- [On-Chain Program (Anchor)](#on-chain-program-anchor)
  - [Program Accounts](#program-accounts)
  - [Instructions](#instructions)
  - [PDA Derivation](#pda-derivation)
  - [Security Mechanisms](#security-mechanisms)
- [Backend API (Actix-web)](#backend-api-actix-web)
  - [Authentication](#authentication)
  - [Database Schema](#database-schema)
  - [API Endpoints](#api-endpoints)
- [Frontend (React + Vite)](#frontend-react--vite)
  - [Provider Architecture](#provider-architecture)
  - [Page Routes](#page-routes)
  - [State Management](#state-management)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

SolTip is a three-layer application:

```
+-----------------------------------------------------+
|                    FRONTEND                          |
|  React 18 + TypeScript + Vite + TailwindCSS          |
|  Wallet Adapter  |  Anchor Client  |  React Query    |
+-----------------------------------------------------+
          |  REST API (JSON)       |  RPC (Transactions)
          v                        v
+--------------------+    +------------------------+
|   BACKEND API      |    |   SOLANA BLOCKCHAIN    |
|  Actix-web (Rust)  |    |  Anchor 0.30.1 Program |
|  PostgreSQL + SQLx |    |  18 Instructions       |
|  Ed25519 Auth      |    |  8 Account Types       |
+--------------------+    +------------------------+
          |
          v
+--------------------+
|    PostgreSQL      |
|  15 tables         |
|  Tip history       |
|  Polls, gates,     |
|  analytics, etc.   |
+--------------------+
```

**Why three layers?**

- **On-chain program**: Enforces all financial rules (tips, fees, rate limits, splits). Money never touches a centralized server.
- **Backend API**: Stores historical data (tip history, polls, content gates, analytics, referrals) that would be expensive to query on-chain. Also handles wallet signature authentication, webhooks, and SOL/USD price feed.
- **Frontend**: Single-page app with code-split routes, wallet integration, and real-time data via React Query.

---

## System Architecture Diagram

```
                          Creator Wallet
                               |
                    +----------+-----------+
                    |                      |
               TipProfile PDA         Vault PDA
               (on-chain)             (SOL escrow)
                    |                      |
          +---------+---------+            |
          |    |    |    |    |            |
      Leaderboard Goals Split Polls    Withdraw
      (top 10) (max5) (2-5)  (max3)      |
                                    Fee Split:
                                  - Creator gets (100% - fee)
                                  - Treasury gets PLATFORM_FEE_BPS
                                  - Referrer gets fee share (if any)

    Tipper Wallet
         |
    +----+----+----+----+----+
    |    |    |    |         |
  SOL   SPL  Split Poll  Subscribe
  Tip   Tip  Tip  Vote   (recurring)
    |    |    |    |         |
    +----+----+    |         |
         |         |         |
    RateLimit   ContentGate  Subscription PDA
    (per pair)  (tip-gated)  (per subscriber)
```

---

## Features

### Core Tipping
- SOL tips with message and anonymous option
- SPL token tips (USDC, USDT, custom tokens)
- Atomic multi-recipient split tips
- On-chain rate limiting (3s cooldown, 100/day per pair)
- Reentrancy guard on all financial operations

### Creator Tools
- Custom profiles with username, avatar, bio
- Configurable minimum tip amount and withdrawal fee
- Preset tip amounts for quick tipping buttons
- SOL and SPL vault with manual withdrawal
- Verified creator badges (admin-granted)

### Fundraising Goals
- Up to 5 active goals per creator
- Target amount, deadline, progress tracking
- Unique contributor counting
- Close and reclaim rent when complete

### Recurring Subscriptions
- SOL and SPL token subscriptions
- Configurable interval and amount
- Auto-renewal with crank processing
- Cancel anytime

### Tip Splits
- 2-5 recipients with BPS-based shares
- Atomic on-chain splitting
- Configurable labels per recipient

### Community Polls (v3)
- Create tip-funded polls with 2-4 options
- Vote by tipping, SOL amount recorded per option
- Real-time vote progress bars
- Up to 3 active polls per creator

### Content Gates (v3)
- Gate exclusive content behind tip thresholds
- Tipper must have tipped at least the required amount
- Access granted permanently once threshold met
- Content URL revealed after verification

### Referral Program (v3)
- Register as a referrer for any creator
- Earn commission on referred tips (configurable BPS)
- Track total earnings and referral count
- Maximum 20% fee share cap

### Analytics Dashboard (v3)
- Daily/weekly/monthly tip trends
- SOL/USD conversion with live price feed
- Time-window leaderboards (weekly/monthly/yearly)
- CSV export for tax reporting

### Embeddable Widget (v3)
- One-line iframe embed for any website
- Shows creator stats, preset amounts, and CTA
- Dark-themed, responsive design

### OBS Overlay (v3)
- Browser source for streaming software
- Auto-refreshing tip alerts (5s polling)
- Goal progress bar overlay
- Active poll display
- Transparent background for compositing

### Platform Admin
- Emergency pause/unpause all financial operations
- Verify/unverify creators
- Platform fee configuration

---

## User Flow

```
CREATOR FLOW:
=============
1. Connect Wallet (Phantom/Solflare/Backpack)
     |
2. Onboarding Wizard (4 steps)
     |-- Choose username (lowercase, alphanumeric, underscore)
     |-- Set display name, bio, avatar URL
     |-- Set min tip amount, withdrawal fee
     |-- Review & create profile (on-chain tx)
     |
3. Dashboard
     |-- Overview: stats, vault balance, quick actions
     |-- Goals: create/manage fundraising campaigns
     |-- Subscriptions: view active subscribers
     |-- Splits: configure multi-recipient tip splitting
     |-- Transactions: full tip history
     |-- Polls: create/manage community polls
     |-- Content Gates: gate content behind tip thresholds
     |-- Referrals: track referral earnings
     |-- Analytics: daily charts, leaderboards, CSV export
     |-- Settings: preset amounts, social links, webhook URL, embed codes
     |
4. Share profile: soltip.app/<username>
5. Embed widget: <iframe src="soltip.app/widget/<username>" />
6. OBS overlay: soltip.app/overlay/<username>

TIPPER FLOW:
============
1. Browse /discover page (search, filter by verified)
     |
2. Click creator profile
     |
3. Send Tip
     |-- Choose amount (preset or custom)
     |-- Optional message (max 280 chars)
     |-- Optional anonymous flag
     |-- Sign & send transaction
     |
4. Tip arrives in creator's Vault PDA
     |-- Platform fee (1%) deducted automatically
     |-- Rate limit enforced (3s cooldown, 100/day)
     |-- Leaderboard updated if top-10 worthy
     |-- TipperRecord updated for tracking
     |-- Webhook fired (if configured)

ADMIN FLOW:
===========
1. Connect with platform authority wallet
     |
2. Admin panel
     |-- Pause/unpause platform (emergency kill switch)
     |-- Verify/unverify creators (trusted badge)
     |-- View platform config
```

---

## Data Flow: Sending a Tip

```
Step 1: FRONTEND (browser)
  - User enters amount, message, clicks "Send Tip"
  - useAnchorClient() builds the transaction
  - Wallet popup: user signs transaction

Step 2: ON-CHAIN PROGRAM (Solana validator)
  a. Check platform_config.paused == false
  b. Validate amount (MIN_TIP_AMOUNT <= amount <= MAX_TIP_AMOUNT)
  c. Validate message length and sanitize
  d. Rate limit check (cooldown + daily cap)
  e. Set reentrancy_guard = true
  f. Calculate platform_fee = amount * PLATFORM_FEE_BPS / 10000
  g. Transfer (amount - platform_fee) -> vault
  h. Transfer platform_fee -> treasury
  i. Update tip_profile stats
  j. Update tipper_record + leaderboard
  k. Set reentrancy_guard = false

Step 3: FRONTEND (post-confirmation)
  - Wait for transaction confirmation
  - POST /api/v1/tips with tip details
  - Auth: Bearer <base58_sig>.<base58_pubkey>.<timestamp>

Step 4: BACKEND API
  a. Verify wallet signature (ed25519)
  b. Insert tip record into database
  c. Update profile stats
  d. Fire webhook (if configured)
  e. Return 201 Created
```

---

## On-Chain Program (Anchor)

### Program Accounts

| Account | PDA Seeds | Description |
|---------|-----------|-------------|
| `TipProfile` | `["tip_profile", owner]` | Creator profile with stats, settings, leaderboard |
| `Vault` | `["vault", tip_profile]` | SOL escrow for tips |
| `TipperRecord` | `["tipper_record", tipper, tip_profile]` | Per-pair tip tracking |
| `RateLimit` | `["rate_limit", tipper, tip_profile]` | Per-pair rate limiter |
| `TipGoal` | `["tip_goal", tip_profile, goal_id]` | Fundraising campaign |
| `Subscription` | `["subscription", subscriber, tip_profile]` | Recurring payment |
| `TipSplit` | `["tip_split", tip_profile]` | Multi-recipient config |
| `PlatformConfig` | `["platform_config"]` | Singleton platform settings |

### Instructions

| # | Instruction | Auth | Description |
|---|-------------|------|-------------|
| 1 | `initialize_platform` | Authority | One-time setup |
| 2 | `create_profile` | Creator | Create TipProfile + Vault |
| 3 | `update_profile` | Creator | Update settings |
| 4 | `send_tip` | Tipper | Send SOL tip |
| 5 | `send_tip_spl` | Tipper | Send SPL token tip |
| 6 | `configure_split` | Creator | Set up tip splitting |
| 7 | `send_tip_split` | Tipper | Atomic multi-recipient tip |
| 8 | `initialize_vault` | Creator | Create SOL vault |
| 9 | `withdraw` | Creator | Withdraw SOL from vault |
| 10 | `withdraw_spl` | Creator | Withdraw SPL tokens |
| 11 | `create_goal` | Creator | Create fundraising goal |
| 12 | `contribute_goal` | Tipper | Fund a goal |
| 13 | `close_goal` | Creator | Close a goal |
| 14 | `create_subscription` | Subscriber | Start recurring payment |
| 15 | `cancel_subscription` | Subscriber | Cancel recurring payment |
| 16 | `process_subscription` | Anyone (crank) | Execute due payment |
| 17 | `verify_creator` | Authority | Grant/revoke verified badge |
| 18 | `pause_platform` | Authority | Emergency pause toggle |

### PDA Derivation

```typescript
const [tipProfilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("tip_profile"), creatorWallet.toBuffer()],
  PROGRAM_ID
);
const [vaultPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), tipProfilePda.toBuffer()],
  PROGRAM_ID
);
```

### Security Mechanisms

1. **Reentrancy Guard**: Set before transfers, cleared after
2. **Rate Limiting**: 3s cooldown + 100/day per (tipper, recipient) pair
3. **Platform Pause**: Kill switch for all financial operations
4. **Input Validation**: Length checks, character sanitization, bounds checking
5. **Ownership Checks**: Signer must match account owner
6. **Safe Arithmetic**: `u128` intermediates with `checked_mul`/`checked_div`

---

## Backend API (Actix-web)

### Authentication

Wallet signature auth (no passwords, no sessions):

```
Authorization: Bearer <base58_signature>.<base58_pubkey>.<timestamp>
```

Frontend signs `SolTip-Auth:<timestamp>` using wallet's `signMessage`. Backend verifies the ed25519 signature and checks timestamp freshness (configurable via `AUTH_TOKEN_MAX_AGE_SECS`).

### Database Schema

PostgreSQL with 15 tables:

```
Core:        profiles, vaults, tips, goals, subscriptions, tip_splits, split_recipients
v3:          polls, poll_votes, content_gates, content_access, referrals
System:      webhook_deliveries, price_cache, analytics_daily
```

### API Endpoints

**Public (no auth):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/profiles` | List profiles (paginated, searchable) |
| GET | `/api/v1/profiles/{address}` | Get profile |
| GET | `/api/v1/profiles/{address}/leaderboard` | Top tippers |
| GET | `/api/v1/vault/{profile_pda}` | Vault balance |
| GET | `/api/v1/tips/history/{address}` | Tip history |
| GET | `/api/v1/goals/{profile_pda}` | List goals |
| GET | `/api/v1/subscriptions/subscriber/{addr}` | Subscriptions |
| GET | `/api/v1/splits/{profile_pda}` | Split config |
| GET | `/api/v1/polls/{profile_pda}` | List polls |
| GET | `/api/v1/content-gates/{profile_pda}` | List gates |
| GET | `/api/v1/referrals/referrer/{addr}` | Referrals by referrer |
| GET | `/api/v1/referrals/profile/{pda}` | Referrals by profile |
| GET | `/api/v1/analytics/{profile_pda}` | Analytics data |
| GET | `/api/v1/leaderboard/{pda}/{window}` | Time-window leaderboard |
| GET | `/api/v1/price/sol` | SOL/USD price |
| GET | `/api/v1/widget/{username}` | Widget config |
| GET | `/api/v1/overlay/{username}` | OBS overlay config |
| GET | `/api/v1/export/{pda}/tips` | CSV export |

**Authenticated (wallet signature):**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/profiles` | Create profile |
| PUT | `/api/v1/profiles/{address}` | Update profile |
| POST | `/api/v1/tips` | Record SOL tip |
| POST | `/api/v1/tips/spl` | Record SPL tip |
| POST | `/api/v1/tips/split` | Record split tip |
| POST | `/api/v1/vault/initialize` | Initialize vault |
| POST | `/api/v1/vault/withdraw` | Record withdrawal |
| POST | `/api/v1/goals` | Create goal |
| POST | `/api/v1/goals/{pda}/contribute` | Contribute |
| DELETE | `/api/v1/goals/{pda}` | Close goal |
| POST | `/api/v1/subscriptions` | Create subscription |
| DELETE | `/api/v1/subscriptions/{pda}` | Cancel subscription |
| POST | `/api/v1/splits` | Configure split |
| POST | `/api/v1/polls` | Create poll |
| POST | `/api/v1/polls/{pda}/vote` | Vote on poll |
| DELETE | `/api/v1/polls/{pda}/close` | Close poll |
| POST | `/api/v1/content-gates` | Create gate |
| POST | `/api/v1/content-gates/{pda}/verify` | Verify access |
| DELETE | `/api/v1/content-gates/{pda}/close` | Close gate |
| POST | `/api/v1/referrals` | Register referral |
| POST | `/api/v1/admin/pause` | Pause/unpause |
| POST | `/api/v1/admin/verify` | Verify/unverify |

---

## Frontend (React + Vite)

### Provider Architecture

```
<React.StrictMode>
  <ErrorBoundary>
    <ThemeProvider>
      <WalletProvider>       -- Solana wallet adapter
        <QueryProvider>      -- TanStack React Query v5
          <ToastProvider>    -- react-hot-toast
            <BrowserRouter>
              <App />        -- useWalletAuth() auto-signs
            </BrowserRouter>
          </ToastProvider>
        </QueryProvider>
      </WalletProvider>
    </ThemeProvider>
  </ErrorBoundary>
</React.StrictMode>
```

### Page Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Landing page | No |
| `/discover` | Creator discovery | No |
| `/onboarding` | Profile creation wizard | Wallet |
| `/dashboard` | Dashboard overview | Wallet |
| `/dashboard/goals` | Goal management | Wallet |
| `/dashboard/subscriptions` | Subscription management | Wallet |
| `/dashboard/splits` | Split configuration | Wallet |
| `/dashboard/transactions` | Transaction history | Wallet |
| `/dashboard/polls` | Poll management | Wallet |
| `/dashboard/content-gates` | Content gate management | Wallet |
| `/dashboard/referrals` | Referral dashboard | Wallet |
| `/dashboard/analytics` | Analytics & leaderboards | Wallet |
| `/dashboard/settings` | Profile settings & embeds | Wallet |
| `/admin` | Platform admin panel | Authority |
| `/widget/:username` | Embeddable tip widget | No |
| `/overlay/:username` | OBS alert overlay | No |
| `/:username` | Public creator profile | No |
| `*` | 404 Not Found | No |

### State Management

- **Server state**: TanStack React Query v5 with query key factory
- **Client state**: Zustand stores (wallet, profile, platform, UI)
- **Wallet state**: `@solana/wallet-adapter-react` hooks
- **Anchor client**: Custom `useAnchorClient()` hook

---

## Project Structure

```
soltip/
+-- soltip/                        # Anchor smart contract
|   +-- programs/soltip/src/
|   |   +-- lib.rs                 # Program entry (18 instructions)
|   |   +-- constants.rs           # Seeds, sizes, limits
|   |   +-- error.rs               # Error codes (50+ types)
|   |   +-- state/                 # 8 account structs
|   |   +-- instructions/          # 18 instruction files
|   +-- tests/                     # 64 integration tests
|   +-- Anchor.toml
|
+-- backend/                       # Actix-web REST API
|   +-- src/
|   |   +-- main.rs                # Server entry, CORS, migrations
|   |   +-- routes.rs              # 40+ route definitions
|   |   +-- handlers/              # HTTP handlers (9 modules)
|   |   +-- middleware/            # Ed25519 wallet auth
|   |   +-- models.rs              # Request/response DTOs
|   |   +-- db/                    # Database query helpers (7 modules)
|   |   +-- services/              # Price feed, webhooks, Solana RPC
|   |   +-- config.rs              # Constants
|   +-- migrations/                # PostgreSQL migrations (2 files)
|   +-- .env.example               # All backend config vars
|
+-- app/                           # React frontend
|   +-- src/
|   |   +-- App.tsx                # Route definitions
|   |   +-- main.tsx               # Provider tree
|   |   +-- api/                   # React Query hooks (9 modules)
|   |   +-- components/            # UI components (layout, shared, ui)
|   |   +-- features/              # 15 feature page modules
|   |   +-- hooks/                 # Custom hooks
|   |   +-- lib/                   # Anchor client, API client, utils
|   |   +-- providers/             # Wallet, Query, Theme, Toast
|   |   +-- stores/                # Zustand state stores (4)
|   +-- .env.example               # All frontend config vars
|   +-- vite.config.ts
|
+-- DEPLOYMENT.md                  # Comprehensive deployment guide
+-- README.md                      # This file
```

---

## Development Setup

### Prerequisites

- Rust 1.75+ (`rustup install stable`)
- Anchor CLI 0.30.1 (`avm install 0.30.1`)
- Solana CLI 1.18+ (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Node.js 18+ and npm
- PostgreSQL 14+

### Quick Start

```bash
# 1. Clone
git clone https://github.com/Fizan324926/soltip.git
cd soltip

# 2. Database
createdb soltip
cp backend/.env.example backend/.env
# Edit backend/.env: set DATABASE_URL

# 3. Backend
cd backend && cargo run
# Server at http://localhost:8080, migrations auto-run

# 4. Frontend
cd ../app && npm install
cp .env.example .env.local
# Edit .env.local: set VITE_PROGRAM_ID, VITE_API_URL
npm run dev
# Dev server at http://localhost:3000

# 5. Anchor program
cd ../soltip && anchor build --skip-lint
# Run tests: anchor test --skip-lint
```

For production deployment, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

### Docker Quick Start

```bash
# 1. Copy and configure environment
cp .env.docker.example .env
# Edit .env: set PROGRAM_ID, JWT_SECRET, POSTGRES_PASSWORD, CORS_ORIGINS

# 2. Run everything
docker compose up -d

# Frontend: http://localhost
# Backend:  http://localhost:8080
# Postgres: localhost:5432

# View logs
docker compose logs -f

# Stop
docker compose down
```

---

## Environment Variables

All environment variables are documented in:
- **Backend**: [`backend/.env.example`](./backend/.env.example) (15 variables)
- **Frontend**: [`app/.env.example`](./app/.env.example) (20+ variables)
- **Full reference**: [DEPLOYMENT.md - Environment Variable Reference](./DEPLOYMENT.md#environment-variable-reference)

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Blockchain | Solana | Mainnet-Beta / Devnet |
| Smart Contract | Anchor | 0.30.1 |
| Backend | Actix-web (Rust) | 4.x |
| Database | PostgreSQL + SQLx | 0.8 |
| Auth | Ed25519 wallet signatures | ed25519-dalek 2.x |
| Frontend | React | 18.3 |
| Build Tool | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| UI Components | Radix UI | latest |
| State (server) | TanStack React Query | 5.x |
| State (client) | Zustand | 5.x |
| Wallet | Solana Wallet Adapter | latest |

---

## License

Private repository. All rights reserved.
