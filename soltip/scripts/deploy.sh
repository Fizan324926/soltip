#!/usr/bin/env bash
# ==========================================================
# SolTip – Deployment Script
#
# Usage:
#   ./scripts/deploy.sh [localnet|devnet|mainnet]
#
# Pre-requisites:
#   1. Solana CLI installed and in PATH
#   2. Anchor CLI installed (npm install -g @coral-xyz/anchor-cli)
#   3. Wallet keypair at ~/.config/solana/id.json
#   4. For devnet/mainnet: sufficient SOL for deployment
# ==========================================================

set -euo pipefail

CLUSTER="${1:-localnet}"
echo "🚀 Deploying SolTip to: $CLUSTER"

# ── Validate cluster ──────────────────────────────────────
case "$CLUSTER" in
  localnet)
    ENDPOINT="http://127.0.0.1:8899"
    ;;
  devnet)
    ENDPOINT="https://api.devnet.solana.com"
    ;;
  mainnet)
    ENDPOINT="https://api.mainnet-beta.solana.com"
    echo "⚠️  WARNING: Deploying to MAINNET. Press Ctrl+C to cancel."
    sleep 5
    ;;
  *)
    echo "❌ Unknown cluster: $CLUSTER. Use localnet, devnet, or mainnet."
    exit 1
    ;;
esac

# ── Configure Solana CLI ──────────────────────────────────
solana config set --url "$ENDPOINT"
echo "✅ Solana endpoint: $ENDPOINT"

WALLET=$(solana address)
echo "📬 Deployer wallet: $WALLET"

BALANCE=$(solana balance --lamports)
echo "💰 Balance: $BALANCE lamports"

# ── Build ─────────────────────────────────────────────────
echo ""
echo "🔨 Building program..."
anchor build

PROGRAM_ID=$(anchor keys list | grep soltip | awk '{print $2}')
echo "📋 Program ID: $PROGRAM_ID"

# ── Update declare_id if needed ───────────────────────────
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" \
  programs/soltip/src/lib.rs

# Rebuild with updated ID
anchor build

# ── Deploy ────────────────────────────────────────────────
echo ""
echo "📡 Deploying to $CLUSTER..."
anchor deploy --provider.cluster "$CLUSTER"

echo ""
echo "✅ Deployment complete!"
echo "   Program ID : $PROGRAM_ID"
echo "   Cluster    : $CLUSTER"
echo "   Endpoint   : $ENDPOINT"

# ── Post-deploy: initialise platform (localnet only) ──────
if [ "$CLUSTER" == "localnet" ]; then
  echo ""
  echo "🔧 Running post-deploy initialisation..."
  anchor run init-platform 2>/dev/null || \
    echo "  (No init-platform script found – run manually if needed)"
fi

echo ""
echo "🎉 Done. Verify on explorer:"
echo "   https://explorer.solana.com/address/$PROGRAM_ID?cluster=$CLUSTER"
