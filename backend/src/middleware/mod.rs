use actix_web::{dev::ServiceRequest, Error, HttpMessage};
use actix_web::error::ErrorUnauthorized;
use ed25519_dalek::{Signature, VerifyingKey, Verifier};
use serde::{Deserialize, Serialize};

/// Authenticated wallet address extracted from a verified signature.
/// Handlers pull this from request extensions: `req.extensions().get::<WalletAuth>()`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletAuth {
    pub wallet_address: String,
}

/// Auth token format: `<base58_signature>.<base58_pubkey>.<timestamp_secs>`
///
/// The signed message is: `SolTip-Auth:<timestamp_secs>`
///
/// The timestamp must be within 5 minutes of server time to prevent replay attacks.
const AUTH_WINDOW_SECS: i64 = 300; // 5 minutes

/// Verify a wallet signature from the Authorization header.
///
/// Returns `Some(WalletAuth)` if valid, `None` if the header is absent,
/// or an error if the header is present but invalid.
pub fn verify_wallet_auth(req: &ServiceRequest) -> Result<Option<WalletAuth>, Error> {
    let header = match req.headers().get("Authorization") {
        Some(h) => h,
        None => return Ok(None),
    };

    let header_str = header.to_str().map_err(|_| ErrorUnauthorized("Invalid auth header"))?;

    // Strip "Bearer " prefix
    let token = header_str
        .strip_prefix("Bearer ")
        .or_else(|| header_str.strip_prefix("bearer "))
        .unwrap_or(header_str);

    // Legacy JWT tokens (starts with "ey") — skip verification for now
    if token.starts_with("ey") {
        return Ok(None);
    }

    // Parse: <signature>.<pubkey>.<timestamp>
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(ErrorUnauthorized("Invalid auth token format"));
    }

    let sig_bytes = bs58::decode(parts[0])
        .into_vec()
        .map_err(|_| ErrorUnauthorized("Invalid signature encoding"))?;
    let pubkey_bytes = bs58::decode(parts[1])
        .into_vec()
        .map_err(|_| ErrorUnauthorized("Invalid pubkey encoding"))?;
    let timestamp: i64 = parts[2]
        .parse()
        .map_err(|_| ErrorUnauthorized("Invalid timestamp"))?;

    // Check timestamp window
    let now = chrono::Utc::now().timestamp();
    if (now - timestamp).abs() > AUTH_WINDOW_SECS {
        return Err(ErrorUnauthorized("Auth token expired"));
    }

    // Reconstruct the signed message
    let message = format!("SolTip-Auth:{}", timestamp);

    // Verify ed25519 signature
    if pubkey_bytes.len() != 32 {
        return Err(ErrorUnauthorized("Invalid pubkey length"));
    }
    if sig_bytes.len() != 64 {
        return Err(ErrorUnauthorized("Invalid signature length"));
    }

    let mut pubkey_array = [0u8; 32];
    pubkey_array.copy_from_slice(&pubkey_bytes);
    let mut sig_array = [0u8; 64];
    sig_array.copy_from_slice(&sig_bytes);

    let verifying_key = VerifyingKey::from_bytes(&pubkey_array)
        .map_err(|_| ErrorUnauthorized("Invalid public key"))?;
    let signature = Signature::from_bytes(&sig_array);

    verifying_key
        .verify(message.as_bytes(), &signature)
        .map_err(|_| ErrorUnauthorized("Signature verification failed"))?;

    let wallet_address = bs58::encode(&pubkey_array).into_string();

    Ok(Some(WalletAuth { wallet_address }))
}

/// Extract wallet auth from request extensions (set by handlers that call verify).
/// Use in handlers:
/// ```ignore
/// let auth = require_wallet_auth(&req)?;
/// ```
pub fn require_wallet_auth(req: &actix_web::HttpRequest) -> Result<WalletAuth, Error> {
    // Try to get from extensions first (if middleware set it)
    if let Some(auth) = req.extensions().get::<WalletAuth>() {
        return Ok(auth.clone());
    }

    // Otherwise verify from header directly
    let header = req.headers().get("Authorization")
        .ok_or_else(|| ErrorUnauthorized("Authorization header required"))?;

    let header_str = header.to_str().map_err(|_| ErrorUnauthorized("Invalid auth header"))?;
    let token = header_str
        .strip_prefix("Bearer ")
        .or_else(|| header_str.strip_prefix("bearer "))
        .unwrap_or(header_str);

    if token.starts_with("ey") {
        return Err(ErrorUnauthorized("JWT auth not supported, use wallet signature"));
    }

    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err(ErrorUnauthorized("Invalid auth token format"));
    }

    let sig_bytes = bs58::decode(parts[0])
        .into_vec()
        .map_err(|_| ErrorUnauthorized("Invalid signature encoding"))?;
    let pubkey_bytes = bs58::decode(parts[1])
        .into_vec()
        .map_err(|_| ErrorUnauthorized("Invalid pubkey encoding"))?;
    let timestamp: i64 = parts[2]
        .parse()
        .map_err(|_| ErrorUnauthorized("Invalid timestamp"))?;

    let now = chrono::Utc::now().timestamp();
    if (now - timestamp).abs() > AUTH_WINDOW_SECS {
        return Err(ErrorUnauthorized("Auth token expired"));
    }

    let message = format!("SolTip-Auth:{}", timestamp);

    if pubkey_bytes.len() != 32 {
        return Err(ErrorUnauthorized("Invalid pubkey length"));
    }
    if sig_bytes.len() != 64 {
        return Err(ErrorUnauthorized("Invalid signature length"));
    }

    let mut pubkey_array = [0u8; 32];
    pubkey_array.copy_from_slice(&pubkey_bytes);
    let mut sig_array = [0u8; 64];
    sig_array.copy_from_slice(&sig_bytes);

    let verifying_key = VerifyingKey::from_bytes(&pubkey_array)
        .map_err(|_| ErrorUnauthorized("Invalid public key"))?;
    let signature = Signature::from_bytes(&sig_array);

    verifying_key
        .verify(message.as_bytes(), &signature)
        .map_err(|_| ErrorUnauthorized("Signature verification failed"))?;

    Ok(WalletAuth {
        wallet_address: bs58::encode(&pubkey_array).into_string(),
    })
}
