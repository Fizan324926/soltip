-- Subscription payments tracking
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY,
    subscription_id UUID NOT NULL,
    amount BIGINT NOT NULL,
    tx_signature VARCHAR(128),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',

    CONSTRAINT fk_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);

-- Add last_processed_at to subscriptions if not exists
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP WITH TIME ZONE;
