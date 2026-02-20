# SolTip - Decentralized Tipping Platform on Solana

A full-stack decentralized tipping and creator monetization platform built on Solana. Creators set up profiles, receive SOL/SPL token tips, run fundraising goals, accept recurring subscriptions, and split incoming tips across multiple wallets -- all enforced on-chain through an Anchor smart contract.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Architecture Diagram](#system-architecture-diagram)
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
- [Deployment Guide](#deployment-guide)
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
|  Actix-web (Rust)  |    |  Anchor 0.32.1 Program |
|  PostgreSQL + SQLx |    |  14 Instructions       |
|  Ed25519 Auth      |    |  8 Account Types       |
+--------------------+    +------------------------+
          |
          v
+--------------------+
|    PostgreSQL      |
|  Tip history       |
|  Profile cache     |
|  Analytics         |
+--------------------+
```

**Why three layers?**

- **On-chain program**: Enforces all financial rules (tips, fees, rate limits, splits). Money never touches a centralized server.
- **Backend API**: Stores historical data (tip history, search indexes, analytics) that would be expensive to query on-chain. Also handles wallet signature authentication.
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
          |         |         |            |
      Leaderboard  Goals  TipSplit     Withdraw
      (top 10)   (max 5)  (2-5 wallets)   |
                                     Fee Split:
                                   - Creator gets (100% - fee)
                                   - Treasury gets PLATFORM_FEE_BPS
                                   - Creator-set withdrawal_fee_bps

    Tipper Wallet
         |
    +----+----+----+----+
    |    |    |         |
  SOL   SPL  Split  Subscribe
  Tip   Tip  Tip    (recurring)
    |    |    |         |
    +----+----+         |
         |              |
    RateLimit PDA   Subscription PDA
    (per pair)      (per subscriber)
    - 3s cooldown
    - 100/day cap
```

---

## User Flow

```
CREATOR FLOW:
=============
1. Connect Wallet (Phantom/Solflare/etc.)
     |
2. Onboarding Wizard (4 steps)
     |-- Choose username (lowercase, alphanumeric, underscore)
     |-- Set display name, bio, avatar URL
     |-- Set min tip amount, withdrawal fee
     |-- Review & create profile (on-chain tx)
     |
3. Dashboard
     |-- View tip history & analytics
     |-- Create fundraising goals (max 5 active)
     |-- Configure tip splits (2-5 recipients, BPS must sum to 10000)
     |-- Manage subscriptions
     |-- Withdraw from vault (SOL/SPL)
     |
4. Share profile link: soltip.app/<username>

TIPPER FLOW:
============
1. Browse /discover page (search, filter by verified)
     |
2. Click creator profile
     |
3. Send Tip
     |-- Choose amount (min 1000 lamports)
     |-- Optional message (max 280 chars)
     |-- Optional anonymous flag
     |-- Sign & send transaction
     |
4. Tip arrives in creator's Vault PDA (not directly to wallet)
     |-- Platform fee (1%) deducted automatically
     |-- Rate limit enforced (3s cooldown, 100/day per pair)
     |-- Leaderboard updated if top-10 worthy
     |-- TipperRecord updated for tracking

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

This is the most common operation. Here's exactly what happens at each layer:

```
Step 1: FRONTEND (browser)
  - User enters amount, message, clicks "Send Tip"
  - useAnchorClient() builds the transaction:
      Program: soltip (BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo)
      Instruction: send_tip
      Accounts:
        - tipper (signer, mut)
        - tip_profile (mut)          -- PDA: [b"tip_profile", creator_wallet]
        - vault (mut)                -- PDA: [b"vault", tip_profile]
        - tipper_record (init_if_needed, mut) -- PDA: [b"tipper_record", tipper, tip_profile]
        - rate_limit (init_if_needed, mut)    -- PDA: [b"rate_limit", tipper, tip_profile]
        - platform_config            -- PDA: [b"platform_config"]
        - platform_treasury (mut)    -- PDA: [b"treasury"]
        - system_program
      Args: amount (u64), message (String), is_anonymous (bool)
  - Wallet popup: user signs transaction

Step 2: ON-CHAIN PROGRAM (Solana validator)
  a. Check platform_config.paused == false
  b. Validate amount (MIN_TIP_AMOUNT <= amount <= MAX_TIP_AMOUNT)
  c. Validate message (length <= 280, no HTML injection chars)
  d. Check accept_anonymous if is_anonymous
  e. Rate limit check:
     - If window_start is stale (>24h ago), reset counter
     - Require tip_count_today < MAX_TIPS_PER_DAY (100)
     - Require clock.unix_timestamp - last_tip_at >= COOLDOWN (3s)
  f. Set reentrancy_guard = true on tip_profile
  g. Calculate platform_fee = amount * PLATFORM_FEE_BPS / 10000
  h. Transfer (amount - platform_fee) lamports: tipper -> vault
  i. Transfer platform_fee lamports: tipper -> platform_treasury
  j. Update tip_profile stats (total_tips, total_amount, unique_tippers)
  k. Update/insert tipper_record (total_amount, tip_count)
  l. Update leaderboard if tipper qualifies for top 10
  m. Update rate_limit (last_tip_at, tip_count_today)
  n. Set reentrancy_guard = false
  o. Return success

Step 3: FRONTEND (post-confirmation)
  - Wait for transaction confirmation
  - Extract tx signature
  - POST /api/v1/tips with { tx_signature, tipper_address,
    recipient_address, amount_lamports, message, is_anonymous }
  - Auth: Bearer <base58_sig>.<base58_pubkey>.<timestamp>

Step 4: BACKEND API
  a. Verify wallet signature (ed25519)
  b. Verify tipper_address matches authenticated wallet
  c. Look up recipient profile in PostgreSQL
  d. Insert tip record into `tips` table
  e. Update profile stats (total_tips_received, total_amount_received_lamports)
  f. Update unique_tippers count if first-time tipper
  g. Return 201 Created
```

---

## On-Chain Program (Anchor)

### Program Accounts

| Account | PDA Seeds | Description |
|---------|-----------|-------------|
| `TipProfile` | `["tip_profile", owner]` | Creator profile with stats, settings, on-chain leaderboard (top 10), reentrancy guard |
| `Vault` | `["vault", tip_profile]` | SOL escrow -- all tips land here, creator withdraws manually |
| `TipperRecord` | `["tipper_record", tipper, tip_profile]` | Per-pair tracking: total amount, tip count, timestamps |
| `RateLimit` | `["rate_limit", tipper, tip_profile]` | Per-pair rate limiter: 3s cooldown + 100/day rolling window |
| `TipGoal` | `["tip_goal", tip_profile, goal_id]` | Fundraising campaign with target, deadline, progress tracking |
| `Subscription` | `["subscription", subscriber, tip_profile]` | Recurring payment: amount, interval, next due date, SOL or SPL |
| `TipSplit` | `["tip_split", tip_profile]` | Multi-recipient config: 2-5 wallets with BPS shares summing to 10000 |
| `PlatformConfig` | `["platform_config"]` | Singleton: authority, treasury, fee BPS, pause state |

### Instructions

| # | Instruction | Auth | Description |
|---|-------------|------|-------------|
| 1 | `initialize_platform` | Authority | One-time setup: set authority, treasury, fee |
| 2 | `create_profile` | Creator | Create TipProfile + Vault PDAs |
| 3 | `update_profile` | Creator | Update display name, bio, settings |
| 4 | `send_tip` | Tipper | Send SOL tip with rate limiting + leaderboard |
| 5 | `send_tip_spl` | Tipper | Send SPL token tip (USDC, USDT, etc.) |
| 6 | `configure_split` | Creator | Set up 2-5 recipient split with BPS shares |
| 7 | `send_tip_split` | Tipper | Atomic multi-recipient SOL tip |
| 8 | `initialize_vault` | Creator | Create SOL vault for a profile |
| 9 | `withdraw` | Creator | Withdraw SOL from vault (fee deducted) |
| 10 | `withdraw_spl` | Creator | Withdraw SPL tokens from vault |
| 11 | `create_goal` | Creator | Create fundraising goal (max 5 active) |
| 12 | `contribute_goal` | Tipper | Fund a goal with rate limiting |
| 13 | `close_goal` | Creator | Close goal (completed or cancelled) |
| 14 | `create_subscription` | Subscriber | Start recurring payment |
| 15 | `cancel_subscription` | Subscriber | Cancel recurring payment |
| 16 | `process_subscription` | Anyone (crank) | Execute a due subscription payment |
| 17 | `verify_creator` | Authority | Grant/revoke verified badge |
| 18 | `pause_platform` | Authority | Emergency pause toggle |

### PDA Derivation

All accounts are Program Derived Addresses (PDAs). No private keys exist for these accounts -- the program controls them deterministically.

```
// Example: derive a TipProfile address
const [tipProfilePda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("tip_profile"), creatorWallet.toBuffer()],
  PROGRAM_ID
);

// Example: derive a Vault address
const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), tipProfilePda.toBuffer()],
  PROGRAM_ID
);
```

### Security Mechanisms

1. **Reentrancy Guard**: `tip_profile.reentrancy_guard` is set to `true` before any transfer and `false` after. Prevents cross-instruction reentrancy within the same transaction.

2. **Rate Limiting**: Each (tipper, recipient) pair has a `RateLimit` PDA with:
   - 3-second cooldown between tips
   - 100 tips per 24-hour rolling window
   - Window resets after 24h of inactivity

3. **Platform Pause**: `PlatformConfig.paused` is checked at the start of every tipping instruction. When paused, all financial operations revert.

4. **Input Validation**: All strings are length-checked and sanitized (no `<`, `>`, `&` characters). Amounts are bounds-checked against MIN/MAX constants.

5. **Ownership Checks**: Every mutation requires the signing wallet to match the account owner (e.g., only the profile creator can withdraw, only the subscriber can cancel).

6. **Fee Arithmetic**: Uses `u128` intermediate values with `checked_mul`/`checked_div` to prevent overflow. Fees are calculated as `amount * fee_bps / 10000`.

---

## Backend API (Actix-web)

### Authentication

All mutation endpoints (POST/PUT/DELETE) require wallet signature authentication:

```
Authorization: Bearer <base58_signature>.<base58_pubkey>.<timestamp_seconds>
```

**How it works:**

1. Frontend signs the message `SolTip-Auth:<unix_timestamp>` using the wallet's `signMessage`
2. Encodes the 64-byte ed25519 signature as base58
3. Sends `<sig>.<pubkey>.<timestamp>` as Bearer token
4. Backend verifies:
   - Timestamp is within 5 minutes of server time (anti-replay)
   - Signature is valid for the reconstructed message
   - Pubkey matches the `owner_address` / `tipper_address` in the request body

**Why not JWT?** Wallet-native auth means no passwords, no session cookies, no registration. The wallet IS the identity. The signature proves wallet ownership without revealing the private key.

### Database Schema

PostgreSQL with 7 tables mirroring on-chain state for fast queries:

```
profiles            -- Creator profiles (search, pagination, filtering)
vaults              -- Vault balances
tips                -- Full tip history with indexing
goals               -- Fundraising goals with progress
subscriptions       -- Recurring payment tracking
tip_splits          -- Split configurations
  split_recipients  -- Individual split recipients (FK to tip_splits)
platform_config     -- Platform authority & settings
```

All tables use UUID primary keys, `TIMESTAMPTZ` timestamps, and appropriate indexes for common query patterns.

### API Endpoints

**Public (no auth required):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/profiles` | List profiles (paginated, searchable, filterable) |
| GET | `/api/v1/profiles/{address}` | Get profile by wallet, PDA, or username |
| GET | `/api/v1/profiles/{address}/leaderboard` | Top 10 tippers for a creator |
| GET | `/api/v1/vault/{profile_pda}` | Get vault balance |
| GET | `/api/v1/tips/history/{address}` | Tip history (paginated) |
| GET | `/api/v1/goals/{profile_pda}` | List goals for a creator |
| GET | `/api/v1/subscriptions/subscriber/{address}` | List subscriptions by subscriber |
| GET | `/api/v1/splits/{profile_pda}` | Get split config |
| GET | `/api/v1/admin/config` | Platform config |
| GET | `/api/v1/transactions/{address}` | Transaction history |

**Authenticated (wallet signature required):**

| Method | Path | Auth Check | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/profiles` | wallet == owner_address | Create profile |
| PUT | `/api/v1/profiles/{address}` | wallet == path address | Update profile |
| POST | `/api/v1/tips` | wallet == tipper_address | Record SOL tip |
| POST | `/api/v1/tips/spl` | wallet == tipper_address | Record SPL tip |
| POST | `/api/v1/tips/split` | wallet == tipper_address | Record split tip |
| POST | `/api/v1/vault/initialize` | wallet == owner_address | Initialize vault |
| POST | `/api/v1/vault/withdraw` | wallet == vault owner | Record withdrawal |
| POST | `/api/v1/goals` | wallet == owner_address | Create goal |
| POST | `/api/v1/goals/{pda}/contribute` | any authenticated wallet | Contribute to goal |
| DELETE | `/api/v1/goals/{pda}` | wallet == profile owner | Close goal |
| POST | `/api/v1/subscriptions` | wallet == subscriber_address | Create subscription |
| DELETE | `/api/v1/subscriptions/{pda}` | any authenticated wallet | Cancel subscription |
| POST | `/api/v1/splits` | wallet == owner_address | Configure split |
| POST | `/api/v1/admin/pause` | wallet == authority | Pause/unpause |
| POST | `/api/v1/admin/verify` | wallet == authority | Verify/unverify creator |

---

## Frontend (React + Vite)

### Provider Architecture

```
<React.StrictMode>
  <ErrorBoundary>          -- Catches render errors, shows error + reload button
    <ThemeProvider>         -- Dark/light mode on <html> element
      <WalletProvider>     -- Solana wallet adapter (Phantom, Solflare, etc.)
        <QueryProvider>    -- TanStack React Query v5 (caching, refetching)
          <ToastProvider>  -- react-hot-toast notifications
            <BrowserRouter>
              <App />      -- useWalletAuth() auto-signs on connect
            </BrowserRouter>
          </ToastProvider>
        </QueryProvider>
      </WalletProvider>
    </ThemeProvider>
  </ErrorBoundary>
</React.StrictMode>
```

### Page Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Landing page (hero, stats, features, CTA) | No |
| `/discover` | Creator discovery (search, filters, cards) | No |
| `/onboarding` | 4-step profile creation wizard | Wallet |
| `/dashboard` | Creator dashboard (overview) | Wallet |
| `/dashboard/goals` | Goal management | Wallet |
| `/dashboard/subscriptions` | Subscription management | Wallet |
| `/dashboard/splits` | Split configuration | Wallet |
| `/dashboard/transactions` | Transaction history | Wallet |
| `/admin` | Platform admin panel | Authority wallet |
| `/:username` | Public creator profile | No |
| `*` | 404 Not Found | No |

### State Management

- **Server state**: TanStack React Query v5 -- all API data is fetched, cached, and refetched automatically
- **Client state**: Zustand stores for local UI state
- **Wallet state**: `@solana/wallet-adapter-react` hooks
- **Anchor client**: Custom `useAnchorClient()` hook returns `AnchorClient | null` (null when wallet disconnected)

---

## Project Structure

```
soltip/
+-- soltip/                        # Anchor smart contract
|   +-- programs/soltip/src/
|   |   +-- lib.rs                 # Program entry (18 instructions)
|   |   +-- constants.rs           # Seeds, sizes, limits, validation
|   |   +-- error.rs               # Error codes (50+ types)
|   |   +-- state/                 # 8 account struct definitions
|   |   +-- instructions/          # One file per instruction (18 files)
|   +-- tests/                     # Anchor integration tests
|   +-- Anchor.toml                # Anchor config (cluster, program ID)
|
+-- backend/                       # Actix-web REST API
|   +-- src/
|   |   +-- main.rs                # Server entry, CORS, migrations
|   |   +-- routes.rs              # Route definitions
|   |   +-- handlers/              # HTTP handlers (7 modules)
|   |   +-- middleware/mod.rs      # Ed25519 wallet auth
|   |   +-- models.rs              # Request/response DTOs
|   |   +-- error.rs               # API error types
|   |   +-- db/                    # Database query helpers
|   |   +-- services/solana.rs     # Solana RPC client
|   |   +-- config.rs              # Server config
|   +-- migrations/                # PostgreSQL schema
|   +-- Cargo.toml
|
+-- app/                           # React frontend
|   +-- src/
|   |   +-- App.tsx                # Route definitions + wallet auth
|   |   +-- main.tsx               # Provider tree + error boundary
|   |   +-- api/                   # React Query hooks (7 feature modules)
|   |   +-- components/            # UI components (layout, shared, ui)
|   |   +-- features/              # Feature modules (12 features)
|   |   +-- hooks/                 # Custom hooks (useAnchorClient, useWalletAuth, etc.)
|   |   +-- lib/                   # Anchor client, API client, Solana utils
|   |   +-- providers/             # Wallet, Query, Theme, Toast
|   |   +-- stores/                # Zustand state stores
|   |   +-- types/                 # TypeScript interfaces
|   |   +-- styles/                # Tailwind CSS (globals, animations, theme)
|   +-- index.html
|   +-- package.json
|   +-- vite.config.ts
|   +-- tailwind.config.ts
```

---

## Development Setup

### Prerequisites

- Rust 1.75+ (`rustup install stable`)
- Anchor CLI 0.32.1 (`avm install 0.32.1`)
- Solana CLI 1.18+ (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Node.js 18+ and npm
- PostgreSQL 14+

### 1. Clone and install

```bash
git clone https://github.com/Fizan324926/soltip.git
cd soltip
```

### 2. Set up the database

```bash
# Create PostgreSQL database
createdb soltip

# Copy env file and configure
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL
```

### 3. Run the backend

```bash
cd backend
cargo run
# Server starts at http://localhost:8080
# Migrations run automatically on startup
```

### 4. Run the frontend

```bash
cd app
npm install
cp .env.example .env.local
# Edit .env.local with your settings
npm run dev
# Dev server starts at http://localhost:3000
```

### 5. Build the Anchor program

```bash
cd soltip
anchor build
# Output: target/deploy/soltip.so
```

---

## Deployment Guide

### Deploy to Solana Devnet

```bash
# 1. Configure Solana CLI for devnet
solana config set --url devnet

# 2. Create a deploy wallet (if you don't have one)
solana-keygen new -o ~/.config/solana/id.json

# 3. Fund with devnet SOL (need ~5 SOL)
#    Visit https://faucet.solana.com or:
solana airdrop 2

# 4. Build the program
cd soltip
anchor build

# 5. Deploy
anchor deploy

# 6. Verify
solana program show BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo
```

### Deploy Backend

```bash
# Build optimized binary
cd backend
cargo build --release

# Run with production env
DATABASE_URL=postgres://... \
SOLANA_RPC_URL=https://api.devnet.solana.com \
PROGRAM_ID=BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo \
HOST=0.0.0.0 \
PORT=8080 \
RUST_LOG=info \
./target/release/soltip-backend
```

### Deploy Frontend

```bash
cd app
npm run build
# Output: dist/ -- serve with any static file server (Nginx, Vercel, Cloudflare Pages)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | *required* | PostgreSQL connection string |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `PROGRAM_ID` | `BhynwWdN5...` | Deployed program address |
| `JWT_SECRET` | `dev-secret-change-me` | Legacy (unused, kept for compat) |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `8080` | Bind port |
| `RUST_LOG` | `info` | Log level |

### Frontend (`app/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SOLANA_NETWORK` | `devnet` | Network name |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | RPC endpoint |
| `VITE_PROGRAM_ID` | `BhynwWdN5...` | Program address |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Backend API base URL |
| `VITE_PLATFORM_FEE_BPS` | `100` | Platform fee (display only) |
| `VITE_USDC_MINT` | devnet USDC | USDC token mint address |
| `VITE_USDT_MINT` | devnet USDT | USDT token mint address |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Blockchain | Solana | Mainnet-Beta / Devnet |
| Smart Contract | Anchor | 0.32.1 |
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
| Charts | Recharts | 2.x |
| Animations | Framer Motion | 11.x |

---

## License

Private repository. All rights reserved.
