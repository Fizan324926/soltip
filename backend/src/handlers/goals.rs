use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::app_middleware::require_wallet_auth;
use crate::error::ApiError;
use crate::models::*;
use crate::services;
use crate::db;
use crate::AppState;

pub async fn list_goals(
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let profile_pda = path.into_inner();

    let goals: Vec<Goal> = sqlx::query_as(
        "SELECT * FROM goals WHERE profile_pda = $1 ORDER BY created_at DESC LIMIT 100"
    )
        .bind(&profile_pda)
        .fetch_all(&state.db)
        .await?;

    let items: Vec<GoalResponse> = goals.into_iter().map(goal_to_response).collect();
    Ok(HttpResponse::Ok().json(items))
}

pub async fn create_goal(
    req: HttpRequest,
    state: web::Data<AppState>,
    body: web::Json<CreateGoalRequest>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    if auth.wallet_address != body.owner_address {
        return Err(ApiError::Unauthorized("Wallet does not match owner_address".to_string()));
    }

    // BE-09: Validate Solana addresses
    services::solana::validate_address(&body.owner_address)
        .map_err(|e| ApiError::BadRequest(format!("Invalid owner_address: {}", e)))?;

    if body.title.is_empty() || body.title.len() > crate::config::MAX_GOAL_TITLE_LENGTH {
        return Err(ApiError::BadRequest("Invalid goal title length".to_string()));
    }
    if body.target_amount <= 0 {
        return Err(ApiError::BadRequest("Target amount must be positive".to_string()));
    }

    let profile: Option<(String,)> = sqlx::query_as(
        "SELECT profile_pda FROM profiles WHERE owner_address = $1"
    )
        .bind(&body.owner_address)
        .fetch_optional(&state.db)
        .await?;

    let profile_pda = profile
        .ok_or_else(|| ApiError::NotFound("Profile not found".to_string()))?
        .0;

    let id = Uuid::new_v4();
    let goal_pda = format!("goal_{}_{}", &profile_pda[..8.min(profile_pda.len())], body.goal_id);

    let deadline = body.deadline.map(|ts| {
        chrono::DateTime::from_timestamp(ts, 0).unwrap_or_else(|| chrono::Utc::now())
    });

    sqlx::query(
        "INSERT INTO goals (id, goal_pda, profile_pda, goal_id, title, description, target_amount, current_amount, token_mint, deadline, completed, completed_at, unique_contributors, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, false, NULL, 0, NOW())"
    )
        .bind(id)
        .bind(&goal_pda)
        .bind(&profile_pda)
        .bind(body.goal_id)
        .bind(&body.title)
        .bind(&body.description)
        .bind(body.target_amount)
        .bind(&body.token_mint)
        .bind(deadline)
        .execute(&state.db)
        .await?;

    // Increment active goals count
    sqlx::query("UPDATE profiles SET active_goals_count = active_goals_count + 1 WHERE profile_pda = $1")
        .bind(&profile_pda)
        .execute(&state.db)
        .await?;

    let goal: Goal = sqlx::query_as("SELECT * FROM goals WHERE id = $1")
        .bind(id)
        .fetch_one(&state.db)
        .await?;

    Ok(HttpResponse::Created().json(goal_to_response(goal)))
}

pub async fn contribute_goal(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
    body: web::Json<ContributeGoalRequest>,
) -> Result<HttpResponse, ApiError> {
    // BE-26: Check platform pause
    if db::platform::is_paused(&state.db).await? {
        return Err(ApiError::BadRequest("Platform is currently paused".to_string()));
    }

    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;

    // BE-05: Verify contributor identity
    if auth.wallet_address != body.contributor_address {
        return Err(ApiError::Unauthorized("Wallet does not match contributor_address".to_string()));
    }

    // BE-09: Validate Solana addresses
    services::solana::validate_address(&body.contributor_address)
        .map_err(|e| ApiError::BadRequest(format!("Invalid contributor_address: {}", e)))?;

    let goal_pda = path.into_inner();

    if body.amount_lamports <= 0 {
        return Err(ApiError::BadRequest("Amount must be positive".to_string()));
    }

    // BE-01: Verify transaction on-chain
    let tx_valid = services::solana::verify_transaction(&state.rpc_url, &body.tx_signature)
        .await
        .map_err(|e| ApiError::Solana(e))?;
    if !tx_valid {
        return Err(ApiError::BadRequest("Transaction not confirmed on-chain".to_string()));
    }

    let goal: Option<Goal> = sqlx::query_as("SELECT * FROM goals WHERE goal_pda = $1")
        .bind(&goal_pda)
        .fetch_optional(&state.db)
        .await?;

    let goal = goal.ok_or_else(|| ApiError::NotFound("Goal not found".to_string()))?;

    if goal.completed {
        return Err(ApiError::BadRequest("Goal is already completed".to_string()));
    }

    let new_amount = goal.current_amount + body.amount_lamports;
    let is_completed = new_amount >= goal.target_amount;

    sqlx::query(
        "UPDATE goals SET current_amount = $1, completed = $2, completed_at = CASE WHEN $2 THEN NOW() ELSE NULL END, unique_contributors = unique_contributors + 1 WHERE goal_pda = $3"
    )
        .bind(new_amount)
        .bind(is_completed)
        .bind(&goal_pda)
        .execute(&state.db)
        .await?;

    if is_completed {
        sqlx::query("UPDATE profiles SET active_goals_count = GREATEST(active_goals_count - 1, 0) WHERE profile_pda = $1")
            .bind(&goal.profile_pda)
            .execute(&state.db)
            .await?;
    }

    Ok(HttpResponse::Ok().json(TxResponse {
        success: true,
        message: if is_completed { "Goal completed!".to_string() } else { "Contribution recorded".to_string() },
    }))
}

pub async fn close_goal(
    req: HttpRequest,
    state: web::Data<AppState>,
    path: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    let auth = require_wallet_auth(&req).map_err(|_| ApiError::Unauthorized("Wallet auth required".to_string()))?;
    let goal_pda = path.into_inner();

    let goal: Option<Goal> = sqlx::query_as("SELECT * FROM goals WHERE goal_pda = $1")
        .bind(&goal_pda)
        .fetch_optional(&state.db)
        .await?;

    let goal = goal.ok_or_else(|| ApiError::NotFound("Goal not found".to_string()))?;

    // Verify the caller owns the profile that owns the goal
    let profile_owner: Option<(String,)> = sqlx::query_as(
        "SELECT owner_address FROM profiles WHERE profile_pda = $1"
    )
        .bind(&goal.profile_pda)
        .fetch_optional(&state.db)
        .await?;
    if let Some((owner,)) = &profile_owner {
        if auth.wallet_address != *owner {
            return Err(ApiError::Unauthorized("Only the profile owner can close goals".to_string()));
        }
    }

    sqlx::query("DELETE FROM goals WHERE goal_pda = $1")
        .bind(&goal_pda)
        .execute(&state.db)
        .await?;

    if !goal.completed {
        sqlx::query("UPDATE profiles SET active_goals_count = GREATEST(active_goals_count - 1, 0) WHERE profile_pda = $1")
            .bind(&goal.profile_pda)
            .execute(&state.db)
            .await?;
    }

    Ok(HttpResponse::Ok().json(TxResponse {
        success: true,
        message: "Goal closed".to_string(),
    }))
}

fn goal_to_response(g: Goal) -> GoalResponse {
    GoalResponse {
        public_key: g.goal_pda.clone(),
        account: GoalAccountResponse {
            profile: g.profile_pda,
            goal_id: g.goal_id.to_string(),
            title: g.title,
            description: g.description,
            target_amount: g.target_amount.to_string(),
            current_amount: g.current_amount.to_string(),
            token_mint: g.token_mint,
            deadline: g.deadline.map(|d| d.timestamp()),
            completed: g.completed,
            completed_at: g.completed_at.map(|d| d.timestamp()),
            unique_contributors: g.unique_contributors,
            created_at: g.created_at.timestamp(),
        },
    }
}
