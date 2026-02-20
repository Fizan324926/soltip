# SolTip - Project Status

**Last Updated:** February 2026

---

## Build Status

| Component | Status | Command | Notes |
|-----------|--------|---------|-------|
| Anchor Program | `cargo check` passes | `cd soltip && cargo check` | Zero errors. `anchor build` requires Solana CLI in PATH (use Windows CMD/PowerShell, not Git Bash) |
| Backend API | `cargo check` passes | `cd backend && cargo check` | Zero errors, warnings only (unused helper functions) |
| Frontend | `vite build` passes | `cd app && npx vite build` | Zero errors, 42 output chunks |

---

## What's Implemented

### On-Chain Program (Anchor 0.32.1)

- [x] 18 instructions fully implemented
- [x] 8 account types with proper PDA derivation
- [x] Rate limiting (3s cooldown + 100/day per tipper-recipient pair)
- [x] On-chain leaderboard (top 10 tippers per creator)
- [x] Reentrancy guard on TipProfile
- [x] Platform pause enforcement on all financial instructions
- [x] SOL and SPL token support
- [x] Tip splits (2-5 recipients, BPS validation)
- [x] Fundraising goals with deadlines
- [x] Recurring subscriptions (SOL + SPL)
- [x] Vault-based withdrawals with fee splitting
- [x] Input validation (string lengths, amounts, HTML injection prevention)
- [x] Math overflow protection (u128 intermediate calculations)
- [x] Feature flags in constants.rs
- [x] Unit tests for utility functions

### Backend API (Actix-web + PostgreSQL)

- [x] 17+ REST endpoints (CRUD for all entities)
- [x] PostgreSQL schema with 7 tables + indexes
- [x] Auto-run migrations on startup
- [x] Wallet signature authentication (ed25519)
  - [x] Auth token format: `<base58_sig>.<base58_pubkey>.<timestamp>`
  - [x] 5-minute replay window
  - [x] Wallet-to-action ownership verification on all mutation endpoints
- [x] Pagination, search, filtering on profiles
- [x] CORS configured for development
- [x] Error handling with proper HTTP status codes
- [x] Structured logging

### Frontend (React + TypeScript + Vite)

- [x] All pages rendering correctly:
  - Landing page (hero, stats, features, CTA)
  - Discovery page (search, filters, live creator cards from API)
  - Profile page (stats, goals tab, leaderboard, Send Tip button)
  - Onboarding (4-step wizard)
  - Dashboard (overview, goals, subscriptions, splits, transactions)
  - Admin panel (pause, verify)
  - 404 handling
- [x] Wallet integration (Phantom, Solflare, etc.)
- [x] Auto wallet auth (signs on connect, refreshes every 4 min)
- [x] Error boundary with visual error display
- [x] Code splitting (lazy-loaded routes)
- [x] Radix UI component library
- [x] TailwindCSS styling with dark/light theme
- [x] React Query for server state management
- [x] Zustand for client state
- [x] snake_case to camelCase auto-transform in API client
- [x] BigInt parsing for lamport values

---

## What's Remaining Before Deployment

### Step 1: Anchor Build (Required)

The program must be compiled to a `.so` binary using `anchor build`. This command requires the Solana CLI to be in PATH.

**On Windows:** Use CMD or PowerShell (not Git Bash, which panics due to path resolution).

```cmd
cd soltip
anchor build
```

This produces `soltip/target/deploy/soltip.so` (the deployable program binary).

### Step 2: Fund Deploy Wallet

A deploy wallet was generated at `~/.config/solana/id.json`. It needs devnet SOL to pay for deployment rent.

```bash
# Check your deploy wallet address
solana address

# Option A: Command line (may be rate-limited)
solana airdrop 2

# Option B: Web faucet (higher limits with GitHub login)
# Visit https://faucet.solana.com
# Paste your wallet address
# Select "Devnet" and request 5 SOL
```

Program deployment typically requires ~3-5 SOL on devnet.

### Step 3: Deploy to Devnet

```bash
cd soltip
anchor deploy
```

Verify deployment:
```bash
solana program show BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo
```

### Step 4: Initialize Platform Config

After deployment, the platform authority must call `initialize_platform` to set:
- Authority wallet (admin)
- Treasury wallet (receives platform fees)
- Platform fee BPS (currently 100 = 1%)

This can be done via the Admin page in the frontend, or using an Anchor test script.

### Step 5: Run Integration Tests

```bash
cd soltip
anchor test
```

The test suite covers 35+ scenarios including profile creation, tipping, goals, subscriptions, and admin operations.

### Step 6: Production Considerations

Before mainnet deployment:

- [ ] **Security audit** -- the program handles real funds
- [ ] **CORS lockdown** -- restrict to production domain
- [ ] **Rate limiting on API** -- add request-level rate limiting (separate from on-chain tip rate limiting)
- [ ] **SSL/TLS** -- HTTPS for backend API
- [ ] **Database backups** -- automated PostgreSQL backups
- [ ] **Monitoring** -- log aggregation, error tracking, uptime monitoring
- [ ] **CDN** -- serve frontend from Cloudflare Pages / Vercel
- [ ] **RPC provider** -- use Helius/Triton for production RPC (not public devnet endpoint)

---

## Configuration

### Current Anchor.toml Settings

```toml
[provider]
cluster = "devnet"
wallet = '~\.config\solana\id.json'

[programs.devnet]
soltip = "BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo"
```

### Program Constants

| Constant | Value | Description |
|----------|-------|-------------|
| PLATFORM_FEE_BPS | 100 | 1% platform fee |
| MIN_TIP_AMOUNT | 1,000 lamports | ~$0.0002 |
| MAX_TIP_AMOUNT | 1,000 SOL | Upper bound |
| DEFAULT_WITHDRAWAL_FEE_BPS | 200 | 2% default withdrawal fee |
| MAX_WITHDRAWAL_FEE_BPS | 1,000 | 10% max withdrawal fee |
| DEFAULT_TIP_COOLDOWN | 3 seconds | Per-pair cooldown |
| MAX_TIPS_PER_DAY | 100 | Per tipper-recipient pair |
| MAX_ACTIVE_GOALS | 5 | Per creator profile |
| MAX_SPLIT_RECIPIENTS | 5 | Per split config |
| MAX_TOP_TIPPERS | 10 | On-chain leaderboard size |

---

## Code Statistics

| Component | Files | Lines (approx) |
|-----------|-------|-----------------|
| Anchor program | 22 Rust files | ~3,600 |
| Backend API | 17 Rust files | ~1,800 |
| Frontend | ~80 TypeScript files | ~6,000 |
| SQL migrations | 1 file | 154 |
| Tests | 1 file | ~550 |
| **Total** | **~120 files** | **~12,100** |
