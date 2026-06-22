-- SPL Token withdrawals tracking
CREATE TABLE IF NOT EXISTS spl_withdrawals (
    id UUID PRIMARY KEY,
    profile_pda VARCHAR(64) NOT NULL,
    token_mint VARCHAR(64) NOT NULL,
    amount BIGINT NOT NULL,
    tx_signature VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_profile FOREIGN KEY (profile_pda) REFERENCES profiles(profile_pda)
);

CREATE INDEX IF NOT EXISTS idx_spl_withdrawals_profile ON spl_withdrawals(profile_pda);
CREATE INDEX IF NOT EXISTS idx_spl_withdrawals_mint ON spl_withdrawals(token_mint);
CREATE INDEX IF NOT EXISTS idx_spl_withdrawals_created ON spl_withdrawals(created_at DESC);
