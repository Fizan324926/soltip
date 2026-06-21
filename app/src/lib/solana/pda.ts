import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, SEEDS } from './constants';

// ============================================================
// Helper: encode a string seed as a Buffer
// ============================================================
function strSeed(s: string): Buffer {
  return Buffer.from(s, 'utf-8');
}

// ============================================================
// TipProfile PDA
// Seeds: [b"tip_profile", owner]
// ============================================================
export function findTipProfilePDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.TIP_PROFILE), owner.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================
// Vault PDA
// Seeds: [b"vault", profile_pda]
// ============================================================
export function findVaultPDA(profilePda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.VAULT), profilePda.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================
// TipGoal PDA
// Seeds: [b"tip_goal", profile_pda, goal_id_le_bytes]
// ============================================================
export function findGoalPDA(
  profilePda: PublicKey,
  goalId: BN
): [PublicKey, number] {
  // goal_id is u64 stored as little-endian 8 bytes
  const idBuf = Buffer.alloc(8);
  // BN.toArrayLike returns a Buffer; we write it LE
  const goalIdBytes = goalId.toArrayLike(Buffer, 'le', 8);
  goalIdBytes.copy(idBuf);

  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.TIP_GOAL), profilePda.toBuffer(), idBuf],
    PROGRAM_ID
  );
}

// ============================================================
// Subscription PDA
// Seeds: [b"subscription", subscriber, profile_pda]
// ============================================================
export function findSubscriptionPDA(
  subscriber: PublicKey,
  profilePda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.SUBSCRIPTION), subscriber.toBuffer(), profilePda.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================
// TipperRecord PDA
// Seeds: [b"tipper_record", tipper, profile_pda]
// ============================================================
export function findTipperRecordPDA(
  tipper: PublicKey,
  profilePda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      strSeed(SEEDS.TIPPER_RECORD),
      tipper.toBuffer(),
      profilePda.toBuffer(),
    ],
    PROGRAM_ID
  );
}

// ============================================================
// RateLimit PDA
// Seeds: [b"rate_limit", tipper, profile_pda]
// ============================================================
export function findRateLimitPDA(
  tipper: PublicKey,
  profilePda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.RATE_LIMIT), tipper.toBuffer(), profilePda.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================
// TipSplit PDA
// Seeds: [b"tip_split", profile_pda]
// ============================================================
export function findTipSplitPDA(profilePda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.TIP_SPLIT), profilePda.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================
// PlatformConfig PDA
// Seeds: [b"platform_config"]
// ============================================================
export function findPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.PLATFORM_CONFIG)],
    PROGRAM_ID
  );
}

// ============================================================
// Platform Treasury PDA
// Seeds: [b"treasury"]
// ============================================================
export function findPlatformTreasuryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.TREASURY)],
    PROGRAM_ID
  );
}

// ============================================================
// SPL Vault PDA (per-profile, per-mint)
// Seeds: [b"spl_vault", profile_pda, mint]
// ============================================================
export function findSplVaultPDA(
  profilePda: PublicKey,
  mint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.SPL_VAULT), profilePda.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
}

// ============================================================
// TipPoll PDA (v3)
// Seeds: [b"tip_poll", profile_pda, poll_id_le_bytes]
// ============================================================
export function findTipPollPDA(
  profilePda: PublicKey,
  pollId: bigint
): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  new BN(pollId.toString()).toArrayLike(Buffer, 'le', 8).copy(idBuf);
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.TIP_POLL), profilePda.toBuffer(), idBuf],
    PROGRAM_ID
  );
}

// ============================================================
// ContentGate PDA (v3)
// Seeds: [b"content_gate", profile_pda, gate_id_le_bytes]
// ============================================================
export function findContentGatePDA(
  profilePda: PublicKey,
  gateId: bigint
): [PublicKey, number] {
  const idBuf = Buffer.alloc(8);
  new BN(gateId.toString()).toArrayLike(Buffer, 'le', 8).copy(idBuf);
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.CONTENT_GATE), profilePda.toBuffer(), idBuf],
    PROGRAM_ID
  );
}

// ============================================================
// Referral PDA (v3)
// Seeds: [b"referral", referrer, referee_profile]
// ============================================================
export function findReferralPDA(
  referrer: PublicKey,
  refereeProfile: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [strSeed(SEEDS.REFERRAL), referrer.toBuffer(), refereeProfile.toBuffer()],
    PROGRAM_ID
  );
}
