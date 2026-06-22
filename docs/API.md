# SolTip API Reference

Base URL: `https://api.soltip.io/api/v1` (or your deployment URL)

## Authentication

All mutating endpoints require wallet signature authentication.

### Token Format
```
Authorization: Bearer <signature>.<pubkey>.<timestamp>
```

- `signature`: Base58-encoded Ed25519 signature of the message
- `pubkey`: Base58-encoded wallet public key  
- `timestamp`: Unix timestamp (seconds)

### Signing Message
```
Sign this message to authenticate with SolTip: <timestamp>
```

Token expires after 5 minutes.

---

## Endpoints

### Health

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "ok",
  "service": "soltip-api",
  "version": "1.0.0"
}
```

---

### Profiles

#### GET /profiles
List creator profiles with pagination and filtering.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | - | Search by username or display name |
| `sort_by` | string | `created_at` | Sort field: `created_at`, `total_tips`, `total_earned` |
| `sort_order` | string | `desc` | Sort order: `asc`, `desc` |
| `only_verified` | boolean | `false` | Filter to verified creators only |
| `page` | integer | `1` | Page number |
| `page_size` | integer | `20` | Results per page (max 100) |

**Response:**
```json
{
  "items": [
    {
      "owner_address": "ABC123...",
      "username": "alice",
      "display_name": "Alice",
      "description": "Web3 creator",
      "image_url": "https://...",
      "is_verified": true,
      "total_tips_received": "150",
      "total_amount_received_lamports": "5000000000",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1000,
  "page": 1,
  "page_size": 20
}
```

#### GET /profiles/{address}
Get a single profile by wallet address.

**Response:**
```json
{
  "owner_address": "ABC123...",
  "username": "alice",
  "display_name": "Alice",
  "description": "Web3 creator",
  "image_url": "https://...",
  "is_verified": true,
  "total_tips_received": "150",
  "total_amount_received_lamports": "5000000000",
  "total_unique_tippers": 45,
  "leaderboard": [
    {
      "tipper": "DEF456...",
      "total_amount": "1000000000",
      "tip_count": 5
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### POST /profiles
Create a new profile. Requires authentication.

**Request Body:**
```json
{
  "owner_address": "ABC123...",
  "username": "alice",
  "display_name": "Alice",
  "description": "Web3 creator",
  "image_url": "https://..."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "profile_pda": "XYZ789..."
}
```

#### PUT /profiles/{address}
Update profile. Requires authentication as owner.

**Request Body:**
```json
{
  "display_name": "Alice Updated",
  "description": "New description",
  "image_url": "https://new-url...",
  "min_tip_amount": 100000,
  "accept_anonymous": true
}
```

**Response:** `200 OK`

#### GET /profiles/{address}/leaderboard
Get top tippers for a profile.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | `10` | Number of entries (max 100) |

**Response:**
```json
{
  "leaderboard": [
    {
      "tipper": "DEF456...",
      "total_amount": "1000000000",
      "tip_count": 5,
      "last_tip_at": "2024-01-20T15:00:00Z"
    }
  ]
}
```

---

### Vault

#### GET /vault/{profile_pda}
Get vault balance and stats.

**Response:**
```json
{
  "profile_pda": "ABC123...",
  "balance": "5000000000",
  "total_deposited": "10000000000",
  "total_withdrawn": "5000000000",
  "spl_balances": [
    {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "balance": "100000000"
    }
  ]
}
```

#### POST /vault/initialize
Initialize vault for a profile.

**Request Body:**
```json
{
  "owner_address": "ABC123...",
  "vault_pda": "XYZ789...",
  "profile_pda": "DEF456...",
  "tx_signature": "sig123..."
}
```

#### POST /vault/withdraw
Record a withdrawal.

**Request Body:**
```json
{
  "owner_address": "ABC123...",
  "amount": 1000000000,
  "tx_signature": "sig123..."
}
```

---

### Tips

#### POST /tips
Record a SOL tip.

**Request Body:**
```json
{
  "tx_signature": "sig123...",
  "tipper_address": "ABC123...",
  "recipient_address": "DEF456...",
  "amount_lamports": 100000000,
  "message": "Great content!",
  "is_anonymous": false
}
```

#### POST /tips/spl
Record an SPL token tip.

**Request Body:**
```json
{
  "tx_signature": "sig123...",
  "tipper_address": "ABC123...",
  "recipient_address": "DEF456...",
  "token_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 1000000,
  "message": "USDC tip!"
}
```

#### POST /tips/split
Record a tip with splits.

**Request Body:**
```json
{
  "tx_signature": "sig123...",
  "tipper_address": "ABC123...",
  "recipient_address": "DEF456...",
  "amount_lamports": 100000000,
  "message": "Split tip"
}
```

#### GET /tips/history/{address}
Get tip history for an address.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `page_size` | integer | `25` | Results per page (max 100) |
| `direction` | string | `all` | Filter: `sent`, `received`, `all` |

**Response:**
```json
{
  "tips": [
    {
      "tx_signature": "sig123...",
      "tipper_address": "ABC123...",
      "recipient_address": "DEF456...",
      "amount_lamports": "100000000",
      "message": "Great content!",
      "is_anonymous": false,
      "created_at": "2024-01-20T15:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 25
}
```

---

### Goals

#### GET /goals/{profile_pda}
List goals for a profile.

**Response:**
```json
{
  "goals": [
    {
      "goal_id": 1,
      "title": "New Equipment",
      "description": "Saving for a new camera",
      "target_amount": "10000000000",
      "current_amount": "5000000000",
      "token_mint": "So11111111111111111111111111111111111111112",
      "deadline": 1735689600,
      "completed": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /goals
Create a new goal.

**Request Body:**
```json
{
  "owner_address": "ABC123...",
  "goal_id": 1,
  "title": "New Equipment",
  "description": "Saving for a new camera",
  "target_amount": 10000000000,
  "token_mint": "So11111111111111111111111111111111111111112",
  "deadline": 1735689600
}
```

#### POST /goals/{goal_pda}/contribute
Record a goal contribution.

**Request Body:**
```json
{
  "contributor_address": "ABC123...",
  "amount_lamports": 100000000,
  "message": "Good luck!",
  "tx_signature": "sig123..."
}
```

#### DELETE /goals/{goal_pda}
Close a goal (owner only).

---

### Subscriptions

#### POST /subscriptions
Create a subscription.

**Request Body:**
```json
{
  "subscriber_address": "ABC123...",
  "recipient_address": "DEF456...",
  "amount_per_interval": 100000000,
  "interval_seconds": 2592000,
  "is_spl": false,
  "token_mint": "So11111111111111111111111111111111111111112",
  "tx_signature": "sig123..."
}
```

#### GET /subscriptions/subscriber/{address}
Get subscriptions for a subscriber.

**Response:**
```json
{
  "subscriptions": [
    {
      "subscription_pda": "XYZ789...",
      "subscriber": "ABC123...",
      "recipient": "DEF456...",
      "amount_per_interval": "100000000",
      "interval_seconds": 2592000,
      "next_payment_at": 1706400000,
      "is_active": true,
      "total_paid": "300000000"
    }
  ]
}
```

#### DELETE /subscriptions/{subscription_pda}
Cancel a subscription.

---

### Splits

#### GET /splits/{profile_pda}
Get split configuration for a profile.

**Response:**
```json
{
  "split_pda": "XYZ789...",
  "recipients": [
    {
      "wallet": "ABC123...",
      "share_bps": 5000,
      "label": "Co-creator"
    },
    {
      "wallet": "DEF456...",
      "share_bps": 5000,
      "label": "Manager"
    }
  ]
}
```

#### POST /splits
Configure splits.

**Request Body:**
```json
{
  "owner_address": "ABC123...",
  "recipients": [
    {
      "wallet": "DEF456...",
      "share_bps": 5000,
      "label": "Co-creator"
    },
    {
      "wallet": "GHI789...",
      "share_bps": 5000,
      "label": "Manager"
    }
  ]
}
```

---

### Polls

#### GET /polls/{profile_pda}
List polls for a profile.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `active_only` | boolean | `true` | Only return active polls |

**Response:**
```json
{
  "polls": [
    {
      "poll_id": 1,
      "title": "Next video topic?",
      "description": "Help me decide",
      "options": ["DeFi tutorial", "NFT guide", "DAO explainer"],
      "votes": [10, 25, 15],
      "total_votes": 50,
      "deadline": 1706400000,
      "is_active": true
    }
  ]
}
```

#### POST /polls
Create a poll.

**Request Body:**
```json
{
  "poll_id": 1,
  "title": "Next video topic?",
  "description": "Help me decide",
  "options": ["DeFi tutorial", "NFT guide", "DAO explainer"],
  "deadline": 1706400000
}
```

#### POST /polls/{poll_pda}/vote
Vote on a poll.

**Request Body:**
```json
{
  "option_index": 1,
  "amount": 100000000,
  "tx_signature": "sig123..."
}
```

#### DELETE /polls/{poll_pda}/close
Close a poll (creator only).

---

### Content Gates

#### GET /content-gates/{profile_pda}
List content gates for a profile.

**Response:**
```json
{
  "gates": [
    {
      "gate_id": 1,
      "title": "Exclusive Tutorial",
      "content_hash": "abc123...",
      "required_amount": "1000000000",
      "total_unlocks": 25,
      "is_active": true
    }
  ]
}
```

#### POST /content-gates
Create a content gate.

**Request Body:**
```json
{
  "gate_id": 1,
  "title": "Exclusive Tutorial",
  "content_url": "https://...",
  "required_amount": 1000000000
}
```

#### POST /content-gates/{gate_pda}/verify
Verify access to gated content.

**Response:**
```json
{
  "has_access": true,
  "content_url": "https://..."
}
```

---

### Referrals

#### POST /referrals
Register a referral.

**Request Body:**
```json
{
  "referee_profile_pda": "ABC123...",
  "fee_share_bps": 1000
}
```

#### GET /referrals/referrer/{address}
Get referrals by referrer.

**Response:**
```json
{
  "referrals": [
    {
      "referee_profile": "DEF456...",
      "fee_share_bps": 1000,
      "total_earned": "500000000",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Analytics

#### GET /analytics/{profile_pda}
Get analytics for a profile.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | integer | `30` | Number of days to include |

**Response:**
```json
{
  "summary": {
    "total_tips": 150,
    "total_amount": "5000000000",
    "unique_tippers": 45,
    "avg_tip_amount": "33333333"
  },
  "daily": [
    {
      "date": "2024-01-20",
      "tip_count": 5,
      "amount": "500000000",
      "unique_tippers": 3
    }
  ]
}
```

#### GET /leaderboard/{profile_pda}/{window}
Get windowed leaderboard.

**Path Parameters:**
- `window`: `weekly`, `monthly`, or `yearly`

**Response:**
```json
{
  "window": "monthly",
  "leaderboard": [
    {
      "tipper": "ABC123...",
      "total_amount": "1000000000",
      "tip_count": 10
    }
  ]
}
```

---

### Widget

#### GET /widget/{username}
Get widget configuration for embeds.

**Response:**
```json
{
  "username": "alice",
  "display_name": "Alice",
  "image_url": "https://...",
  "preset_amounts": [0.1, 0.5, 1, 5],
  "min_tip_amount": 100000,
  "accept_anonymous": true
}
```

#### GET /export/{profile_pda}/tips
Export tips as CSV. Returns downloadable file.

---

### Admin

#### GET /admin/config
Get platform configuration.

**Response:**
```json
{
  "paused": false,
  "platform_fee_bps": 250,
  "min_tip_lamports": 1000000,
  "max_tip_lamports": 1000000000000
}
```

#### POST /admin/pause
Pause/unpause platform (admin only).

**Request Body:**
```json
{
  "authority_address": "ADMIN_PUBKEY...",
  "paused": true
}
```

#### POST /admin/verify
Verify/unverify a creator (admin only).

**Request Body:**
```json
{
  "authority_address": "ADMIN_PUBKEY...",
  "creator_address": "CREATOR_PUBKEY...",
  "verified": true
}
```

---

### Price

#### GET /price/sol
Get current SOL price.

**Response:**
```json
{
  "token": "SOL",
  "price_usd": 95.50,
  "updated_at": 1706400000
}
```

---

## Error Responses

All errors return JSON with this format:

```json
{
  "error": "error_code",
  "message": "Human-readable message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/expired token |
| 403 | Forbidden - Not authorized for action |
| 404 | Not Found |
| 429 | Rate Limited - Too many requests |
| 500 | Server Error |

### Rate Limits

- 60 requests per minute per IP
- 429 response includes `Retry-After` header

---

## Webhooks

Creators can configure webhook URLs to receive events.

### Events

| Event | Description |
|-------|-------------|
| `tip.received` | New tip received |
| `goal.contributed` | Goal received contribution |
| `goal.completed` | Goal reached target |
| `subscription.created` | New subscription |
| `subscription.renewed` | Subscription payment processed |
| `subscription.cancelled` | Subscription cancelled |

### Payload Format

```json
{
  "event": "tip.received",
  "timestamp": 1706400000,
  "data": {
    "tx_signature": "sig123...",
    "tipper_address": "ABC123...",
    "amount_lamports": 100000000,
    "message": "Great work!"
  }
}
```

### Verification

Webhooks include `X-SolTip-Signature` header for HMAC-SHA256 verification.
