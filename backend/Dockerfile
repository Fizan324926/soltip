# ── Stage 1: Build ───────────────────────────────────────────────
FROM rust:slim-bookworm AS builder

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependency builds
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Build the real app
COPY src ./src
RUN touch src/main.rs && cargo build --release

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash appuser

COPY --from=builder /app/target/release/soltip-backend /usr/local/bin/soltip-backend
COPY migrations /app/migrations

WORKDIR /app
USER appuser

EXPOSE 8080

ENV RUST_LOG=info
ENV HOST=0.0.0.0
ENV PORT=8080

CMD ["soltip-backend"]
