-- Analytics aggregates for dashboard stats
CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_pda VARCHAR(64) NOT NULL,
    date DATE NOT NULL,
    tip_count INTEGER DEFAULT 0,
    tip_total BIGINT DEFAULT 0,
    unique_tippers INTEGER DEFAULT 0,
    top_tipper_address VARCHAR(64),
    top_tipper_amount BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(profile_pda, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_profile ON analytics_daily(profile_pda);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_daily(date DESC);

-- Materialized view for leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_weekly AS
SELECT
    profile_pda,
    SUM(tip_total) as total_tips,
    SUM(tip_count) as tip_count,
    SUM(unique_tippers) as unique_tippers
FROM analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY profile_pda
ORDER BY total_tips DESC;

CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_monthly AS
SELECT
    profile_pda,
    SUM(tip_total) as total_tips,
    SUM(tip_count) as tip_count,
    SUM(unique_tippers) as unique_tippers
FROM analytics_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY profile_pda
ORDER BY total_tips DESC;

-- Function to aggregate daily stats (called by cron)
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO analytics_daily (profile_pda, date, tip_count, tip_total, unique_tippers)
    SELECT
        recipient_profile_pda,
        DATE(created_at),
        COUNT(*),
        SUM(amount),
        COUNT(DISTINCT tipper_address)
    FROM tips
    WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY recipient_profile_pda, DATE(created_at)
    ON CONFLICT (profile_pda, date)
    DO UPDATE SET
        tip_count = EXCLUDED.tip_count,
        tip_total = EXCLUDED.tip_total,
        unique_tippers = EXCLUDED.unique_tippers,
        updated_at = NOW();

    -- Refresh materialized views
    REFRESH MATERIALIZED VIEW leaderboard_weekly;
    REFRESH MATERIALIZED VIEW leaderboard_monthly;
END;
$$ LANGUAGE plpgsql;
