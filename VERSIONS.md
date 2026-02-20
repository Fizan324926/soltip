# Version Matrix

All toolchain and dependency versions used in this project. Pinned to avoid
CI/build surprises and ensure reproducibility.

## Toolchain Versions

| Tool             | Version   | Where pinned                       | Notes                                    |
| ---------------- | --------- | ---------------------------------- | ---------------------------------------- |
| Rust (on-chain)  | stable (1.85+) | `soltip/rust-toolchain.toml`  | Host compiler for `anchor build`         |
| Rust (backend)   | stable (1.85+) | `backend/rust-toolchain.toml` | Stable, no BPF constraints               |
| Solana CLI       | 1.18.26   | Manual install via `solana-install` | Matches platform-tools BPF compiler      |
| Anchor CLI       | 0.30.1    | `avm use 0.30.1`                   | Must match `anchor-lang` on-chain crate  |
| Node.js          | 20.x      | `.nvmrc` (app + soltip)            | LTS, also pinned in `engines`            |
| npm              | 10.x      | `engines` in `package.json`        | Comes with Node 20                       |
| PostgreSQL       | 16        | `docker-compose.yml`               | Any 14+ works                            |

## On-Chain Dependencies (soltip/)

| Crate              | Version  | Notes                             |
| ------------------ | -------- | --------------------------------- |
| `anchor-lang`      | 0.30.1   | Must match Anchor CLI version     |
| `anchor-spl`       | 0.30.1   | Token operations                  |
| `solana-program`    | 1.18.26  | Via anchor-lang transitive        |

## Backend Dependencies (backend/)

| Crate           | Version | Notes                              |
| --------------- | ------- | ---------------------------------- |
| `actix-web`     | 4.x     | HTTP framework                     |
| `actix-cors`    | 0.7     | CORS middleware                    |
| `sqlx`          | 0.8     | PostgreSQL driver + migrations     |
| `reqwest`       | 0.12    | HTTP client (rustls, no OpenSSL)   |
| `jsonwebtoken`  | 9.x     | JWT auth                           |
| `ed25519-dalek` | 2.x     | Solana signature verification      |
| `serde`         | 1.x     | Serialization                      |
| `chrono`        | 0.4     | Date/time                          |
| `uuid`          | 1.x     | UUID generation                    |

## Frontend Dependencies (app/)

| Package                       | Version  | Notes                        |
| ----------------------------- | -------- | ---------------------------- |
| React                         | 18.3.x   |                              |
| Vite                          | 5.4.x    | Build tool                   |
| TypeScript                    | 5.6.x    |                              |
| `@coral-xyz/anchor`           | 0.32.1   | JS client (different from CLI)|
| `@solana/web3.js`             | 1.95.x   |                              |
| `@solana/wallet-adapter-*`    | 0.15.x   |                              |
| TailwindCSS                   | 3.4.x    |                              |
| Radix UI                      | latest   | Accessible UI primitives     |
| Framer Motion                 | 11.x    | Animations                   |
| Recharts                      | 2.13.x   | Charts                       |
| React Query                   | 5.62.x   | Server state management      |
| Zustand                       | 5.x      | Client state                 |

## Test Dependencies (soltip/)

| Package      | Version | Notes                   |
| ------------ | ------- | ----------------------- |
| Mocha        | 9.x     | Test runner             |
| Chai         | 4.x     | Assertions              |
| ts-mocha     | 10.x    | TypeScript test support |

## Docker Images

| Service   | Base Image              | Notes                      |
| --------- | ----------------------- | -------------------------- |
| Backend   | `rust:slim-bookworm` (build), `debian:bookworm-slim` (runtime) | Multi-stage |
| Frontend  | `node:20-slim` (build), `nginx:alpine` (serve) | Multi-stage              |
| Postgres  | `postgres:16-alpine`    | Via docker-compose         |

## Compatibility Notes

- The Anchor JS client (`@coral-xyz/anchor` 0.32.1) in the frontend is
  intentionally a newer version than the CLI (0.30.1). The JS client is
  backwards-compatible and handles IDL changes gracefully.
- Solana Platform Tools bundles its own BPF-targeted rustc (1.79.0-dev).
  The `soltip/rust-toolchain.toml` pins the **host** compiler only.
- The backend uses `reqwest` with `rustls-tls` to avoid needing OpenSSL
  in the Docker runtime image.

## Upgrading

1. **Anchor**: Update `anchor-lang` in `soltip/Cargo.toml`, Anchor CLI
   via `avm install <version>`, and test with `anchor build && anchor test`.
   Update the host Rust version in `soltip/rust-toolchain.toml` if required.
2. **Solana CLI**: Follow the Solana docs. May require Anchor CLI update too.
3. **Node.js**: Update `.nvmrc` files and `engines` in both `package.json` files.
4. **Backend Rust**: Update `backend/rust-toolchain.toml` channel.
5. **Docker images**: Update base image tags in Dockerfiles and `docker-compose.yml`.
