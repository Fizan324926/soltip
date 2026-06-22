# SolTip Mainnet Deployment Guide

## Pre-Deployment Checklist

### 1. Security Audit
- [ ] Smart contract audited by reputable firm
- [ ] All tests passing (unit, integration, E2E)
- [ ] No hardcoded private keys or secrets
- [ ] Environment variables properly configured
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation on all user inputs

### 2. Infrastructure
- [ ] Production server with adequate resources
- [ ] SSL/TLS certificate configured
- [ ] Domain name configured
- [ ] Database backups enabled
- [ ] Monitoring and alerting set up

### 3. Smart Contract Deployment

```bash
# 1. Build the program in release mode
cd soltip
anchor build -- --features mainnet

# 2. Generate a new keypair for the program (KEEP THIS SAFE!)
solana-keygen new -o mainnet-program-keypair.json

# 3. Get the program ID
solana address -k mainnet-program-keypair.json

# 4. Update lib.rs with the new program ID
# declare_id!("YOUR_NEW_PROGRAM_ID");

# 5. Rebuild with the correct program ID
anchor build

# 6. Deploy to mainnet (requires funded wallet)
solana config set --url https://api.mainnet-beta.solana.com
solana program deploy \
  --program-id mainnet-program-keypair.json \
  target/deploy/soltip.so \
  --with-compute-unit-price 1000

# 7. Initialize the platform
anchor run initialize-mainnet
```

### 4. Backend Deployment

```bash
# 1. Set production environment variables
export DATABASE_URL="postgres://user:pass@prod-db:5432/soltip"
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export PROGRAM_ID="YOUR_MAINNET_PROGRAM_ID"
export RUST_LOG="info"
export CORS_ORIGINS="https://soltip.io"

# 2. Run migrations
cd backend
sqlx migrate run

# 3. Build and run
cargo build --release
./target/release/soltip-backend
```

### 5. Frontend Deployment

```bash
# 1. Update environment variables
cd app
echo "VITE_SOLANA_NETWORK=mainnet-beta" > .env.production
echo "VITE_RPC_URL=https://api.mainnet-beta.solana.com" >> .env.production
echo "VITE_PROGRAM_ID=YOUR_MAINNET_PROGRAM_ID" >> .env.production
echo "VITE_API_URL=https://api.soltip.io" >> .env.production

# 2. Build for production
npm run build

# 3. Deploy to CDN/hosting
# e.g., Vercel, Netlify, CloudFlare Pages
```

### 6. Post-Deployment Verification

1. **Create test profile** with small amount of SOL
2. **Send test tip** (0.001 SOL)
3. **Verify tip received** in creator's vault
4. **Test withdrawal** to ensure funds flow correctly
5. **Check all API endpoints** return expected data
6. **Monitor logs** for any errors

## Security Considerations

### Smart Contract
- Platform authority key stored in HSM or multisig
- Upgrade authority can be removed after stabilization
- All admin functions require authority signature

### Backend
- Rate limiting: 100 requests/minute per IP
- Request signing for sensitive operations
- SQL injection protection via parameterized queries
- No sensitive data in logs

### Frontend
- CSP headers configured
- No eval() or inline scripts
- Secure cookie settings
- HTTPS enforced

## Monitoring

### Recommended Services
- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry, LogRocket
- **Metrics**: Grafana + Prometheus
- **Logs**: Papertrail, Datadog

### Key Metrics to Monitor
- API response times
- Error rates
- Transaction success rate
- Active users (DAU/MAU)
- Total tip volume

## Emergency Procedures

### Pause Platform
```bash
# Via admin endpoint
curl -X POST https://api.soltip.io/api/v1/admin/pause \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"paused": true}'
```

### Or via smart contract
```bash
anchor run pause-platform
```

## Cost Estimates

| Item | Monthly Cost |
|------|-------------|
| Server (4 CPU, 8GB RAM) | $40-80 |
| Database (managed Postgres) | $25-50 |
| RPC Provider (Helius/QuickNode) | $50-200 |
| Domain + SSL | $10-15 |
| Monitoring | $0-50 |
| **Total** | **$125-395/month** |

## Support

- GitHub Issues: https://github.com/Fizan324926/soltip/issues
- Twitter: @soltip_io
