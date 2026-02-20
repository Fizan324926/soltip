# 🚀 DEPLOYMENT REQUIREMENTS - Complete Guide

## 📋 WHAT YOU NEED TO DEPLOY

---

## 1️⃣ **SOLANA WALLET & KEYPAIRS**

### **A. Developer Wallet (YOUR Wallet)**
```
Purpose: Deploy the program, pay for deployment costs
Required: YES
Cost: ~5-10 SOL for deployment + testing

How to Create:
```bash
# Option 1: Using Solana CLI (if installed)
solana-keygen new --outfile ~/.config/solana/id.json

# Option 2: Using Phantom/Solflare Wallet
# Just install browser extension and create wallet
# Export private key when needed
```

**What you get:**
- Public Key (Address): `7xKXt...abc123` - Your wallet address
- Private Key (Secret): `[1,2,3,4,...]` - NEVER SHARE THIS
```

### **B. Program Keypair**
```
Purpose: The program's on-chain address
Required: YES
Cost: FREE to generate

How to Create:
```bash
# Anchor generates this automatically when you run:
anchor build

# Creates: target/deploy/soltip-keypair.json
```

**What you get:**
- Program ID: `SoLTip...xyz789` - Your program's address
- This goes in your declare_id!() in lib.rs
```

### **C. Treasury Wallet (Platform Fees)**
```
Purpose: Receives platform fees (2% withdrawal fees)
Required: YES
Cost: FREE

Create separate wallet:
- Treasury Public Key: `Treasury...abc`
- Keep private key secure in environment variables
```

---

## 2️⃣ **SOLANA ACCOUNTS & RENT**

### **Understanding Rent on Solana**

Solana requires "rent" to store data on-chain:

```
┌─────────────────────────────────────────┐
│  Account Rent Calculation               │
│                                         │
│  Rent = Data Size × Rent Rate          │
│                                         │
│  Example:                               │
│  TipProfile (1,000 bytes)              │
│  = 1,000 × 0.00000348 SOL/byte        │
│  = ~0.00348 SOL (~$0.50)               │
│                                         │
│  If you keep 2 years of rent in        │
│  account, it becomes "rent-exempt"     │
│  and stays forever                      │
└─────────────────────────────────────────┘
```

### **Accounts You'll Create:**

```rust
// 1. PROGRAM ACCOUNT
Account: Soltip Program
Size: ~100 KB (executable)
Rent: ~2 SOL one-time
Who pays: Developer (you)
When: During deployment

// 2. TIP PROFILE ACCOUNTS
Account: User's Tip Profile
Size: ~1,000 bytes
Rent: ~0.003 SOL
Who pays: Profile creator (streamer)
When: When they create profile

// 3. TIP GOAL ACCOUNTS
Account: Individual Goal
Size: ~500 bytes
Rent: ~0.002 SOL
Who pays: Profile owner
When: When creating goal

// 4. NO ACCOUNT NEEDED for:
- Sending tips (just transfers SOL/tokens)
- Viewing profiles (read-only)
```

### **Total Deployment Costs:**

```
┌──────────────────────────────────────────────┐
│  DEPLOYMENT COST BREAKDOWN                   │
├──────────────────────────────────────────────┤
│  Program Deployment:        2-3 SOL         │
│  Testing (devnet):          FREE            │
│  Testing (mainnet):         0.5-1 SOL       │
│  First profile (yours):     0.003 SOL       │
├──────────────────────────────────────────────┤
│  TOTAL REQUIRED:            3-5 SOL         │
│  (At $100/SOL = $300-500)                   │
└──────────────────────────────────────────────┘

Note: Deploy to DEVNET first (FREE)
      Then mainnet when ready
```

---

## 3️⃣ **NETWORK SELECTION**

### **Three Solana Networks:**

```
┌─────────────────────────────────────────────────────┐
│  Network    Purpose              Cost    RPC URL    │
├─────────────────────────────────────────────────────┤
│  DEVNET     Development/Testing  FREE    api.devnet │
│  TESTNET    Final testing        FREE    api.testnet│
│  MAINNET    Production           REAL $  api.mainnet│
└─────────────────────────────────────────────────────┘
```

**Recommended Flow:**
1. Develop on DEVNET (we'll do this)
2. Test on TESTNET (optional)
3. Deploy to MAINNET (when ready for real users)

### **Getting FREE Devnet SOL:**

```bash
# Method 1: Solana CLI
solana airdrop 2

# Method 2: Web Faucet
# Visit: https://faucet.solana.com/
# Enter your wallet address
# Get 1-2 SOL instantly

# You can request multiple times!
```

---

## 4️⃣ **RPC ENDPOINTS**

### **What is RPC?**
RPC = Remote Procedure Call
It's how your program talks to Solana blockchain

### **Options:**

```
┌────────────────────────────────────────────────────┐
│  Provider         Rate Limit    Cost     Best For  │
├────────────────────────────────────────────────────┤
│  Public (Free)    ~100 req/s    FREE     Dev/Test  │
│  QuickNode        Unlimited     $49/mo   Production│
│  Helius           Unlimited     $99/mo   Production│
│  Alchemy          Unlimited     $49/mo   Production│
│  Triton           Unlimited     $39/mo   Budget     │
└────────────────────────────────────────────────────┘
```

**Free Public Endpoints (Start Here):**
```
Devnet:  https://api.devnet.solana.com
Testnet: https://api.testnet.solana.com
Mainnet: https://api.mainnet-beta.solana.com
```

**When to Upgrade:**
- Getting rate limited (> 100 requests/sec)
- Need faster response times
- Production launch

---

## 5️⃣ **ENVIRONMENT VARIABLES**

Create `.env` file:

```bash
# ========================================
# SOLANA CONFIG
# ========================================
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=/Users/yourname/.config/solana/id.json

# ========================================
# PROGRAM IDS
# ========================================
PROGRAM_ID=SoLTip...xyz789          # From anchor build
TREASURY_WALLET=Treasury...abc123   # Your treasury wallet

# ========================================
# DATABASE (Optional - for indexer)
# ========================================
DATABASE_URL=postgresql://localhost/soltip
REDIS_URL=redis://localhost:6379

# ========================================
# API KEYS (Optional)
# ========================================
RPC_API_KEY=your_quicknode_key      # If using paid RPC
HELIUS_API_KEY=your_helius_key

# ========================================
# NOTIFICATIONS (Optional)
# ========================================
SENDGRID_API_KEY=your_sendgrid_key  # Email notifications
TWILIO_ACCOUNT_SID=your_twilio_sid  # SMS notifications
DISCORD_WEBHOOK_URL=https://...     # Discord alerts

# ========================================
# FRONTEND
# ========================================
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=SoLTip...xyz789
```

---

## 6️⃣ **THIRD-PARTY ACCOUNTS (OPTIONAL)**

### **Only If You Want These Features:**

```
┌──────────────────────────────────────────────────────┐
│  Service      Purpose              Cost      Required │
├──────────────────────────────────────────────────────┤
│  PostgreSQL   Store tip history    FREE     No       │
│  Redis        Caching/rate limit   FREE     No       │
│  SendGrid     Email notifications  FREE tier No      │
│  Twilio       SMS alerts           Pay/use   No      │
│  Vercel       Host frontend        FREE     No       │
│  AWS S3       Store images         Pennies   No      │
│  Discord      Bot notifications    FREE     No       │
└──────────────────────────────────────────────────────┘
```

### **A. Database (PostgreSQL)**
```bash
# Option 1: Local (FREE)
# Install PostgreSQL locally
brew install postgresql  # Mac
apt install postgresql   # Linux
# Download installer    # Windows

# Option 2: Hosted (FREE tier)
# Supabase: supabase.com (500MB free)
# Neon: neon.tech (3GB free)
# Railway: railway.app ($5 credit)
```

### **B. Email Service (SendGrid)**
```
Sign up: sendgrid.com
Free tier: 100 emails/day
Get API key from dashboard
Add to .env: SENDGRID_API_KEY=SG.xxx
```

### **C. Image Hosting (AWS S3)**
```
Sign up: aws.amazon.com
Cost: ~$0.01 per 1000 images
Alternative: Cloudinary (FREE tier)
```

---

## 7️⃣ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment:**

```bash
✅ 1. Create Solana Wallet
   - Install Phantom wallet
   - Save seed phrase securely
   - Get wallet address

✅ 2. Get Devnet SOL
   - Visit faucet.solana.com
   - Request 2 SOL
   - Confirm balance: solana balance

✅ 3. Set Up Project
   - anchor init soltip
   - Install dependencies: npm install
   - Configure Anchor.toml

✅ 4. Build Program
   - anchor build
   - Get Program ID from target/deploy/
   - Update declare_id!() in lib.rs

✅ 5. Set Environment Variables
   - Create .env file
   - Add wallet path
   - Add RPC endpoint
```

### **Deployment Commands:**

```bash
# Step 1: Build
anchor build

# Step 2: Get Program ID
solana address -k target/deploy/soltip-keypair.json
# Output: SoLTip...xyz789

# Step 3: Update lib.rs
# Change: declare_id!("old_id")
# To:     declare_id!("SoLTip...xyz789")

# Step 4: Rebuild
anchor build

# Step 5: Deploy to Devnet
anchor deploy --provider.cluster devnet

# Step 6: Verify
solana program show SoLTip...xyz789 --url devnet
```

### **Post-Deployment:**

```bash
✅ 1. Run Tests
   anchor test

✅ 2. Create First Profile
   # Use frontend or CLI
   ts-node scripts/create-profile.ts

✅ 3. Send Test Tip
   ts-node scripts/send-tip.ts

✅ 4. Verify on Explorer
   # Visit: explorer.solana.com
   # Search: SoLTip...xyz789
   # Network: Devnet
```

---

## 8️⃣ **COST SUMMARY**

### **Development Phase (FREE):**
```
✅ Devnet SOL: FREE (from faucet)
✅ Local development: FREE
✅ Testing: FREE
✅ PostgreSQL local: FREE
✅ Open source tools: FREE

Total: $0
```

### **Production Phase (Mainnet):**

```
One-Time Costs:
├─ Program Deployment: 2-3 SOL ($200-300)
├─ Initial Testing: 0.5 SOL ($50)
└─ Total One-Time: $250-350

Monthly Costs (Optional):
├─ RPC Provider: $0-99/mo
├─ Database Hosting: $0-25/mo
├─ Email Service: $0-15/mo
├─ Frontend Hosting: $0 (Vercel free)
└─ Total Monthly: $0-140/mo

Note: Can start 100% FREE on devnet
      Upgrade to mainnet when you have users
```

---

## 9️⃣ **WHAT YOU DON'T NEED**

❌ **Domain Name** - Can use soltip.vercel.app (free)
❌ **SSL Certificate** - Vercel provides free HTTPS
❌ **Server** - Solana is the server (decentralized)
❌ **Backend API** - Optional, not required for basic features
❌ **Credit Card** - Everything free on devnet
❌ **Company Registration** - Personal project OK
❌ **KYC/AML** - Not required for non-custodial tipping
❌ **Legal Entity** - Can launch as individual

---

## 🔑 **MINIMUM TO START (TODAY):**

```
Required RIGHT NOW:
1. ✅ Computer with internet
2. ✅ Phantom wallet (free browser extension)
3. ✅ Devnet SOL (free from faucet)
4. ✅ Code editor (VS Code)
5. ✅ This project folder

That's it! We can deploy to devnet in 30 minutes.
```

---

## 📱 **SIMPLIFIED FLOW FOR YOU:**

```
TODAY (FREE):
└─ 1. Create Phantom wallet
└─ 2. Get devnet SOL from faucet
└─ 3. I'll generate all the code
└─ 4. Run: anchor build
└─ 5. Run: anchor deploy --provider.cluster devnet
└─ 6. Test on devnet

LATER (When ready for users):
└─ 1. Get 3-5 SOL on mainnet (~$300-500)
└─ 2. Deploy to mainnet
└─ 3. Share link with users
└─ 4. Collect tips!
```

---

## 🎯 **MY RECOMMENDATION:**

**Phase 1 (This Week):**
- Deploy to DEVNET (100% FREE)
- Test all features
- Show to friends for feedback
- No money needed

**Phase 2 (When Ready):**
- Buy 5 SOL ($500)
- Deploy to MAINNET
- Promote to streamers
- Start earning fees

---

## ❓ **QUICK FAQ**

**Q: Do I need a bank account?**
A: No, Phantom wallet is your "bank"

**Q: Do I need a company?**
A: No, can launch as individual

**Q: Do I need AWS/Google Cloud?**
A: No, Solana IS the cloud

**Q: How much does it cost to run?**
A: $0 on devnet, ~$200-500 one-time for mainnet

**Q: Do users need accounts?**
A: No, just a Solana wallet (Phantom)

**Q: Can I test without real money?**
A: Yes! Use devnet (completely free)

---

Ready to deploy? I can walk you through getting:
1. Phantom wallet set up
2. Devnet SOL
3. Deploy the program

Want to start? 🚀
