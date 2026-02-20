use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::AppState;

pub async fn list_profiles(
    state: web::Data<AppState>,
    query: web::Query<ListQuery>,
) -> Result<HttpResponse, ApiError> {
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let only_verified = query.only_verified.unwrap_or(false);
    let search = query.search.clone().unwrap_or_default();
    let sort_by = query.sort_by.clone().unwrap_or_else(|| "created_at".to_string());
    let sort_order = query.sort_order.clone().unwrap_or_else(|| "desc".to_string());

    let order_clause = match (sort_by.as_str(), sort_order.as_str()) {
        ("total_tips_received", "asc") => "total_tips_received ASC",
        ("total_tips_received", _) => "total_tips_received DESC",
        ("total_amount_received_lamports", "asc") => "total_amount_received_lamports ASC",
        ("total_amount_received_lamports", _) => "total_amount_received_lamports DESC",
        ("username", "asc") => "username ASC",
        ("username", _) => "username DESC",
        ("created_at", "asc") => "created_at ASC",
        _ => "created_at DESC",
    };

    let query_str = format!(
        "SELECT * FROM profiles WHERE ($1 = '' OR username ILIKE concat('%%', $1, '%%') OR display_name ILIKE concat('%%', $1, '%%')) AND ($2 = false OR is_verified = true) ORDER BY {} LIMIT $3 OFFSET $4",
        order_clause
    );

    let profiles: Vec<Profile> = sqlx::query_as(&query_str)
        .bind(&search)
        .bind(only_verified)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM profiles WHERE ($1 = '' OR username ILIKE concat('%%', $1, '%%') OR display_name ILIKE concat('%%', $1, '%%')) AND ($2 = false OR is_verified = true)"
    )
        .bind(&search)
        .bind(only_verified)
        .fetch_one(&state.db)
        .await?;

    let items: Vec<ProfileResponse> = profiles.into_iter().map(profile_to_response).collect();

    Ok(HttpResponse::Ok().json(PaginatedResponse {
        has_next_page: (page * page_size) < total.0,
        items,
        total: total.0,
        page,
        page_size,
    }))
}

pub async fn get_profile(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let address = path.into_inner();
    let profile: Option<Profile> = sqlx::query_as(
        "SELECT * FROM profiles WHERE owner_address = $1 OR profile_pda = $1 OR username = $1"
    )
        .bind(&address)
        .fetch_optional(&state.db)
        .await?;

    match profile {
        Some(p) => {
            let leaderboard = get_profile_leaderboard(&state.db, &p.profile_pda).await?;
            let mut resp = profile_to_response(p);
            resp.account.leaderboard = leaderboard;
            Ok(HttpResponse::Ok().json(resp))
        }
        None => Err(ApiError::NotFound(format!("Profile not found: {}", address))),
    }
}

pub async fn create_profile(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateProfileRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.owner_address {
        return Err(ApiError::Unauthorized("Wallet does not match owner_address".to_string()));
    }

    if body.username.is_empty() || body.username.len() > crate::config::MAX_USERNAME_LENGTH {
        return Err(ApiError::BadRequest("Invalid username length".to_string()));
    }

    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM profiles WHERE username = $1 OR owner_address = $2"
    )
        .bind(&body.username)
        .bind(&body.owner_address)
        .fetch_optional(&state.db)
        .await?;

    if existing.is_some() {
        return Err(ApiError::BadRequest("Profile already exists for this user or username is taken".to_string()));
    }

    let id = Uuid::new_v4();
    let profile_pda = format!("pda_{}", &body.owner_address[..8.min(body.owner_address.len())]);

    sqlx::query(
        "INSERT INTO profiles (id, owner_address, profile_pda, username, display_name, description, image_url, total_tips_received, total_amount_received_lamports, total_amount_received_spl, total_unique_tippers, active_goals_count, min_tip_amount, withdrawal_fee_bps, accept_anonymous, is_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, 0, 0, 0, 0, 0, true, false, NOW(), NOW())"
    )
        .bind(id)
        .bind(&body.owner_address)
        .bind(&profile_pda)
        .bind(&body.username)
        .bind(&body.display_name)
        .bind(&body.description)
        .bind(&body.image_url)
        .execute(&state.db)
        .await?;

    let profile: Profile = sqlx::query_as("SELECT * FROM profiles WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(profile_to_response(profile)))
}

pub async fn update_profile(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    let address = path.into_inner();

    if auth.wallet_address != address {
        return Err(ApiError::Unauthorized("Wallet does not match profile owner".to_string()));
    }

    let profile: Option<Profile> = sqlx::query_as(
        "SELECT * FROM profiles WHERE owner_address = $1"
    )
        .bind(&address)
        .fetch_optional(&state.db)
        .await?;

    let profile = profile.ok_or_else(|| ApiError::NotFound("Profile not found".to_string()))?;

    let display_name = body.display_name.clone().unwrap_or(profile.display_name);
    let description = body.description.clone().unwrap_or(profile.description);
    let image_url = body.image_url.clone().unwrap_or(profile.image_url);
    let min_tip_amount = body.min_tip_amount.unwrap_or(profile.min_tip_amount);
    let withdrawal_fee_bps = body.withdrawal_fee_bps.unwrap_or(profile.withdrawal_fee_bps);
    let accept_anonymous = body.accept_anonymous.unwrap_or(profile.accept_anonymous);

    sqlx::query(
        "UPDATE profiles SET display_name = $1, description = $2, image_url = $3, min_tip_amount = $4, withdrawal_fee_bps = $5, accept_anonymous = $6, updated_at = NOW() WHERE id = $7"
    )
        .bind(&display_name)
        .bind(&description)
        .bind(&image_url)
        .bind(min_tip_amount)
        .bind(withdrawal_fee_bps)
        .bind(accept_anonymous)
        .bind(profile.id)
        .execute(&state.db)
        .await?;

    let updated: Profile = sqlx::query_as("SELECT * FROM profiles WHERE id = $1")
        .bind(profile.id)
        .fetch_one(&state.db)
        .await?;

    Ok(HttpResponse::Ok().json(profile_to_response(updated)))
}

pub async fn get_leaderboard(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let address = path.into_inner();
    let profile: Option<Profile> = sqlx::query_as(
        "SELECT * FROM profiles WHERE owner_address = $1 OR profile_pda = $1"
    )
        .bind(&address)
        .fetch_optional(&state.db)
        .await?;

    let profile = profile.ok_or_else(|| ApiError::NotFound("Profile not found".to_string()))?;
    let leaderboard = get_profile_leaderboard(&state.db, &profile.profile_pda).await?;

    Ok(HttpResponse::Ok().json(leaderboard))
}

async fn get_profile_leaderboard(
    pool: &sqlx::PgPool,
    profile_pda: &str,
) -> Result<Vec<LeaderboardResponse>, ApiError> {
    let entries: Vec<LeaderboardEntry> = sqlx::query_as(
        "SELECT tipper_address, COALESCE(SUM(amount_lamports), 0)::bigint as total_amount, COUNT(*)::int as tip_count FROM tips WHERE recipient_profile_pda = $1 AND is_anonymous = false GROUP BY tipper_address ORDER BY total_amount DESC LIMIT 10"
    )
        .bind(profile_pda)
        .fetch_all(pool)
        .await?;

    Ok(entries
        .into_iter()
        .map(|e| LeaderboardResponse {
            tipper: e.tipper_address,
            total_amount: e.total_amount.to_string(),
            tip_count: e.tip_count,
        })
        .collect())
}

fn profile_to_response(p: Profile) -> ProfileResponse {
    ProfileResponse {
        public_key: p.profile_pda.clone(),
        account: ProfileAccountResponse {
            owner: p.owner_address,
            username: p.username,
            display_name: p.display_name,
            description: p.description,
            image_url: p.image_url,
            total_tips_received: p.total_tips_received.to_string(),
            total_amount_received_lamports: p.total_amount_received_lamports.to_string(),
            total_amount_received_spl: p.total_amount_received_spl.to_string(),
            total_unique_tippers: p.total_unique_tippers,
            active_goals_count: p.active_goals_count,
            min_tip_amount: p.min_tip_amount.to_string(),
            withdrawal_fee_bps: p.withdrawal_fee_bps,
            accept_anonymous: p.accept_anonymous,
            is_verified: p.is_verified,
            created_at: p.created_at.timestamp(),
            updated_at: p.updated_at.timestamp(),
            leaderboard: vec![],
        },
    }
}
