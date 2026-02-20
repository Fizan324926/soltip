// ============================================================
// SolTip Program IDL
//
// Program:  soltip
// Version:  0.1.0
// Address:  BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo
//
// Derived from programs/soltip/src/ source. Keep in sync with
// the on-chain deployment when the program is upgraded.
// ============================================================

export const SOLTIP_IDL = {
  address: 'BhynwWdN5g5S5FfCEgDovajaYQDq925S2Xs8vXas58uo',
  metadata: {
    name: 'soltip',
    version: '0.1.0',
    spec: '0.1.0',
    description: 'Decentralized SOL + SPL tipping platform on Solana',
  },

  // ── Instructions ──────────────────────────────────────────
  instructions: [
    // ---- Profile Management ------------------------------------
    {
      name: 'createProfile',
      discriminator: [119, 204, 26, 209, 174, 163, 185, 73],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] }, // "tip_profile"
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'username',    type: 'string' },
        { name: 'displayName', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'imageUrl',    type: 'string' },
      ],
    },
    {
      name: 'updateProfile',
      discriminator: [40, 52, 149, 78, 21, 169, 169, 201],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
      ],
      args: [
        { name: 'displayName',       type: { option: 'string' } },
        { name: 'description',       type: { option: 'string' } },
        { name: 'imageUrl',          type: { option: 'string' } },
        { name: 'minTipAmount',      type: { option: 'u64' } },
        { name: 'withdrawalFeeBps',  type: { option: 'u16' } },
        { name: 'acceptAnonymous',   type: { option: 'bool' } },
      ],
    },

    // ---- Vault Management --------------------------------------
    {
      name: 'initializeVault',
      discriminator: [48, 191, 163, 44, 71, 129, 63, 164],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        {
          name: 'vault',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [118, 97, 117, 108, 116] }, // "vault"
              { kind: 'account', path: 'tipProfile' },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },

    // ---- Tipping -----------------------------------------------
    {
      name: 'sendTip',
      discriminator: [250, 25, 163, 48, 249, 173, 146, 33],
      accounts: [
        { name: 'tipper', writable: true, signer: true },
        { name: 'recipientProfile', writable: true },
        { name: 'recipientOwner',   writable: true },
        {
          name: 'vault',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [118, 97, 117, 108, 116] },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'tipperRecord',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 112, 101, 114, 95, 114, 101, 99, 111, 114, 100] }, // "tipper_record"
              { kind: 'account', path: 'tipper' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'rateLimit',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [114, 97, 116, 101, 95, 108, 105, 109, 105, 116] }, // "rate_limit"
              { kind: 'account', path: 'tipper' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] }, // "platform_config"
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount',  type: 'u64' },
        { name: 'message', type: { option: 'string' } },
      ],
    },
    {
      name: 'sendTipSpl',
      discriminator: [155, 27, 141, 105, 178, 33, 74, 27],
      accounts: [
        { name: 'tipper', writable: true, signer: true },
        { name: 'recipientProfile', writable: true },
        { name: 'recipientOwner',   writable: false },
        { name: 'tipperTokenAccount',     writable: true },
        { name: 'recipientTokenAccount',  writable: true },
        { name: 'tokenMint' },
        {
          name: 'rateLimit',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [114, 97, 116, 101, 95, 108, 105, 109, 105, 116] },
              { kind: 'account', path: 'tipper' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'tokenProgram',  address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount',  type: 'u64' },
        { name: 'message', type: { option: 'string' } },
      ],
    },

    // ---- Splits ------------------------------------------------
    {
      name: 'configureSplit',
      discriminator: [99, 44, 158, 73, 230, 28, 53, 101],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        {
          name: 'tipSplit',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 115, 112, 108, 105, 116] }, // "tip_split"
              { kind: 'account', path: 'tipProfile' },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        {
          name: 'recipients',
          type: {
            vec: {
              defined: {
                name: 'SplitRecipient',
              },
            },
          },
        },
      ],
    },
    {
      name: 'sendTipSplit',
      discriminator: [202, 178, 66, 110, 222, 215, 190, 118],
      accounts: [
        { name: 'tipper', writable: true, signer: true },
        { name: 'recipientProfile', writable: true },
        {
          name: 'tipSplit',
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 115, 112, 108, 105, 116] },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'rateLimit',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [114, 97, 116, 101, 95, 108, 105, 109, 105, 116] },
              { kind: 'account', path: 'tipper' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount',  type: 'u64' },
        { name: 'message', type: { option: 'string' } },
      ],
    },

    // ---- Withdrawal --------------------------------------------
    {
      name: 'withdraw',
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        {
          name: 'vault',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [118, 97, 117, 108, 116] },
              { kind: 'account', path: 'tipProfile' },
            ],
          },
        },
        {
          name: 'platformTreasury',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 114, 101, 97, 115, 117, 114, 121] }, // "treasury"
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount', type: 'u64' },
      ],
    },
    {
      name: 'withdrawSpl',
      discriminator: [99, 16, 211, 145, 115, 41, 54, 161],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        { name: 'ownerTokenAccount',    writable: true },
        { name: 'platformFeeTokenAccount', writable: true },
        { name: 'tokenMint' },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'tokenProgram',  address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount', type: 'u64' },
      ],
    },

    // ---- Fundraising Goals ------------------------------------
    {
      name: 'createGoal',
      discriminator: [65, 24, 197, 211, 234, 94, 188, 36],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        {
          name: 'tipGoal',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 103, 111, 97, 108] }, // "tip_goal"
              { kind: 'account', path: 'tipProfile' },
              { kind: 'arg', path: 'goalId' },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'goalId',       type: 'u64' },
        { name: 'title',        type: 'string' },
        { name: 'description',  type: 'string' },
        { name: 'targetAmount', type: 'u64' },
        { name: 'tokenMint',    type: 'pubkey' },
        { name: 'deadline',     type: { option: 'i64' } },
      ],
    },
    {
      name: 'contributeGoal',
      discriminator: [65, 174, 82, 175, 69, 228, 55, 6],
      accounts: [
        { name: 'contributor', writable: true, signer: true },
        { name: 'recipientProfile', writable: true },
        { name: 'tipGoal', writable: true },
        {
          name: 'vault',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [118, 97, 117, 108, 116] },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amount',  type: 'u64' },
        { name: 'message', type: { option: 'string' } },
      ],
    },
    {
      name: 'closeGoal',
      discriminator: [211, 34, 70, 121, 224, 78, 142, 85],
      accounts: [
        { name: 'owner', writable: true, signer: true },
        {
          name: 'tipProfile',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 105, 112, 95, 112, 114, 111, 102, 105, 108, 101] },
              { kind: 'account', path: 'owner' },
            ],
          },
        },
        { name: 'tipGoal', writable: true },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },

    // ---- Subscriptions ----------------------------------------
    {
      name: 'createSubscription',
      discriminator: [187, 83, 83, 61, 245, 48, 245, 193],
      accounts: [
        { name: 'subscriber', writable: true, signer: true },
        { name: 'recipientProfile' },
        {
          name: 'subscription',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [115, 117, 98, 115, 99, 114, 105, 112, 116, 105, 111, 110] }, // "subscription"
              { kind: 'account', path: 'subscriber' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [
        { name: 'amountPerInterval', type: 'u64' },
        { name: 'intervalSeconds',   type: 'i64' },
        { name: 'isSpl',             type: 'bool' },
        { name: 'tokenMint',         type: 'pubkey' },
      ],
    },
    {
      name: 'cancelSubscription',
      discriminator: [141, 92, 147, 239, 201, 92, 178, 67],
      accounts: [
        { name: 'subscriber', writable: true, signer: true },
        { name: 'recipientProfile' },
        {
          name: 'subscription',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [115, 117, 98, 115, 99, 114, 105, 112, 116, 105, 111, 110] },
              { kind: 'account', path: 'subscriber' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },
    {
      name: 'processSubscription',
      discriminator: [94, 216, 130, 48, 18, 25, 189, 157],
      accounts: [
        { name: 'payer', writable: true, signer: true },
        { name: 'subscriber', writable: true },
        { name: 'recipientProfile', writable: true },
        {
          name: 'subscription',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [115, 117, 98, 115, 99, 114, 105, 112, 116, 105, 111, 110] },
              { kind: 'account', path: 'subscriber' },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'vault',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [118, 97, 117, 108, 116] },
              { kind: 'account', path: 'recipientProfile' },
            ],
          },
        },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },

    // ---- Platform Admin ---------------------------------------
    {
      name: 'initializePlatform',
      discriminator: [130, 45, 25, 45, 128, 129, 186, 7],
      accounts: [
        { name: 'authority', writable: true, signer: true },
        {
          name: 'platformConfig',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        {
          name: 'treasury',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [116, 114, 101, 97, 115, 117, 114, 121] },
            ],
          },
        },
        { name: 'systemProgram', address: '11111111111111111111111111111111' },
      ],
      args: [],
    },
    {
      name: 'verifyCreator',
      discriminator: [74, 167, 138, 90, 166, 27, 235, 199],
      accounts: [
        { name: 'authority', writable: true, signer: true },
        {
          name: 'platformConfig',
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
        { name: 'tipProfile', writable: true },
      ],
      args: [
        { name: 'verified', type: 'bool' },
      ],
    },
    {
      name: 'pausePlatform',
      discriminator: [13, 79, 123, 19, 105, 134, 111, 44],
      accounts: [
        { name: 'authority', writable: true, signer: true },
        {
          name: 'platformConfig',
          writable: true,
          pda: {
            seeds: [
              { kind: 'const', value: [112, 108, 97, 116, 102, 111, 114, 109, 95, 99, 111, 110, 102, 105, 103] },
            ],
          },
        },
      ],
      args: [
        { name: 'paused', type: 'bool' },
      ],
    },
  ],

  // ── Accounts ──────────────────────────────────────────────
  accounts: [
    {
      name: 'TipProfile',
      discriminator: [52, 57, 196, 201, 25, 228, 236, 113],
    },
    {
      name: 'Vault',
      discriminator: [211, 8, 232, 43, 2, 152, 117, 119],
    },
    {
      name: 'TipGoal',
      discriminator: [128, 230, 101, 237, 118, 138, 28, 120],
    },
    {
      name: 'Subscription',
      discriminator: [235, 226, 232, 80, 136, 80, 136, 38],
    },
    {
      name: 'TipperRecord',
      discriminator: [182, 131, 201, 19, 222, 205, 89, 228],
    },
    {
      name: 'TipSplit',
      discriminator: [91, 28, 9, 102, 177, 214, 130, 91],
    },
    {
      name: 'RateLimit',
      discriminator: [220, 67, 200, 89, 107, 234, 240, 171],
    },
    {
      name: 'PlatformConfig',
      discriminator: [11, 85, 243, 13, 254, 78, 13, 211],
    },
  ],

  // ── Types (defined structs used in instruction args / account fields) ─
  types: [
    {
      name: 'SplitRecipient',
      type: {
        kind: 'struct',
        fields: [
          { name: 'wallet',   type: 'pubkey' },
          { name: 'shareBps', type: 'u16' },
        ],
      },
    },
    {
      name: 'LeaderboardEntry',
      type: {
        kind: 'struct',
        fields: [
          { name: 'tipper',      type: 'pubkey' },
          { name: 'totalAmount', type: 'u64' },
          { name: 'tipCount',    type: 'u32' },
        ],
      },
    },
  ],

  // ── Events ────────────────────────────────────────────────
  events: [
    {
      name: 'TipSentEvent',
      discriminator: [206, 16, 25, 104, 148, 115, 177, 227],
      fields: [
        { name: 'tipper',          type: 'pubkey', index: false },
        { name: 'recipient',       type: 'pubkey', index: false },
        { name: 'recipientProfile',type: 'pubkey', index: false },
        { name: 'amount',          type: 'u64',    index: false },
        { name: 'message',         type: { option: 'string' }, index: false },
        { name: 'isNewTipper',     type: 'bool',   index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
    {
      name: 'SplTipSentEvent',
      discriminator: [177, 88, 33, 204, 10, 136, 234, 91],
      fields: [
        { name: 'tipper',          type: 'pubkey', index: false },
        { name: 'recipient',       type: 'pubkey', index: false },
        { name: 'recipientProfile',type: 'pubkey', index: false },
        { name: 'amount',          type: 'u64',    index: false },
        { name: 'tokenMint',       type: 'pubkey', index: false },
        { name: 'message',         type: { option: 'string' }, index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
    {
      name: 'WithdrawalEvent',
      discriminator: [22, 9, 133, 26, 160, 44, 71, 2],
      fields: [
        { name: 'owner',           type: 'pubkey', index: false },
        { name: 'amount',          type: 'u64',    index: false },
        { name: 'creatorReceives', type: 'u64',    index: false },
        { name: 'platformFee',     type: 'u64',    index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
    {
      name: 'SplWithdrawalEvent',
      discriminator: [144, 56, 20, 7, 193, 148, 33, 77],
      fields: [
        { name: 'owner',           type: 'pubkey', index: false },
        { name: 'amount',          type: 'u64',    index: false },
        { name: 'tokenMint',       type: 'pubkey', index: false },
        { name: 'platformFee',     type: 'u64',    index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
    {
      name: 'TipSplitSentEvent',
      discriminator: [98, 27, 190, 214, 229, 161, 105, 7],
      fields: [
        { name: 'tipper',          type: 'pubkey', index: false },
        { name: 'recipientProfile',type: 'pubkey', index: false },
        { name: 'totalAmount',     type: 'u64',    index: false },
        { name: 'numRecipients',   type: 'u8',     index: false },
        { name: 'message',         type: { option: 'string' }, index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
    {
      name: 'GoalContributionEvent',
      discriminator: [33, 156, 201, 77, 117, 5, 93, 44],
      fields: [
        { name: 'contributor',     type: 'pubkey', index: false },
        { name: 'goalPda',         type: 'pubkey', index: false },
        { name: 'amount',          type: 'u64',    index: false },
        { name: 'newTotal',        type: 'u64',    index: false },
        { name: 'goalCompleted',   type: 'bool',   index: false },
        { name: 'message',         type: { option: 'string' }, index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
    {
      name: 'SubscriptionProcessedEvent',
      discriminator: [100, 3, 57, 130, 23, 14, 67, 182],
      fields: [
        { name: 'subscriber',      type: 'pubkey', index: false },
        { name: 'recipientProfile',type: 'pubkey', index: false },
        { name: 'amount',          type: 'u64',    index: false },
        { name: 'nextPaymentDue',  type: 'i64',    index: false },
        { name: 'autoRenew',       type: 'bool',   index: false },
        { name: 'timestamp',       type: 'i64',    index: false },
      ],
    },
  ],

  // ── Errors ────────────────────────────────────────────────
  errors: [
    // Input Validation (6000–6009)
    { code: 6000, name: 'UsernameTooLong',        msg: 'Username is too long (max 32 characters)' },
    { code: 6001, name: 'DisplayNameTooLong',     msg: 'Display name is too long (max 64 characters)' },
    { code: 6002, name: 'DescriptionTooLong',     msg: 'Description is too long (max 256 characters)' },
    { code: 6003, name: 'ImageUrlTooLong',        msg: 'Image URL is too long (max 200 characters)' },
    { code: 6004, name: 'MessageTooLong',         msg: 'Tip message is too long (max 280 characters)' },
    { code: 6005, name: 'GoalTitleTooLong',       msg: 'Goal title is too long (max 64 characters)' },
    { code: 6006, name: 'GoalDescriptionTooLong', msg: 'Goal description is too long (max 256 characters)' },
    { code: 6007, name: 'InvalidUsername',        msg: 'Username contains invalid characters' },
    { code: 6008, name: 'UnsafeTextContent',      msg: 'Text contains unsafe characters' },
    { code: 6009, name: 'EmptyUsername',          msg: 'Username cannot be empty' },
    // Financial (6010–6017)
    { code: 6010, name: 'TipAmountTooSmall',      msg: 'Tip amount is below the minimum' },
    { code: 6011, name: 'TipAmountTooLarge',      msg: 'Tip amount exceeds the maximum (1000 SOL)' },
    { code: 6012, name: 'WithdrawalTooSmall',     msg: 'Withdrawal amount is below the minimum (0.01 SOL)' },
    { code: 6013, name: 'InsufficientBalance',    msg: 'Insufficient balance in vault' },
    { code: 6014, name: 'InvalidWithdrawalFee',   msg: 'Withdrawal fee must be between 0% and 10%' },
    { code: 6015, name: 'InvalidGoalAmount',      msg: 'Goal target amount must be greater than zero' },
    { code: 6016, name: 'InvalidMinTipAmount',    msg: 'Minimum tip amount is invalid' },
    { code: 6017, name: 'VaultBelowRentBuffer',   msg: 'Vault balance would fall below the rent-exempt buffer' },
    // Authorization (6018–6023)
    { code: 6018, name: 'Unauthorized',           msg: 'Not authorized to perform this action' },
    { code: 6019, name: 'NotProfileOwner',        msg: 'Only the profile owner can perform this action' },
    { code: 6020, name: 'NotGoalOwner',           msg: 'Only the goal creator can perform this action' },
    { code: 6021, name: 'NotSubscriber',          msg: 'Only the subscriber can perform this action' },
    { code: 6022, name: 'NotAdmin',               msg: 'Only the platform admin can perform this action' },
    { code: 6023, name: 'ProfileOwnerMismatch',   msg: 'Profile owner does not match' },
    // State (6024–6034)
    { code: 6024, name: 'UsernameAlreadyTaken',   msg: 'That username is already taken' },
    { code: 6025, name: 'GoalAlreadyCompleted',   msg: 'This goal has already been completed' },
    { code: 6026, name: 'GoalDeadlineExpired',    msg: 'The goal deadline has expired' },
    { code: 6027, name: 'InvalidGoalDeadline',    msg: 'Goal deadline must be in the future' },
    { code: 6028, name: 'GoalDurationTooLong',    msg: 'Goal duration exceeds the maximum of 1 year' },
    { code: 6029, name: 'MaxActiveGoalsReached',  msg: 'Maximum active goals reached (5)' },
    { code: 6030, name: 'SubscriptionNotActive',  msg: 'Subscription is not active' },
    { code: 6031, name: 'SubscriptionNotDue',     msg: 'Subscription payment is not yet due' },
    { code: 6032, name: 'CannotTipSelf',          msg: 'You cannot tip yourself' },
    { code: 6033, name: 'VaultNotInitialized',    msg: 'Vault is not initialized' },
    { code: 6034, name: 'PlatformPaused',         msg: 'The platform is currently paused for maintenance' },
    // Rate Limiting (6035–6036)
    { code: 6035, name: 'RateLimitExceeded',      msg: 'Too many tips — please wait for the cooldown period' },
    { code: 6036, name: 'DailyLimitExceeded',     msg: 'Daily tip limit reached (100 tips per day)' },
    // Math (6037–6040)
    { code: 6037, name: 'MathOverflow',           msg: 'Arithmetic overflow' },
    { code: 6038, name: 'MathUnderflow',          msg: 'Arithmetic underflow' },
    { code: 6039, name: 'DivisionByZero',         msg: 'Division by zero' },
    { code: 6040, name: 'InvalidCalculation',     msg: 'Invalid calculation result' },
    // Feature Flags (6041–6046)
    { code: 6041, name: 'SubscriptionsDisabled',  msg: 'Subscriptions are currently disabled' },
    { code: 6042, name: 'GoalsDisabled',          msg: 'Goals are currently disabled' },
    { code: 6043, name: 'AnonymousTipsDisabled',  msg: 'This creator does not accept anonymous tips' },
    { code: 6044, name: 'MultiTokenDisabled',     msg: 'Multi-token tips are currently disabled' },
    { code: 6045, name: 'TipSplitsDisabled',      msg: 'Tip splits are currently disabled' },
    { code: 6046, name: 'FeatureNotImplemented',  msg: 'This feature is not yet implemented' },
    // Token (6047–6051)
    { code: 6047, name: 'InvalidTokenMint',            msg: 'Invalid token mint address' },
    { code: 6048, name: 'TokenMintMismatch',           msg: 'Token mint does not match expected' },
    { code: 6049, name: 'InsufficientTokenBalance',    msg: 'Insufficient token balance' },
    { code: 6050, name: 'InvalidTokenAccount',         msg: 'Invalid token account' },
    { code: 6051, name: 'TokenAccountOwnerMismatch',   msg: 'Token account owner does not match' },
    // Splits (6052–6056)
    { code: 6052, name: 'InvalidSplitBps',        msg: 'Split percentages must add up to exactly 100%' },
    { code: 6053, name: 'TooManySplitRecipients', msg: 'Too many split recipients (maximum 5)' },
    { code: 6054, name: 'SplitNotFound',          msg: 'No split configuration found for this profile' },
    { code: 6055, name: 'SplitRecipientMismatch', msg: 'Split recipient does not match configuration' },
    { code: 6056, name: 'DuplicateSplitRecipient',msg: 'Duplicate recipient in split configuration' },
    // Reentrancy (6057)
    { code: 6057, name: 'ReentrancyDetected',     msg: 'Reentrancy detected' },
    // Account (6058–6061)
    { code: 6058, name: 'AccountNotInitialized',      msg: 'Account has not been initialized' },
    { code: 6059, name: 'AccountAlreadyInitialized',  msg: 'Account is already initialized' },
    { code: 6060, name: 'InvalidAccountData',         msg: 'Invalid account data' },
    { code: 6061, name: 'AccountSizeMismatch',        msg: 'Account size mismatch' },
    // PDA (6062–6064)
    { code: 6062, name: 'InvalidPDA',            msg: 'Invalid program-derived address' },
    { code: 6063, name: 'InvalidBump',           msg: 'Invalid PDA bump seed' },
    { code: 6064, name: 'InvalidSeeds',          msg: 'Invalid PDA seeds' },
    // Timestamp (6065–6067)
    { code: 6065, name: 'InvalidTimestamp',      msg: 'Invalid timestamp' },
    { code: 6066, name: 'TimestampInPast',       msg: 'Timestamp is in the past' },
    { code: 6067, name: 'TimestampTooFarFuture', msg: 'Timestamp is too far in the future' },
    // System (6068–6070)
    { code: 6068, name: 'InvalidSystemProgram',  msg: 'Invalid system program' },
    { code: 6069, name: 'InvalidTokenProgram',   msg: 'Invalid token program' },
    { code: 6070, name: 'NotRentExempt',         msg: 'Account is not rent-exempt' },
    // Business Logic (6071–6076)
    { code: 6071, name: 'NonZeroBalance',              msg: 'Cannot close account with a non-zero balance' },
    { code: 6072, name: 'NoTipsReceived',              msg: 'No tips have been received' },
    { code: 6073, name: 'EmptyLeaderboard',            msg: 'Leaderboard is empty' },
    { code: 6074, name: 'InvalidContributionAmount',   msg: 'Invalid contribution amount' },
    { code: 6075, name: 'InvalidSubscriptionInterval', msg: 'Subscription interval must be at least 1 day' },
    { code: 6076, name: 'InvalidSubscriptionAmount',   msg: 'Subscription amount must be greater than zero' },
  ],
} as const;

// ── Type convenience alias ────────────────────────────────────
export type SoltipIdl = typeof SOLTIP_IDL;
