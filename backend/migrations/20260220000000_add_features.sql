-- ==========================================================
-- SolTip v3.0 – Polls, Content Gates, Referrals, Webhooks,
-- Extended Profile, Analytics, Time-Window Leaderboard
-- ==========================================================

-- Polls
CREATE TABLE IF NOT EXISTS polls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_pda        VARCHAR(64) UNIQUE NOT NULL,
    profile_pda     VARCHAR(64) NOT NULL REFERENCES profiles(profile_pda),
    poll_id         BIGINT NOT NULL,
    title           VARCHAR(64) NOT NULL,
    description     VARCHAR(256) NOT NULL DEFAULT '',
    options         JSONB NOT NULL DEFAULT '[]',
    total_votes     INT NOT NULL DEFAULT 0,
    total_amount    BIGINT NOT NULL DEFAULT 0,
    deadline        TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_polls_profile ON polls(profile_pda);
CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(profile_pda, is_active);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id         UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    voter_address   VARCHAR(64) NOT NULL,
    option_index    INT NOT NULL,
    amount          BIGINT NOT NULL DEFAULT 0,
    tx_signature    VARCHAR(128),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_id, voter_address)
);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);

-- Content gates
CREATE TABLE IF NOT EXISTS content_gates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_pda        VARCHAR(64) UNIQUE NOT NULL,
    profile_pda     VARCHAR(64) NOT NULL REFERENCES profiles(profile_pda),
    gate_id         BIGINT NOT NULL,
    title           VARCHAR(64) NOT NULL,
    content_url     VARCHAR(200) NOT NULL,
    required_amount BIGINT NOT NULL,
    access_count    INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gates_profile ON content_gates(profile_pda);

-- Content access records
CREATE TABLE IF NOT EXISTS content_access (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_id         UUID NOT NULL REFERENCES content_gates(id) ON DELETE CASCADE,
    accessor_address VARCHAR(64) NOT NULL,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(gate_id, accessor_address)
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_pda    VARCHAR(64) UNIQUE NOT NULL,
    referrer_address VARCHAR(64) NOT NULL,
    referee_profile_pda VARCHAR(64) NOT NULL REFERENCES profiles(profile_pda),
    fee_share_bps   INT NOT NULL DEFAULT 500,
    total_earned    BIGINT NOT NULL DEFAULT 0,
    referral_count  INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(referrer_address, referee_profile_pda)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_profile_pda);

-- Webhook deliveries log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_pda     VARCHAR(64) NOT NULL,
    webhook_url     VARCHAR(200) NOT NULL,
    event_type      VARCHAR(32) NOT NULL,
    payload         JSONB NOT NULL,
    status_code     INT,
    success         BOOLEAN NOT NULL DEFAULT FALSE,
    attempts        INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_profile ON webhook_deliveries(profile_pda, created_at DESC);

-- Extended profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preset_amounts JSONB NOT NULL DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links VARCHAR(256) NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_polls_count INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_gates_count INT NOT NULL DEFAULT 0;

-- Price cache (for SOL/USD display)
CREATE TABLE IF NOT EXISTS price_cache (
    id              VARCHAR(16) PRIMARY KEY,
    price_usd       DOUBLE PRECISION NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO price_cache (id, price_usd) VALUES ('SOL', 0.0) ON CONFLICT DO NOTHING;

-- Analytics materialized view (tip trends)
CREATE TABLE IF NOT EXISTS analytics_daily (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_pda     VARCHAR(64) NOT NULL,
    date            DATE NOT NULL,
    tip_count       INT NOT NULL DEFAULT 0,
    total_amount    BIGINT NOT NULL DEFAULT 0,
    unique_tippers  INT NOT NULL DEFAULT 0,
    spl_amount      BIGINT NOT NULL DEFAULT 0,
    UNIQUE(profile_pda, date)
);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_profile ON analytics_daily(profile_pda, date DESC);
