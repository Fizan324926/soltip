use anchor_lang::prelude::*;
use crate::instructions::initialize_platform::PlatformConfig;
use crate::constants::*;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds   = [PLATFORM_CONFIG_SEED],
        bump    = platform_config.bump,
        has_one = authority @ ErrorCode::NotAdmin,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: PDA verified by seeds – platform treasury holding SOL
    #[account(
        mut,
        seeds = [PLATFORM_TREASURY_SEED],
        bump,
    )]
    pub platform_treasury: UncheckedAccount<'info>,

    /// CHECK: destination wallet for withdrawn funds
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
    let treasury = &ctx.accounts.platform_treasury;
    let treasury_lamports = treasury.lamports();

    // Ensure we leave enough for rent exemption
    let rent = Rent::get()?;
    let min_balance = rent.minimum_balance(0);
    let available = treasury_lamports.saturating_sub(min_balance);

    require!(amount <= available, ErrorCode::InsufficientBalance);
    require!(amount > 0, ErrorCode::WithdrawalTooSmall);

    // Transfer lamports from treasury PDA to destination via direct lamport manipulation
    // (treasury is a PDA with no data, so we use direct manipulation)
    **ctx.accounts.platform_treasury.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.destination.to_account_info().try_borrow_mut_lamports()? += amount;

    msg!("Treasury withdrawal: {} lamports to {}", amount, ctx.accounts.destination.key());
    Ok(())
}
