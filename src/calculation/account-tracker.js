/**
 * Account Balance Tracker - Monthly Evolution
 * 
 * Tracks account balances over time:
 * - Contributions (from cash flow engine)
 * - Withdrawals (for expenses, goals, RMDs)
 * - Portfolio growth (returns + dividends)
 * - Tax withholding
 */

/**
 * Project account balances over time
 * 
 * @param {Object} params
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @param {Array} params.accounts - Initial account balances and settings
 * @param {Array} params.cashFlows - Output from cash flow engine
 * @param {Object} params.returnModel - Expected returns by asset class
 * @param {Array} params.withdrawals - Planned withdrawals (goals, expenses)
 * @returns {Array} Monthly account snapshots
 */
export function projectAccountBalances({
  startDate,
  endDate,
  accounts = [],
  cashFlows = [],
  returnModel = {},
  withdrawals = [],
}) {
  const results = [];
  const currentDate = new Date(startDate);
  
  // Initialize account tracking
  const accountStates = accounts.map(acc => ({
    ...acc,
    balance: acc.current_balance || 0,
    contributionsYTD: 0, // For IRS limits
    withdrawalsYTD: 0,
  }));
  
  let monthIndex = 0;
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const isYearEnd = month === 12;
    
    // Get cash flow for this month
    const cashFlow = cashFlows[monthIndex] || { available_for_savings: 0 };
    
    // 1. Apply portfolio returns (happens first, on beginning balance)
    for (const account of accountStates) {
      if (account.balance <= 0) continue;
      
      const monthlyReturn = getMonthlyReturn(account, returnModel, year, month);
      const growthAmount = account.balance * monthlyReturn;
      account.balance += growthAmount;
    }
    
    // 2. Process withdrawals (for expenses, goals, RMDs)
    const monthWithdrawals = withdrawals.filter(w => 
      w.year === year && w.month === month
    );
    
    for (const withdrawal of monthWithdrawals) {
      const account = accountStates.find(a => a.id === withdrawal.account_id);
      if (!account || account.balance < withdrawal.amount) {
        // TODO: Handle insufficient funds
        continue;
      }
      
      account.balance -= withdrawal.amount;
      account.withdrawalsYTD += withdrawal.amount;
      
      // Tax withholding (for traditional IRAs, 401ks)
      if (account.tax_treatment === 'tax_deferred' && withdrawal.tax_withholding_rate) {
        const withholdingAmount = withdrawal.amount * withdrawal.tax_withholding_rate;
        account.balance -= withholdingAmount;
      }
    }
    
    // 3. Apply contributions (from available savings)
    let remainingSavings = cashFlow.available_for_savings;
    
    // Prioritize by account type (401k match → Roth IRA → taxable)
    const contributionPriority = [
      'retirement_401k', // Get employer match first
      'retirement_roth_ira', // Tax-free growth
      'retirement_traditional_ira', // Tax-deferred
      'taxable', // Flexible access
    ];
    
    for (const accountType of contributionPriority) {
      for (const account of accountStates) {
        if (account.account_type !== accountType) continue;
        if (remainingSavings <= 0) break;
        
        // Get contribution limits
        const limits = getContributionLimits(account, year);
        const roomRemaining = limits.annual - account.contributionsYTD;
        
        if (roomRemaining <= 0) continue;
        
        // Calculate contribution amount
        const contribution = Math.min(
          remainingSavings,
          roomRemaining / 12, // Spread evenly over remaining months
          account.monthly_contribution_target || Infinity
        );
        
        if (contribution > 0) {
          account.balance += contribution;
          account.contributionsYTD += contribution;
          remainingSavings -= contribution;
          
          // Employer match (for 401k)
          if (account.employer_match_rate && accountType === 'retirement_401k') {
            const matchAmount = contribution * account.employer_match_rate;
            account.balance += matchAmount;
          }
        }
      }
    }
    
    // 4. Reset YTD counters at year-end
    if (isYearEnd) {
      for (const account of accountStates) {
        account.contributionsYTD = 0;
        account.withdrawalsYTD = 0;
      }
    }
    
    // 5. Record snapshot
    results.push({
      date: new Date(currentDate),
      year,
      month,
      accounts: accountStates.map(acc => ({
        id: acc.id,
        account_type: acc.account_type,
        tax_treatment: acc.tax_treatment,
        balance: acc.balance,
        contributions_ytd: acc.contributionsYTD,
        withdrawals_ytd: acc.withdrawalsYTD,
      })),
      total_balance: accountStates.reduce((sum, acc) => sum + acc.balance, 0),
      taxable_balance: accountStates
        .filter(a => a.tax_treatment === 'taxable')
        .reduce((sum, acc) => sum + acc.balance, 0),
      tax_deferred_balance: accountStates
        .filter(a => a.tax_treatment === 'tax_deferred')
        .reduce((sum, acc) => sum + acc.balance, 0),
      tax_free_balance: accountStates
        .filter(a => a.tax_treatment === 'tax_free')
        .reduce((sum, acc) => sum + acc.balance, 0),
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    monthIndex++;
  }
  
  return results;
}

/**
 * Get monthly return for an account
 * 
 * @param {Object} account
 * @param {Object} returnModel - Expected returns by asset class
 * @param {Number} year
 * @param {Number} month
 * @returns {Number} Monthly return (e.g., 0.0067 for ~8% annualized)
 */
function getMonthlyReturn(account, returnModel, year, month) {
  // Get allocation (default to 60/40 if not specified)
  const allocation = account.allocation || {
    stocks: 0.60,
    bonds: 0.30,
    cash: 0.10,
  };
  
  // Get expected returns
  const stockReturn = (returnModel.stocks || 0.08) / 12;
  const bondReturn = (returnModel.bonds || 0.04) / 12;
  const cashReturn = (returnModel.cash || 0.02) / 12;
  
  // Weighted average
  const monthlyReturn = 
    allocation.stocks * stockReturn +
    allocation.bonds * bondReturn +
    (allocation.cash || 0) * cashReturn;
  
  // TODO: Add stochastic variation for Monte Carlo
  // For deterministic run, use expected returns
  
  return monthlyReturn;
}

/**
 * Get contribution limits for account type and year
 */
function getContributionLimits(account, year) {
  // IRS limits (2024 baseline, adjust for year)
  const limits2024 = {
    retirement_401k: 23000,
    retirement_401k_catchup: 7500, // Age 50+
    retirement_traditional_ira: 7000,
    retirement_roth_ira: 7000,
    retirement_ira_catchup: 1000, // Age 50+
    retirement_sep_ira: 69000, // 25% of compensation
    retirement_simple_ira: 16000,
    hsa: 4150, // Individual
    hsa_family: 8300,
    hsa_catchup: 1000, // Age 55+
  };
  
  // Adjust for inflation (assume $500 increments every 2 years)
  const yearsSince2024 = year - 2024;
  const inflationAdjustment = Math.floor(yearsSince2024 / 2) * 500;
  
  const baseLimit = limits2024[account.account_type] || Infinity;
  const catchupLimit = account.is_over_50 
    ? (limits2024[`${account.account_type}_catchup`] || 0)
    : 0;
  
  return {
    annual: baseLimit + inflationAdjustment + catchupLimit,
    monthly: (baseLimit + inflationAdjustment + catchupLimit) / 12,
  };
}

/**
 * Calculate withdrawal sequencing for a given month
 * 
 * Strategy: Taxable → Traditional IRA → Roth (preserve Roth for legacy)
 * 
 * @param {Number} neededAmount - Amount to withdraw
 * @param {Array} accounts - Current account states
 * @param {Number} age - Current age (for penalty logic)
 * @returns {Array} Withdrawal plan by account
 */
export function calculateWithdrawalSequence(neededAmount, accounts, age) {
  const withdrawals = [];
  let remaining = neededAmount;
  
  // Priority order (taxable first, Roth last)
  const priority = [
    { type: 'taxable', treatment: 'taxable' },
    { type: 'retirement_traditional_ira', treatment: 'tax_deferred' },
    { type: 'retirement_401k', treatment: 'tax_deferred' },
    { type: 'retirement_roth_ira', treatment: 'tax_free' },
  ];
  
  for (const { type, treatment } of priority) {
    if (remaining <= 0) break;
    
    for (const account of accounts) {
      if (account.account_type !== type) continue;
      if (account.balance <= 0) continue;
      
      // Check early withdrawal penalty (if under 59.5)
      const hasPenalty = age < 59.5 && treatment !== 'taxable';
      
      const withdrawAmount = Math.min(remaining, account.balance);
      
      withdrawals.push({
        account_id: account.id,
        account_type: account.account_type,
        amount: withdrawAmount,
        has_early_withdrawal_penalty: hasPenalty,
        penalty_amount: hasPenalty ? withdrawAmount * 0.10 : 0,
        is_taxable: treatment === 'tax_deferred',
      });
      
      remaining -= withdrawAmount;
      
      if (remaining <= 0) break;
    }
  }
  
  return {
    withdrawals,
    total_withdrawn: neededAmount - remaining,
    shortfall: remaining,
  };
}
