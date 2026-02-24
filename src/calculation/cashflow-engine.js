/**
 * Cash Flow Engine - Monthly Projections
 * 
 * Calculates monthly income, expenses, savings, and emergency fund.
 * Institutional-grade: monthly time-stepping, inflation-adjusted.
 */

/**
 * Project monthly cash flows for a household
 * 
 * @param {Object} params
 * @param {Date} params.startDate - Start of projection
 * @param {Date} params.endDate - End of projection
 * @param {Array} params.incomeStreams - Array of income sources
 * @param {Array} params.expenseStreams - Array of expense categories
 * @param {Array} params.people - Household members (for Social Security, pensions)
 * @param {Number} params.emergencyFundMonths - Target months of expenses
 * @param {Number} params.currentEmergencyFund - Current emergency fund balance
 * @returns {Array} Monthly cash flow records
 */
export function projectCashFlows({
  startDate,
  endDate,
  incomeStreams = [],
  expenseStreams = [],
  people = [],
  emergencyFundMonths = 6,
  currentEmergencyFund = 0,
}) {
  const results = [];
  const currentDate = new Date(startDate);
  
  let emergencyFund = currentEmergencyFund;
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const yearsSinceStart = (currentDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Calculate income for this month
    const income = calculateMonthlyIncome({
      incomeStreams,
      people,
      currentDate,
      yearsSinceStart,
    });
    
    // Calculate expenses for this month
    const expenses = calculateMonthlyExpenses({
      expenseStreams,
      currentDate,
      yearsSinceStart,
    });
    
    // Net cash flow (before emergency fund allocation)
    const netCashFlow = income.total - expenses.total;
    
    // Emergency fund logic
    const emergencyFundTarget = expenses.essential * emergencyFundMonths;
    const emergencyFundShortfall = Math.max(0, emergencyFundTarget - emergencyFund);
    const emergencyFundContribution = Math.min(
      Math.max(0, netCashFlow * 0.1), // Allocate 10% of surplus to e-fund
      emergencyFundShortfall
    );
    
    emergencyFund += emergencyFundContribution;
    
    // Available for savings/investment after emergency fund
    const availableForSavings = netCashFlow - emergencyFundContribution;
    
    results.push({
      date: new Date(currentDate),
      year,
      month,
      age_primary: people[0] ? calculateAge(people[0].birth_date, currentDate) : null,
      
      // Income breakdown
      income: {
        employment: income.employment,
        business: income.business,
        rental: income.rental,
        social_security: income.socialSecurity,
        pension: income.pension,
        other: income.other,
        total: income.total,
      },
      
      // Expense breakdown
      expenses: {
        essential: expenses.essential,
        discretionary: expenses.discretionary,
        debt_service: expenses.debtService,
        total: expenses.total,
      },
      
      // Net flows
      net_cash_flow: netCashFlow,
      emergency_fund_contribution: emergencyFundContribution,
      emergency_fund_balance: emergencyFund,
      emergency_fund_target: emergencyFundTarget,
      available_for_savings: availableForSavings,
      
      // Flags
      emergency_fund_funded: emergencyFund >= emergencyFundTarget,
    });
    
    // Advance to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return results;
}

/**
 * Calculate monthly income from all sources
 */
function calculateMonthlyIncome({ incomeStreams, people, currentDate, yearsSinceStart }) {
  let employment = 0;
  let business = 0;
  let rental = 0;
  let socialSecurity = 0;
  let pension = 0;
  let other = 0;
  
  for (const stream of incomeStreams) {
    // Check if stream is active this month
    if (currentDate < new Date(stream.start_date) || 
        (stream.end_date && currentDate > new Date(stream.end_date))) {
      continue;
    }
    
    // Calculate inflation-adjusted amount
    const inflationFactor = Math.pow(1 + (stream.inflation_rate || 0), yearsSinceStart);
    const baseAmount = stream.annual_amount / 12; // Convert to monthly
    const adjustedAmount = baseAmount * inflationFactor;
    
    // Categorize by type
    switch (stream.income_type) {
      case 'employment':
      case 'w2':
      case 'salary':
        employment += adjustedAmount;
        break;
      case 'business':
      case 'self_employment':
      case '1099':
        business += adjustedAmount;
        break;
      case 'rental':
      case 'real_estate':
        rental += adjustedAmount;
        break;
      case 'social_security':
        socialSecurity += adjustedAmount;
        break;
      case 'pension':
      case 'annuity':
        pension += adjustedAmount;
        break;
      default:
        other += adjustedAmount;
    }
  }
  
  return {
    employment,
    business,
    rental,
    socialSecurity,
    pension,
    other,
    total: employment + business + rental + socialSecurity + pension + other,
  };
}

/**
 * Calculate monthly expenses
 */
function calculateMonthlyExpenses({ expenseStreams, currentDate, yearsSinceStart }) {
  let essential = 0;
  let discretionary = 0;
  let debtService = 0;
  
  for (const stream of expenseStreams) {
    // Check if stream is active this month
    if (currentDate < new Date(stream.start_date) || 
        (stream.end_date && currentDate > new Date(stream.end_date))) {
      continue;
    }
    
    // Calculate inflation-adjusted amount
    const inflationFactor = Math.pow(1 + (stream.inflation_rate || 0), yearsSinceStart);
    const baseAmount = stream.annual_amount / 12; // Convert to monthly
    const adjustedAmount = baseAmount * inflationFactor;
    
    // Categorize
    if (stream.expense_type === 'debt_payment') {
      debtService += adjustedAmount;
    } else if (stream.is_discretionary) {
      discretionary += adjustedAmount;
    } else {
      essential += adjustedAmount;
    }
  }
  
  return {
    essential,
    discretionary,
    debtService,
    total: essential + discretionary + debtService,
  };
}

/**
 * Calculate age at a given date
 */
function calculateAge(birthDate, asOfDate) {
  const birth = new Date(birthDate);
  const diff = asOfDate - birth;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * Debt payoff schedule (separate from regular expenses)
 * 
 * @param {Object} params
 * @param {Array} params.liabilities - Array of debts
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @returns {Array} Monthly debt service schedule
 */
export function projectDebtPayoff({ liabilities = [], startDate, endDate }) {
  const results = [];
  const currentDate = new Date(startDate);
  
  // Clone liabilities to track remaining balances
  const debts = liabilities.map(l => ({
    ...l,
    remainingBalance: l.current_balance,
  }));
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    let totalPayment = 0;
    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalRemainingBalance = 0;
    
    for (const debt of debts) {
      if (debt.remainingBalance <= 0) continue;
      
      // Monthly interest rate
      const monthlyRate = debt.interest_rate / 12;
      
      // Interest for this month
      const interestPayment = debt.remainingBalance * monthlyRate;
      
      // Principal payment
      const principalPayment = Math.min(
        debt.monthly_payment - interestPayment,
        debt.remainingBalance
      );
      
      // Update balance
      debt.remainingBalance -= principalPayment;
      
      totalPayment += debt.monthly_payment;
      totalPrincipal += principalPayment;
      totalInterest += interestPayment;
      totalRemainingBalance += Math.max(0, debt.remainingBalance);
    }
    
    results.push({
      date: new Date(currentDate),
      year,
      month,
      total_payment: totalPayment,
      principal: totalPrincipal,
      interest: totalInterest,
      remaining_balance: totalRemainingBalance,
      debts_paid_off: debts.filter(d => d.remainingBalance <= 0).length,
      total_debts: debts.length,
    });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return results;
}
