use lazy_static::lazy_static;
use prometheus::{
    Counter, CounterVec, Encoder, Histogram, HistogramOpts, HistogramVec, Opts, Registry,
    TextEncoder,
};

lazy_static! {
    pub static ref REGISTRY: Registry = Registry::new();

    // HTTP request counter
    pub static ref HTTP_REQUESTS_TOTAL: CounterVec = CounterVec::new(
        Opts::new("http_requests_total", "Total number of HTTP requests"),
        &["method", "endpoint", "status"]
    ).unwrap();

    // HTTP request duration histogram
    pub static ref HTTP_REQUEST_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("http_request_duration_seconds", "HTTP request duration in seconds")
            .buckets(vec![0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]),
        &["method", "endpoint"]
    ).unwrap();

    // Tips counter
    pub static ref TIPS_TOTAL: Counter = Counter::new(
        "tips_total",
        "Total number of tips processed"
    ).unwrap();

    // Tips amount histogram (in SOL)
    pub static ref TIP_AMOUNT_SOL: Histogram = Histogram::with_opts(
        HistogramOpts::new("tip_amount_sol", "Tip amounts in SOL")
            .buckets(vec![0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0, 50.0, 100.0])
    ).unwrap();

    // Active subscriptions gauge
    pub static ref SUBSCRIPTIONS_ACTIVE: prometheus::Gauge = prometheus::Gauge::new(
        "subscriptions_active",
        "Number of active subscriptions"
    ).unwrap();

    // Goals counter
    pub static ref GOALS_CREATED: Counter = Counter::new(
        "goals_created_total",
        "Total number of goals created"
    ).unwrap();

    // Goal contributions counter
    pub static ref GOAL_CONTRIBUTIONS: Counter = Counter::new(
        "goal_contributions_total",
        "Total number of goal contributions"
    ).unwrap();

    // Profiles counter
    pub static ref PROFILES_CREATED: Counter = Counter::new(
        "profiles_created_total",
        "Total number of profiles created"
    ).unwrap();

    // Database query duration
    pub static ref DB_QUERY_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("db_query_duration_seconds", "Database query duration in seconds")
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]),
        &["query_type"]
    ).unwrap();

    // RPC request duration
    pub static ref RPC_REQUEST_DURATION: HistogramVec = HistogramVec::new(
        HistogramOpts::new("rpc_request_duration_seconds", "Solana RPC request duration")
            .buckets(vec![0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]),
        &["method"]
    ).unwrap();

    // Error counter
    pub static ref ERRORS_TOTAL: CounterVec = CounterVec::new(
        Opts::new("errors_total", "Total number of errors"),
        &["type"]
    ).unwrap();
}

pub fn register_metrics() {
    REGISTRY.register(Box::new(HTTP_REQUESTS_TOTAL.clone())).ok();
    REGISTRY.register(Box::new(HTTP_REQUEST_DURATION.clone())).ok();
    REGISTRY.register(Box::new(TIPS_TOTAL.clone())).ok();
    REGISTRY.register(Box::new(TIP_AMOUNT_SOL.clone())).ok();
    REGISTRY.register(Box::new(SUBSCRIPTIONS_ACTIVE.clone())).ok();
    REGISTRY.register(Box::new(GOALS_CREATED.clone())).ok();
    REGISTRY.register(Box::new(GOAL_CONTRIBUTIONS.clone())).ok();
    REGISTRY.register(Box::new(PROFILES_CREATED.clone())).ok();
    REGISTRY.register(Box::new(DB_QUERY_DURATION.clone())).ok();
    REGISTRY.register(Box::new(RPC_REQUEST_DURATION.clone())).ok();
    REGISTRY.register(Box::new(ERRORS_TOTAL.clone())).ok();
}

pub fn get_metrics() -> String {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    String::from_utf8(buffer).unwrap()
}

// Helper to record HTTP request metrics
pub fn record_http_request(method: &str, endpoint: &str, status: u16, duration_secs: f64) {
    HTTP_REQUESTS_TOTAL
        .with_label_values(&[method, endpoint, &status.to_string()])
        .inc();
    HTTP_REQUEST_DURATION
        .with_label_values(&[method, endpoint])
        .observe(duration_secs);
}

// Helper to record tip
pub fn record_tip(amount_lamports: u64) {
    TIPS_TOTAL.inc();
    let amount_sol = amount_lamports as f64 / 1_000_000_000.0;
    TIP_AMOUNT_SOL.observe(amount_sol);
}

// Helper to record error
pub fn record_error(error_type: &str) {
    ERRORS_TOTAL.with_label_values(&[error_type]).inc();
}
