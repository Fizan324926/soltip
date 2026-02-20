import type { Program, Idl } from '@coral-xyz/anchor';

// ============================================================
// getProgram
//
// Returns a global Program instance if one has been set by the
// AnchorProvider hook, or null if not yet available.
//
// This is intentionally a simple singleton so that non-hook
// contexts (e.g. RootLayout's useEffect) can access the program
// without prop-drilling or context traversal.
//
// The instance is set by calling `setGlobalProgram(program)` from
// the `useAnchorClient` hook (or equivalent provider effect).
// ============================================================

let _program: Program<Idl> | null = null;

/** Called by the Anchor provider once it has a valid Program. */
export function setGlobalProgram(program: Program<Idl> | null): void {
  _program = program;
}

/** Returns the global Program instance, or null if not initialized. */
export function getProgram(): Program<Idl> | null {
  return _program;
}
