# SolTip Platform - Quick Start Guide

## Setup

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test
```

## Usage Examples

### 1. Create a Tip Profile

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Soltip } from "./target/types/soltip";

const program = anchor.workspace.Soltip as Program<Soltip>;
const creator = anchor.web3.Keypair.generate();

// Derive profile PDA
const [profilePda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("tip_profile"), creator.publicKey.toBuffer()],
  program.programId
);

// Create profile
await program.methods
  .createProfile(
    "my_username",           // username (lowercase, alphanumeric, underscores)
    "My Display Name",       // display name
    "My bio description",    // description
    "https://example.com/avatar.png"  // image URL
  )
  .accounts({
    owner: creator.publicKey,
    tipProfile: profilePda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([creator])
  .rpc();
```

### 2. Send a Tip (SOL)

```typescript
const tipper = anchor.web3.Keypair.generate();
const tipAmount = 0.1 * anchor.web3.LAMPORTS_PER_SOL;

await program.methods
  .sendTip(
    new anchor.BN(tipAmount),
    "Great content!"  // optional message
  )
  .accounts({
    tipper: tipper.publicKey,
    recipientProfile: profilePda,
    recipientOwner: creator.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([tipper])
  .rpc();
```

### 3. Send a Tip (SPL Token)

```typescript
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

await program.methods
  .sendTipSpl(
    new anchor.BN(amount),
    "Love your work!"
  )
  .accounts({
    tipper: tipper.publicKey,
    tipperTokenAccount: tipperTokenAccount,
    recipientProfile: profilePda,
    recipientOwner: creator.publicKey,
    recipientTokenAccount: recipientTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([tipper])
  .rpc();
```

### 4. Create a Fundraising Goal

```typescript
const goalId = 1;
const targetAmount = 5 * anchor.web3.LAMPORTS_PER_SOL;

// Derive goal PDA
const [goalPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("tip_goal"),
    profilePda.toBuffer(),
    new anchor.BN(goalId).toArrayLike(Buffer, "le", 8),
  ],
  program.programId
);

await program.methods
  .createGoal(
    new anchor.BN(goalId),
    "New Equipment Fund",
    "Raising funds for streaming setup",
    new anchor.BN(targetAmount),
    anchor.web3.SystemProgram.programId,  // SOL (use token mint for SPL)
    null  // optional deadline timestamp
  )
  .accounts({
    owner: creator.publicKey,
    tipProfile: profilePda,
    tipGoal: goalPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([creator])
  .rpc();
```

### 5. Contribute to a Goal

```typescript
const contributionAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;

await program.methods
  .contributeGoal(
    new anchor.BN(contributionAmount),
    "Supporting your goal!"
  )
  .accounts({
    contributor: tipper.publicKey,
    recipientProfile: profilePda,
    tipGoal: goalPda,
    recipientOwner: creator.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([tipper])
  .rpc();
```

### 6. Create a Subscription

```typescript
const amountPerInterval = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
const intervalSeconds = 86400; // 1 day

// Derive subscription PDA
const [subscriptionPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("subscription"),
    tipper.publicKey.toBuffer(),
    profilePda.toBuffer(),
  ],
  program.programId
);

await program.methods
  .createSubscription(
    new anchor.BN(amountPerInterval),
    new anchor.BN(intervalSeconds)
  )
  .accounts({
    subscriber: tipper.publicKey,
    recipientProfile: profilePda,
    recipientOwner: creator.publicKey,
    subscription: subscriptionPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([tipper])
  .rpc();
```

### 7. Process Subscription Payment

```typescript
await program.methods
  .processSubscription()
  .accounts({
    subscriber: tipper.publicKey,
    recipientProfile: profilePda,
    recipientOwner: creator.publicKey,
    subscription: subscriptionPda,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([tipper])
  .rpc();
```

### 8. Update Profile

```typescript
await program.methods
  .updateProfile(
    "New Display Name",  // or null to keep current
    "Updated bio",       // or null to keep current
    null,                // imageUrl
    null,                // minTipAmount
    null,                // withdrawalFeeBps
    false                // acceptAnonymous
  )
  .accounts({
    owner: creator.publicKey,
    tipProfile: profilePda,
  })
  .signers([creator])
  .rpc();
```

### 9. Close a Goal

```typescript
await program.methods
  .closeGoal()
  .accounts({
    owner: creator.publicKey,
    tipProfile: profilePda,
    tipGoal: goalPda,
  })
  .signers([creator])
  .rpc();
```

### 10. Cancel Subscription

```typescript
await program.methods
  .cancelSubscription()
  .accounts({
    subscriber: tipper.publicKey,
    recipientProfile: profilePda,
    recipientOwner: creator.publicKey,
    subscription: subscriptionPda,
  })
  .signers([tipper])
  .rpc();
```

## Fetching Account Data

### Get Profile Data

```typescript
const profile = await program.account.tipProfile.fetch(profilePda);

console.log("Username:", profile.username);
console.log("Display Name:", profile.displayName);
console.log("Total Tips:", profile.totalTipsReceived.toNumber());
console.log("Total Amount:", profile.totalAmountReceivedLamports.toNumber());
console.log("Unique Tippers:", profile.totalUniqueTippers);
console.log("Active Goals:", profile.activeGoalsCount);
```

### Get Goal Data

```typescript
const goal = await program.account.tipGoal.fetch(goalPda);

console.log("Title:", goal.title);
console.log("Target:", goal.targetAmount.toNumber());
console.log("Current:", goal.currentAmount.toNumber());
console.log("Completed:", goal.completed);
console.log("Contributors:", goal.uniqueContributors);
```

### Get Subscription Data

```typescript
const sub = await program.account.subscription.fetch(subscriptionPda);

console.log("Amount per interval:", sub.amountPerInterval.toNumber());
console.log("Interval (seconds):", sub.intervalSeconds.toNumber());
console.log("Next payment due:", sub.nextPaymentDue.toNumber());
console.log("Is active:", sub.isActive);
console.log("Total paid:", sub.totalPaid.toNumber());
console.log("Payment count:", sub.paymentCount);
```

## Important Notes

### Username Rules
- Lowercase letters only (a-z)
- Numbers (0-9)
- Underscores (_)
- Max 32 characters
- No spaces or special characters

### Limits
- **Min tip:** 1,000 lamports (0.000001 SOL)
- **Max tip:** 1,000,000,000,000 lamports (1,000 SOL)
- **Max active goals per profile:** 5
- **Max goal duration:** 1 year
- **Min subscription interval:** 1 day (86,400 seconds)

### PDA Derivation

All accounts use Program Derived Addresses (PDAs):

```typescript
// Tip Profile
[Buffer.from("tip_profile"), owner.publicKey.toBuffer()]

// Tip Goal
[
  Buffer.from("tip_goal"),
  profilePda.toBuffer(),
  new anchor.BN(goalId).toArrayLike(Buffer, "le", 8)
]

// Subscription
[
  Buffer.from("subscription"),
  subscriber.publicKey.toBuffer(),
  profilePda.toBuffer()
]
```

## Error Handling

```typescript
try {
  await program.methods
    .sendTip(new anchor.BN(amount), "message")
    .accounts({...})
    .signers([tipper])
    .rpc();
} catch (err) {
  if (err.toString().includes("TipAmountTooSmall")) {
    console.error("Tip amount is below minimum");
  } else if (err.toString().includes("CannotTipSelf")) {
    console.error("Cannot tip yourself");
  } else {
    console.error("Transaction failed:", err);
  }
}
```

## Common Error Codes

- `UsernameTooLong` - Username exceeds 32 characters
- `InvalidUsername` - Username contains invalid characters
- `TipAmountTooSmall` - Tip below minimum (1,000 lamports)
- `TipAmountTooLarge` - Tip exceeds maximum (1,000 SOL)
- `CannotTipSelf` - Attempting to tip your own profile
- `MaxActiveGoalsReached` - Profile has 5 active goals already
- `GoalAlreadyCompleted` - Goal is already completed
- `GoalDeadlineExpired` - Goal deadline has passed
- `SubscriptionNotActive` - Subscription is cancelled
- `SubscriptionNotDue` - Payment not yet due

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
anchor test

# Run with verbose output
anchor test -- --nocapture

# Run specific test
anchor test --skip-build -- --test "Profile Management"
```

## Next Steps

1. Deploy to devnet for testing
2. Build frontend UI
3. Implement analytics/indexing
4. Add event emissions
5. Implement vault system for production
6. Add admin features (verification, etc.)

## Support

For issues or questions, refer to:
- `IMPLEMENTATION.md` - Full technical documentation
- `ARCHITECTURE.md` - System design
- Test suite in `tests/soltip.ts` - Usage examples
