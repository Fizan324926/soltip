/**
 * SolTip – Post-deploy Platform Initialisation
 *
 * Run once after deployment to create the PlatformConfig PDA and seed
 * the treasury. The keypair at ~/.config/solana/id.json becomes the
 * platform authority.
 *
 * Usage:
 *   npx ts-node scripts/init_platform.ts [localnet|devnet|mainnet]
 */

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Soltip } from "../target/types/soltip";
import idl from "../target/idl/soltip.json";

const CLUSTER_URLS: Record<string, string> = {
  localnet: "http://127.0.0.1:8899",
  devnet:   "https://api.devnet.solana.com",
  mainnet:  "https://api.mainnet-beta.solana.com",
};

async function main() {
  const cluster = process.argv[2] ?? "localnet";
  const rpcUrl  = CLUSTER_URLS[cluster];
  if (!rpcUrl) {
    throw new Error(`Unknown cluster: ${cluster}. Use localnet, devnet, or mainnet.`);
  }

  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const wallet     = anchor.AnchorProvider.env().wallet;
  const provider   = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const programId = new PublicKey((idl as any).address);
  const program   = new anchor.Program(idl as any, provider) as anchor.Program<Soltip>;

  console.log(`\n🚀 Initialising SolTip platform on ${cluster}`);
  console.log(`   Program ID : ${programId}`);
  console.log(`   Authority  : ${wallet.publicKey}`);

  const [platformConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("platform_config")],
    programId
  );
  const [platformTreasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    programId
  );

  console.log(`   Config PDA : ${platformConfig}`);
  console.log(`   Treasury   : ${platformTreasury}`);

  // Check if already initialised
  try {
    const existing = await program.account.platformConfig.fetch(platformConfig);
    console.log(`\n⚠️  Platform already initialised.`);
    console.log(`   Authority    : ${existing.authority}`);
    console.log(`   Fee BPS      : ${existing.platformFeeBps}`);
    console.log(`   Paused       : ${existing.paused}`);
    return;
  } catch {
    // Not initialised yet – proceed
  }

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`\n💰 Authority balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    throw new Error("Insufficient balance – need at least 0.01 SOL for rent + seed");
  }

  const tx = await program.methods
    .initializePlatform()
    .accounts({
      authority:         wallet.publicKey,
      platformConfig,
      platformTreasury,
      systemProgram:     SystemProgram.programId,
    })
    .rpc();

  console.log(`\n✅ Platform initialised! Tx: ${tx}`);
  console.log(`   Config PDA : ${platformConfig}`);
  console.log(`   Treasury   : ${platformTreasury}`);

  const cfg = await program.account.platformConfig.fetch(platformConfig);
  console.log(`   Fee BPS    : ${cfg.platformFeeBps}`);
  console.log(`   Authority  : ${cfg.authority}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
