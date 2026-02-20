/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Solana cluster: 'devnet' | 'mainnet-beta' | 'localnet' */
  readonly VITE_SOLANA_NETWORK: string;

  /** Full RPC endpoint URL, e.g. https://api.devnet.solana.com */
  readonly VITE_RPC_URL: string;

  /** Base-58 public key of the deployed SolTip program */
  readonly VITE_PROGRAM_ID: string;

  /** Base-58 public key of the platform authority / upgrade authority */
  readonly VITE_PLATFORM_AUTHORITY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
