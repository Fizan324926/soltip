-- SolTip Backend Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_address VARCHAR(64) NOT NULL UNIQUE,
    profile_pda VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(64) NOT NULL DEFAULT '',
    description VARCHAR(256) NOT NULL DEFAULT '',
    image_url VARCHAR(200) NOT NULL DEFAULT '',
    total_tips_received BIGINT NOT NULL DEFAULT 0,
    total_amount_received_lamports BIGINT NOT NULL DEFAULT 0,
    total_amount_received_spl BIGINT NOT NULL DEFAULT 0,
    total_unique_tippers INT NOT NULL DEFAULT 0,
    active_goals_count INT NOT NULL DEFAULT 0,
    min_tip_amount BIGINT NOT NULL DEFAULT 0,
    withdrawal_fee_bps INT NOT NULL DEFAULT 0,
    accept_anonymous BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_owner ON profiles(owner_address);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified);

-- ============================================================
-- Vaults
-- ============================================================
CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_address VARCHAR(64) NOT NULL,
    profile_pda VARCHAR(64) NOT NULL,
    vault_pda VARCHAR(64) NOT NULL UNIQUE,
    balance BIGINT NOT NULL DEFAULT 0,
    total_deposited BIGINT NOT NULL DEFAULT 0,
    total_withdrawn BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vaults_profile ON vaults(profile_pda);
CREATE INDEX IF NOT EXISTS idx_vaults_owner ON vaults(owner_address);

-- ============================================================
-- Tips
-- ============================================================
CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_signature VARCHAR(128) NOT NULL UNIQUE,
    tipper_address VARCHAR(64) NOT NULL,
    recipient_address VARCHAR(64) NOT NULL,
    recipient_profile_pda VARCHAR(64) NOT NULL,
    amount_lamports BIGINT NOT NULL,
    tip_type VARCHAR(16) NOT NULL DEFAULT 'sol',
    token_mint VARCHAR(64),
    message VARCHAR(280),
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tips_tipper ON tips(tipper_address);
CREATE INDEX IF NOT EXISTS idx_tips_recipient ON tips(recipient_address);
CREATE INDEX IF NOT EXISTS idx_tips_profile ON tips(recipient_profile_pda);
CREATE INDEX IF NOT EXISTS idx_tips_created ON tips(created_at DESC);

-- ============================================================
-- Goals
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_pda VARCHAR(64) NOT NULL UNIQUE,
    profile_pda VARCHAR(64) NOT NULL,
    goal_id BIGINT NOT NULL,
    title VARCHAR(64) NOT NULL,
    description VARCHAR(256) NOT NULL DEFAULT '',
    target_amount BIGINT NOT NULL,
    current_amount BIGINT NOT NULL DEFAULT 0,
    token_mint VARCHAR(64) NOT NULL DEFAULT '',
    deadline TIMESTAMPTZ,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    unique_contributors INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_profile ON goals(profile_pda);
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(profile_pda, completed);

-- ============================================================
-- Subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_pda VARCHAR(64) NOT NULL UNIQUE,
    subscriber_address VARCHAR(64) NOT NULL,
    recipient_profile_pda VARCHAR(64) NOT NULL,
    amount_per_interval BIGINT NOT NULL,
    interval_seconds BIGINT NOT NULL,
    next_payment_due TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    total_paid BIGINT NOT NULL DEFAULT 0,
    payment_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_spl BOOLEAN NOT NULL DEFAULT false,
    token_mint VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_payment_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subs_subscriber ON subscriptions(subscriber_address);
CREATE INDEX IF NOT EXISTS idx_subs_recipient ON subscriptions(recipient_profile_pda);
CREATE INDEX IF NOT EXISTS idx_subs_active ON subscriptions(is_active, next_payment_due);

-- ============================================================
-- Tip Splits
-- ============================================================
CREATE TABLE IF NOT EXISTS tip_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    split_pda VARCHAR(64) NOT NULL UNIQUE,
    profile_pda VARCHAR(64) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_splits_profile ON tip_splits(profile_pda);

CREATE TABLE IF NOT EXISTS split_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    split_id UUID NOT NULL REFERENCES tip_splits(id) ON DELETE CASCADE,
    wallet_address VARCHAR(64) NOT NULL,
    share_bps INT NOT NULL,
    label VARCHAR(64) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_split_recipients_split ON split_recipients(split_id);

-- ============================================================
-- Platform Config
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authority_address VARCHAR(64) NOT NULL,
    treasury_address VARCHAR(64) NOT NULL,
    platform_fee_bps INT NOT NULL DEFAULT 100,
    paused BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
