/**
 * RMD (Required Minimum Distribution) Engine
 * 
 * Calculates mandatory withdrawals from tax-deferred accounts.
 * 
 * Rules (as of SECURE 2.0):
 * - RMDs start at age 73 (born 1951-1959) or 75 (born 1960+)
 * - Based on IRS Uniform Lifetime Table
 * - Calculate RMD = Account Balance / Life Expectancy Factor
 * - Penalty for not taking RMD: 25% of shortfall (reduced from 50% in 2023)
 * - Can aggregate IRAs but must take separately from 401(k)s
 * - Inherited IRAs: 10-year rule (must distribute within 10 years)
 */

/**
 * IRS Uniform Lifetime Table (2022 - current)
 * Maps age to distribution period (life expectancy factor)
 */
const UNIFORM_LIFETIME_TABLE = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9,
  78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7,
  84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
  90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5,  95: 8.9,
  96: 8.4,  97: 7.8,  98: 7.3,  99: 6.8,  100: 6.4, 101: 6.0,
  102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1,
  108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1,
  114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3,
  120: 2.0,
};

/**
 * Calculate RMD starting age based on birth year
 */
function getRMDStartAge(birthYear) {
  if (birthYear <= 1950) return 72; // Old rule
  if (birthYear <= 1959) return 73; // SECURE 2.0
  return 75; // Born 1960+
}

/**
 * Calculate RMDs for all eligible accounts
 * 
 * @param {Object} params
 * @param {Date} params.asOfDate - Typically December 31 of prior year
 * @param {Array} params.people - Household members
 * @param {Array} params.accounts - All accounts
 * @returns {Array} RMD requirements by account
 */
export function calculateRMDs({ asOfDate, people, accounts }) {
  const rmds = [];
  
  for (const person of people) {
    const age = calculateAge(person.birth_date, asOfDate);
    const birthYear = new Date(person.birth_date).getFullYear();
    const rmdStartAge = getRMDStartAge(birthYear);
    
    // Not yet subject to RMDs
    if (age < rmdStartAge) continue;
    
    // Get all tax-deferred accounts owned by this person
    const taxDeferredAccounts = accounts.filter(acc =>
      acc.owner_person_id === person.id &&
      (acc.tax_treatment === 'tax_deferred') &&
      (acc.account_type.includes('ira') || acc.account_type.includes('401k'))
    );
    
    // Calculate RMD for each account
    for (const account of taxDeferredAccounts) {
      const lifeFactor = UNIFORM_LIFETIME_TABLE[age];
      
      if (!lifeFactor) {
        console.warn(`[RMD] No life expectancy factor for age ${age}`);
        continue;
      }
      
      // RMD = Prior year-end balance / Life expectancy factor
      const rmdAmount = account.balance / lifeFactor;
      
      rmds.push({
        person_id: person.id,
        person_name: person.legal_name,
        age,
        account_id: account.id,
        account_name: account.account_name,
        account_type: account.account_type,
        prior_year_balance: account.balance,
        life_expectancy_factor: lifeFactor,
        rmd_amount: rmdAmount,
        is_inherited: account.is_inherited || false,
      });
    }
  }
  
  return rmds;
}

/**
 * Project RMDs over multiple years
 * 
 * @param {Object} params
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @param {Array} params.people
 * @param {Array} params.accountBalances - Output from account tracker
 * @returns {Array} Annual RMD schedules
 */
export function projectRMDs({ startDate, endDate, people, accountBalances }) {
  const results = [];
  const currentYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  for (let year = currentYear; year <= endYear; year++) {
    // Get account balances as of December 31 of prior year
    const priorYearEnd = new Date(year - 1, 11, 31); // Dec 31
    const priorYearBalances = accountBalances.find(
      snap => snap.date.getFullYear() === year - 1 && snap.date.getMonth() === 11
    );
    
    if (!priorYearBalances) continue;
    
    // Calculate RMDs for this year
    const rmds = calculateRMDs({
      asOfDate: priorYearEnd,
      people,
      accounts: priorYearBalances.accounts.map(acc => ({
        ...acc,
        balance: acc.balance, // Prior year-end balance
      })),
    });
    
    // Aggregate by person (IRAs can be aggregated)
    const aggregated = aggregateRMDsByPerson(rmds);
    
    results.push({
      year,
      rmd_year: year,
      calculation_date: priorYearEnd,
      rmds: aggregated,
      total_rmd: aggregated.reduce((sum, r) => sum + r.total_rmd, 0),
    });
  }
  
  return results;
}

/**
 * Aggregate RMDs by person (IRAs only, 401(k)s must be taken separately)
 */
function aggregateRMDsByPerson(rmds) {
  const byPerson = {};
  
  for (const rmd of rmds) {
    if (!byPerson[rmd.person_id]) {
      byPerson[rmd.person_id] = {
        person_id: rmd.person_id,
        person_name: rmd.person_name,
        age: rmd.age,
        ira_accounts: [],
        fourOhOneK_accounts: [],
        total_rmd: 0,
      };
    }
    
    const personRMD = byPerson[rmd.person_id];
    
    // IRAs can be aggregated
    if (rmd.account_type.includes('ira')) {
      personRMD.ira_accounts.push(rmd);
    } else if (rmd.account_type.includes('401k')) {
      personRMD.fourOhOneK_accounts.push(rmd);
    }
    
    personRMD.total_rmd += rmd.rmd_amount;
  }
  
  return Object.values(byPerson);
}

/**
 * QCD (Qualified Charitable Distribution) opportunity check
 * 
 * QCDs allow direct IRA → charity transfers (up to $105K in 2024) that:
 * - Satisfy RMD
 * - Are not taxable income
 * - Available at age 70.5+
 * 
 * @param {Object} rmd - RMD requirement
 * @param {Number} age - Current age
 * @param {Number} charityGoal - Annual charity target (if any)
 * @returns {Object} QCD recommendation
 */
export function calculateQCDOpportunity(rmd, age, charityGoal = 0) {
  // QCDs available at 70.5+
  if (age < 70.5) {
    return { eligible: false, reason: 'Under age 70.5' };
  }
  
  const qcdLimit2024 = 105000;
  const maxQCD = Math.min(rmd.rmd_amount, qcdLimit2024, charityGoal);
  
  if (maxQCD <= 0) {
    return { eligible: true, recommended_amount: 0, reason: 'No charity goal' };
  }
  
  // Tax savings (assume 24% marginal rate as conservative estimate)
  const taxSavings = maxQCD * 0.24;
  
  return {
    eligible: true,
    recommended_amount: maxQCD,
    rmd_satisfied: maxQCD,
    tax_savings: taxSavings,
    reason: 'QCD satisfies RMD and reduces AGI',
  };
}

/**
 * Inherited IRA 10-year rule check
 * 
 * SECURE Act requires non-spouse beneficiaries to distribute inherited
 * IRAs within 10 years of original owner's death.
 * 
 * @param {Object} account - Inherited IRA
 * @param {Date} ownerDeathDate - Date of original owner's death
 * @param {Date} currentDate - Current date
 * @returns {Object} Distribution requirements
 */
export function checkInheritedIRARule(account, ownerDeathDate, currentDate) {
  const yearsSinceDeath = 
    (currentDate - new Date(ownerDeathDate)) / (1000 * 60 * 60 * 24 * 365.25);
  
  const yearsRemaining = Math.max(0, 10 - yearsSinceDeath);
  
  if (yearsRemaining <= 0) {
    return {
      status: 'overdue',
      message: '10-year period expired - full distribution required immediately',
      penalty_risk: 'Penalty applies for missed distribution',
    };
  }
  
  if (yearsRemaining <= 2) {
    return {
      status: 'urgent',
      message: `${yearsRemaining.toFixed(1)} years remaining - plan distribution now`,
      suggested_annual_withdrawal: account.balance / yearsRemaining,
    };
  }
  
  return {
    status: 'compliant',
    years_remaining: yearsRemaining,
    suggested_annual_withdrawal: account.balance / yearsRemaining,
    message: 'On track - consider spreading distributions for tax efficiency',
  };
}

/**
 * Helper: Calculate age
 */
function calculateAge(birthDate, asOfDate) {
  const birth = new Date(birthDate);
  const diff = asOfDate - birth;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
