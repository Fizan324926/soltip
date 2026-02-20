# 🎁 Tipping/Donations Platform - Complete Architecture

## 📋 PROJECT OVERVIEW

**Name:** SolTip - Decentralized Tipping Platform
**Chain:** Solana
**Framework:** Anchor
**Rating:** 72/100
**Difficulty:** 45/100
**Estimated Time:** 25-40 hours

---

## 🎯 PROJECT INPUTS & OUTPUTS

### **DEVELOPMENT INPUTS**
```
Required Tools:
├── Rust 1.75+
├── Anchor 0.32.1
├── Node.js 18+
├── Solana CLI (optional for deployment)
└── Git

Required Knowledge:
├── Rust programming
├── Solana program development
├── Anchor framework
├── TypeScript/JavaScript
└── Basic cryptography (PDAs, signatures)
```

### **PROGRAM INPUTS** (On-Chain)
```rust
// 1. Create Tip Profile
CreateTipProfile {
    username: String,           // "streamer123" (max 32 chars)
    display_name: String,       // "John Streamer" (max 64 chars)
    description: String,        // Bio (max 256 chars)
    image_url: String,          // Profile picture URL (max 200 chars)
    accept_tokens: Vec<Pubkey>, // [SOL, USDC, USDT]
}

// 2. Send Tip
SendTip {
    amount: u64,                // Amount in lamports/token units
    token_mint: Pubkey,         // Token type (SOL = System Program)
    message: Option<String>,    // Optional message (max 140 chars)
    anonymous: bool,            // Hide tipper identity
}

// 3. Withdraw Funds
Withdraw {
    amount: u64,                // Amount to withdraw
    token_mint: Pubkey,         // Token type
}

// 4. Update Profile
UpdateProfile {
    display_name: Option<String>,
    description: Option<String>,
    image_url: Option<String>,
    min_tip_amount: Option<u64>,
}

// 5. Create Tip Goal
CreateGoal {
    title: String,              // "New PC Setup" (max 64 chars)
    description: String,        // Goal details (max 256 chars)
    target_amount: u64,         // Target in tokens
    token_mint: Pubkey,         // Token type
    deadline: Option<i64>,      // Unix timestamp (optional)
}
```

### **PROGRAM OUTPUTS** (On-Chain)
```rust
// 1. Tip Profile Account
TipProfile {
    owner: Pubkey,              // Creator wallet
    username: String,
    display_name: String,
    description: String,
    image_url: String,
    total_tips_received: u64,   // All-time tips count
    total_amount_received: u64, // All-time amount (SOL)
    available_balance: HashMap<Pubkey, u64>, // Token balances
    top_tippers: Vec<(Pubkey, u64)>, // Top 10 tippers
    created_at: i64,
    updated_at: i64,
    bump: u8,
}

// 2. Tip Record (Event)
TipEvent {
    tipper: Pubkey,             // Who sent the tip
    recipient: Pubkey,          // Tip profile owner
    amount: u64,                // Tip amount
    token_mint: Pubkey,         // Token used
    message: Option<String>,    // Optional message
    anonymous: bool,
    timestamp: i64,
}

// 3. Tip Goal Account
TipGoal {
    profile: Pubkey,            // Associated tip profile
    title: String,
    description: String,
    target_amount: u64,
    current_amount: u64,        // Progress
    token_mint: Pubkey,
    deadline: Option<i64>,
    completed: bool,
    contributors: u32,          // Number of unique contributors
    created_at: i64,
    bump: u8,
}

// 4. Transaction Receipt
WithdrawalReceipt {
    profile: Pubkey,
    amount: u64,
    token_mint: Pubkey,
    recipient: Pubkey,
    timestamp: i64,
    tx_signature: String,
}
```

---

## 🏗️ SYSTEM ARCHITECTURE

### **1. PROGRAM ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLANA BLOCKCHAIN                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           SOLTIP ANCHOR PROGRAM                       │ │
│  │                                                       │ │
│  │  ┌─────────────────┐  ┌──────────────────┐          │ │
│  │  │  Instructions   │  │  State Accounts  │          │ │
│  │  │                 │  │                  │          │ │
│  │  │ • create_profile│  │ • TipProfile     │          │ │
│  │  │ • send_tip      │  │ • TipGoal        │          │ │
│  │  │ • withdraw      │  │ • TipRecord      │          │ │
│  │  │ • update_profile│  │                  │          │ │
│  │  │ • create_goal   │  │                  │          │ │
│  │  │ • close_goal    │  │                  │          │ │
│  │  └─────────────────┘  └──────────────────┘          │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │              SECURITY LAYER                     │ │ │
│  │  │  • Ownership validation                         │ │ │
│  │  │  • Amount limits (max tip: 1000 SOL)           │ │ │
│  │  │  • Re-entrancy protection                      │ │ │
│  │  │  • Integer overflow checks                     │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE LAYER                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Indexer    │  │   Webhook    │  │   Analytics     │  │
│  │   Service    │  │   Service    │  │   Engine        │  │
│  │              │  │              │  │                 │  │
│  │ • Parse txs  │  │ • Real-time  │  │ • Leaderboards  │  │
│  │ • Store DB   │  │   alerts     │  │ • Statistics    │  │
│  │ • GraphQL    │  │ • Email/SMS  │  │ • Charts        │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Web App     │  │  Widget      │  │  Mobile App     │  │
│  │  (Next.js)   │  │  (Embed)     │  │  (React Native) │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW DIAGRAMS

### **1. TIP CREATION FLOW**

```
┌──────────┐
│  Tipper  │
│  Wallet  │
└────┬─────┘
     │
     │ 1. Click "Send Tip" (5 USDC)
     ↓
┌────────────────┐
│   Frontend     │
│   (Web/Widget) │
└────┬───────────┘
     │
     │ 2. Create transaction
     │    - Instruction: send_tip
     │    - Params: {amount: 5_000_000, token: USDC, message: "Great!"}
     ↓
┌────────────────┐
│  Wallet Popup  │
│  (Phantom/etc) │
└────┬───────────┘
     │
     │ 3. User approves & signs transaction
     ↓
┌─────────────────────────────────────┐
│      SOLANA BLOCKCHAIN              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  SolTip Program               │ │
│  │                               │ │
│  │  1. Validate tipper wallet   │ │
│  │  2. Validate recipient exists │ │
│  │  3. Check amount > min_tip   │ │
│  │  4. Transfer USDC tokens     │ │
│  │  5. Update profile stats     │ │
│  │  6. Emit TipEvent            │ │
│  └───────────────────────────────┘ │
└─────────────────┬───────────────────┘
                  │
                  │ 4. Transaction confirmed
                  ↓
┌─────────────────────────────────────┐
│      Indexer Service                │
│                                     │
│  1. Parse TipEvent                  │
│  2. Store in database               │
│  3. Update leaderboard              │
│  4. Trigger webhook                 │
└─────────────────┬───────────────────┘
                  │
                  │ 5. Send notification
                  ↓
┌─────────────────────────────────────┐
│      Webhook Service                │
│                                     │
│  • Email: "You received 5 USDC!"   │
│  • SMS (optional)                   │
│  • Discord/Telegram bot             │
│  • On-screen alert (streaming)      │
└─────────────────────────────────────┘
```

### **2. WITHDRAWAL FLOW**

```
┌──────────┐
│ Creator  │
└────┬─────┘
     │
     │ 1. Click "Withdraw 100 USDC"
     ↓
┌────────────────┐
│   Dashboard    │
└────┬───────────┘
     │
     │ 2. Create withdraw transaction
     ↓
┌────────────────────────────────┐
│    SolTip Program              │
│                                │
│  1. Validate owner             │
│  2. Check balance >= 100 USDC  │
│  3. Calculate fee (2%)         │
│  4. Transfer 98 USDC to owner  │
│  5. Transfer 2 USDC to treasury│
│  6. Update available_balance   │
│  7. Create WithdrawalReceipt   │
└────────────────┬───────────────┘
                 │
                 │ 3. Funds received
                 ↓
┌────────────────────────────────┐
│      Creator Wallet            │
│      + 98 USDC                 │
└────────────────────────────────┘
```

---

## 👥 USER FLOW DIAGRAMS

### **FLOW 1: Creator Onboarding**

```
START
  ↓
Connect Wallet (Phantom/Solflare)
  ↓
Click "Create Tip Profile"
  ↓
Fill Form:
  • Username: "johndoe"
  • Display Name: "John Doe"
  • Bio: "Gaming streamer"
  • Profile Picture URL
  • Accepted Tokens: [SOL, USDC]
  ↓
Submit Transaction (0.01 SOL rent)
  ↓
Profile Created ✅
  ↓
Get Shareable Link:
  "soltip.app/johndoe"
  ↓
Share on Social Media
  ↓
END
```

### **FLOW 2: Viewer Tipping**

```
START
  ↓
Visit: soltip.app/johndoe
  ↓
View Profile:
  • Total Tips: 1,234 SOL
  • Top Tippers Leaderboard
  • Active Goals
  ↓
Click "Send Tip"
  ↓
Choose Amount:
  [$1] [$5] [$10] [Custom]
  ↓
Select Token:
  [SOL] [USDC] [BONK]
  ↓
Optional:
  • Add Message (140 chars)
  • ☑ Send Anonymously
  ↓
Connect Wallet
  ↓
Approve Transaction
  ↓
Success! 🎉
  • Tip sent
  • Appears on leaderboard (if not anon)
  • Message displayed
  ↓
Share on Twitter (optional)
  ↓
END
```

### **FLOW 3: Goal Creation**

```
START (Creator Dashboard)
  ↓
Click "Create Goal"
  ↓
Fill Details:
  • Title: "New Gaming PC"
  • Description: "RTX 4090 Setup"
  • Target: 50 SOL
  • Token: SOL
  • Deadline: 30 days (optional)
  ↓
Submit Transaction
  ↓
Goal Created ✅
  ↓
Goal Displayed on Profile:
  ┌─────────────────────────┐
  │  New Gaming PC          │
  │  [████░░░░░░] 35 SOL    │
  │  70% • 15 SOL to go     │
  │  23 days left           │
  └─────────────────────────┘
  ↓
Viewers See Goal & Can Contribute
  ↓
When Goal Reached:
  • Confetti animation 🎊
  • Email notification
  • Goal marked "COMPLETED"
  ↓
END
```

---

## 🗄️ DATA MODELS

### **1. TIP PROFILE ACCOUNT**

```rust
#[account]
pub struct TipProfile {
    // Identity (256 bytes)
    pub owner: Pubkey,              // 32 bytes - Wallet address
    pub username: String,           // 36 bytes (4 + 32)
    pub display_name: String,       // 68 bytes (4 + 64)
    pub description: String,        // 260 bytes (4 + 256)
    pub image_url: String,          // 204 bytes (4 + 200)

    // Statistics (64 bytes)
    pub total_tips_received: u64,  // 8 bytes - Count
    pub total_amount_received: u64, // 8 bytes - SOL lamports
    pub total_tippers: u32,         // 4 bytes - Unique tippers
    pub active_goals: u8,           // 1 byte - Active goals count

    // Balances (variable)
    pub balances: Vec<TokenBalance>, // Token balances

    // Settings (20 bytes)
    pub min_tip_amount: u64,        // 8 bytes - Minimum tip
    pub withdrawal_fee_bps: u16,    // 2 bytes - Fee in basis points (200 = 2%)
    pub accept_anonymous: bool,     // 1 byte

    // Metadata (17 bytes)
    pub created_at: i64,            // 8 bytes - Unix timestamp
    pub updated_at: i64,            // 8 bytes - Unix timestamp
    pub bump: u8,                   // 1 byte - PDA bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TokenBalance {
    pub mint: Pubkey,               // 32 bytes
    pub amount: u64,                // 8 bytes
}

// Total size: ~1,000 bytes (needs exact calculation)
```

### **2. TIP GOAL ACCOUNT**

```rust
#[account]
pub struct TipGoal {
    pub profile: Pubkey,            // 32 bytes - Associated profile
    pub goal_id: u64,               // 8 bytes - Unique ID

    pub title: String,              // 68 bytes (4 + 64)
    pub description: String,        // 260 bytes (4 + 256)

    pub target_amount: u64,         // 8 bytes
    pub current_amount: u64,        // 8 bytes
    pub token_mint: Pubkey,         // 32 bytes

    pub deadline: Option<i64>,      // 9 bytes (1 + 8)
    pub completed: bool,            // 1 byte
    pub completed_at: Option<i64>,  // 9 bytes

    pub contributors: u32,          // 4 bytes
    pub top_contributors: Vec<Contributor>, // Variable

    pub created_at: i64,            // 8 bytes
    pub bump: u8,                   // 1 byte
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Contributor {
    pub wallet: Pubkey,             // 32 bytes
    pub amount: u64,                // 8 bytes
}

// Total size: ~500 bytes
```

---

## 🔒 SECURITY ARCHITECTURE

### **1. SECURITY LAYERS**

```
┌─────────────────────────────────────────────┐
│  LAYER 1: Input Validation                 │
│  • Username: alphanumeric, 3-32 chars      │
│  • Amount: > 0, < MAX_TIP (1000 SOL)       │
│  • Message: UTF-8, max 140 chars           │
│  • URLs: Valid format, https only          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  LAYER 2: Ownership & Authorization        │
│  • Profile owner check                      │
│  • Signer validation                        │
│  • PDA derivation verification              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  LAYER 3: Financial Security                │
│  • Overflow checks (checked_add)            │
│  • Underflow checks (checked_sub)           │
│  • Balance verification                     │
│  • Minimum balance requirements             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  LAYER 4: Re-entrancy Protection            │
│  • Single transaction atomicity             │
│  • No external calls mid-execution          │
│  • State updates before transfers           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  LAYER 5: Rate Limiting (Off-Chain)         │
│  • Max 100 tips per wallet per hour         │
│  • Max 10 withdrawals per day               │
│  • IP-based rate limiting                   │
└─────────────────────────────────────────────┘
```

### **2. ATTACK VECTORS & MITIGATIONS**

```rust
// ATTACK 1: Integer Overflow
// ❌ Vulnerable Code:
total_amount += tip_amount; // Can overflow

// ✅ Secure Code:
total_amount = total_amount
    .checked_add(tip_amount)
    .ok_or(ErrorCode::MathOverflow)?;

// ATTACK 2: Unauthorized Withdrawal
// ❌ Vulnerable Code:
// No owner check

// ✅ Secure Code:
require!(
    ctx.accounts.tip_profile.owner == ctx.accounts.signer.key(),
    ErrorCode::Unauthorized
);

// ATTACK 3: Drain Attack (Small Tips Spam)
// ✅ Mitigation:
require!(
    amount >= tip_profile.min_tip_amount,
    ErrorCode::TipTooSmall
);

// ATTACK 4: Message Injection
// ✅ Mitigation:
pub fn validate_message(msg: &str) -> Result<()> {
    require!(msg.len() <= 140, ErrorCode::MessageTooLong);
    require!(msg.is_ascii(), ErrorCode::InvalidCharacters);
    require!(!msg.contains("<script"), ErrorCode::PotentialXSS);
    Ok(())
}

// ATTACK 5: PDA Collision
// ✅ Mitigation:
let (profile_pda, bump) = Pubkey::find_program_address(
    &[
        b"tip_profile",
        username.as_bytes(),
        owner.as_ref(),
    ],
    program_id,
);
```

---

## ✨ BONUS FEATURES (State-of-the-Art)

### **1. SUBSCRIPTION TIPPING**
```rust
pub struct Subscription {
    pub tipper: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,              // Amount per interval
    pub interval: u64,            // Seconds (2592000 = monthly)
    pub next_payment: i64,        // Next charge timestamp
    pub auto_renew: bool,
    pub total_paid: u64,
}
```

**How it works:**
- Tipper pre-authorizes recurring tips
- Off-chain cron job triggers monthly payments
- Can cancel anytime

### **2. TIP SPLIT (Multi-Recipient)**
```rust
pub struct TipSplit {
    pub recipients: Vec<(Pubkey, u16)>, // (wallet, percentage in bps)
}

// Example: Band with 4 members
recipients: [
    (member1, 2500), // 25%
    (member2, 2500), // 25%
    (member3, 2500), // 25%
    (member4, 2500), // 25%
]
```

### **3. TIP BATTLES / WARS**
```rust
pub struct TipWar {
    pub team_a: Pubkey,
    pub team_b: Pubkey,
    pub team_a_total: u64,
    pub team_b_total: u64,
    pub end_time: i64,
    pub prize_pool: u64,          // Winner takes all or splits
}
```

**Gamification:**
- Two streamers compete
- Viewers tip their favorite
- Highest tips wins prize pool

### **4. NFT RECEIPTS**
```rust
// Mint commemorative NFT for large tips
if tip_amount >= LARGE_TIP_THRESHOLD {
    mint_tip_nft(
        &tipper,
        &TipNFTMetadata {
            amount: tip_amount,
            recipient: profile.display_name,
            message: tip_message,
            timestamp: Clock::get()?.unix_timestamp,
        }
    )?;
}
```

### **5. LEADERBOARD BADGES**
```rust
pub enum Badge {
    TopTipper,           // #1 tipper
    FirstTip,            // First person to tip
    MegaTipper,          // Tipped > 100 SOL
    SerialTipper,        // 100+ tips sent
    GoalCompleter,       // Helped complete 10 goals
}
```

### **6. TIP MATCHING**
```rust
pub struct TipMatch {
    pub sponsor: Pubkey,
    pub match_percentage: u16,    // 100 = 100% match
    pub max_match_amount: u64,
    pub current_matched: u64,
}

// Sponsor matches tips dollar-for-dollar up to limit
```

### **7. ANALYTICS DASHBOARD**
```typescript
interface Analytics {
    totalTips: number;
    avgTipAmount: number;
    tipsByHour: { hour: number; count: number }[];
    topTokens: { token: string; percentage: number }[];
    retentionRate: number;        // Repeat tippers
    conversionRate: number;       // Visitors → Tippers
}
```

---

## 🚀 IMPLEMENTATION PHASES

### **PHASE 1: MVP (Week 1) - 15 hours**
- [ ] Create tip profile
- [ ] Send tip (SOL only)
- [ ] Withdraw funds
- [ ] Basic profile page
- [ ] Simple leaderboard

### **PHASE 2: Core Features (Week 2) - 15 hours**
- [ ] Multi-token support (USDC, USDT)
- [ ] Tip goals
- [ ] Anonymous tipping
- [ ] Message system
- [ ] Profile customization

### **PHASE 3: Advanced (Week 3) - 10 hours**
- [ ] Subscription tipping
- [ ] Tip splits
- [ ] NFT receipts
- [ ] Analytics dashboard
- [ ] Widget embed code

### **PHASE 4: Polish - 10 hours**
- [ ] Security audit
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] Testing

---

## 📦 DELIVERABLES

```
soltip-platform/
├── programs/
│   └── soltip/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── state/
│       │   │   ├── tip_profile.rs
│       │   │   ├── tip_goal.rs
│       │   │   └── subscription.rs
│       │   ├── instructions/
│       │   │   ├── create_profile.rs
│       │   │   ├── send_tip.rs
│       │   │   ├── withdraw.rs
│       │   │   ├── create_goal.rs
│       │   │   └── subscribe.rs
│       │   ├── errors.rs
│       │   └── constants.rs
│       └── Cargo.toml
├── app/
│   ├── frontend/ (Next.js)
│   ├── widget/ (Embeddable)
│   └── mobile/ (React Native)
├── services/
│   ├── indexer/
│   ├── webhooks/
│   └── analytics/
└── tests/
    ├── integration/
    └── unit/
```

---

This is the complete architecture! Ready to start building? 🚀
