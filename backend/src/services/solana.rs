use serde::{Deserialize, Serialize};

/// Validate a Solana base58 address (32-byte pubkey)
pub fn validate_address(address: &str) -> Result<[u8; 32], String> {
    let bytes = bs58::decode(address)
        .into_vec()
        .map_err(|e| format!("Invalid base58: {}", e))?;
    if bytes.len() != 32 {
        return Err(format!("Expected 32 bytes, got {}", bytes.len()));
    }
    let mut arr = [0u8; 32];
    arr.copy_from_slice(&bytes);
    Ok(arr)
}

/// JSON-RPC request body
#[derive(Serialize)]
struct RpcRequest {
    jsonrpc: &'static str,
    id: u64,
    method: String,
    params: serde_json::Value,
}

/// JSON-RPC response
#[derive(Deserialize)]
struct RpcResponse {
    result: Option<serde_json::Value>,
    error: Option<serde_json::Value>,
}

/// Verify a transaction signature exists and succeeded on-chain
pub async fn verify_transaction(rpc_url: &str, signature: &str) -> Result<bool, String> {
    let client = reqwest::Client::new();

    let request = RpcRequest {
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses".to_string(),
        params: serde_json::json!([[signature]]),
    };

    let resp = client
        .post(rpc_url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("RPC request failed: {}", e))?;

    let rpc_resp: RpcResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse RPC response: {}", e))?;

    if let Some(err) = rpc_resp.error {
        return Err(format!("RPC error: {}", err));
    }

    match rpc_resp.result {
        Some(result) => {
            let value = result.get("value").and_then(|v| v.as_array());
            match value {
                Some(statuses) if !statuses.is_empty() => {
                    let status = &statuses[0];
                    if status.is_null() {
                        Ok(false) // Not found yet
                    } else {
                        // Check if there was an error in the transaction
                        let err = status.get("err");
                        Ok(err.is_none() || err.unwrap().is_null())
                    }
                }
                _ => Ok(false),
            }
        }
        None => Ok(false),
    }
}

/// Get account info from Solana RPC
pub async fn get_account_info(rpc_url: &str, address: &str) -> Result<Option<serde_json::Value>, String> {
    let client = reqwest::Client::new();

    let request = RpcRequest {
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo".to_string(),
        params: serde_json::json!([address, {"encoding": "base64"}]),
    };

    let resp = client
        .post(rpc_url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("RPC request failed: {}", e))?;

    let rpc_resp: RpcResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse RPC response: {}", e))?;

    if let Some(err) = rpc_resp.error {
        return Err(format!("RPC error: {}", err));
    }

    Ok(rpc_resp.result.and_then(|r| r.get("value").cloned()))
}
