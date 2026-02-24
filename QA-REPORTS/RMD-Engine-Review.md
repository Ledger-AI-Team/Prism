# Quality Control Report: RMD Engine
**Platform:** Farther Prism Financial Planning  
**Module:** Required Minimum Distributions (RMD) Engine  
**Code:** `src/calculation/rmd-engine.js`  
**Reviewed By:** Financial Expert (Quant + CFP® + CFA® credentials)  
**Date:** February 24, 2026  
**Status:** ⚠️ **REQUIRES REVISIONS**

---

## Executive Summary

The RMD engine demonstrates solid understanding of SECURE 2.0 rules and includes important features like QCDs and inherited IRA tracking. However, there are **critical errors** and **missing functionality** that must be addressed before production use.

**Overall Assessment:** 70% Complete  
**Production Ready:** ❌ NO - Requires fixes  
**Risk Level:** 🔴 HIGH (compliance + calculation errors)

---

## ✅ CORRECT IMPLEMENTATIONS

### 1. IRS Uniform Lifetime Table (2022+)
**Status:** ✅ **ACCURATE**

The table matches IRS Publication 590-B (2022 revision):
- Age 72: 27.4 (correct)
- Age 80: 20.2 (correct)
- Age 90: 12.2 (correct)
- Age 100: 6.4 (correct)
- Age 120: 2.0 (correct)

**Source:** IRS Pub 590-B, Appendix B, Table III (Uniform Lifetime)

---

### 2. SECURE 2.0 Age Rules
**Status:** ✅ **CORRECT**

```javascript
function getRMDStartAge(birthYear) {
  if (birthYear <= 1950) return 72;
  if (birthYear <= 1959) return 73;
  return 75;
}
```

**Validation:**
- Born 1950 or earlier → Age 72 ✅
- Born 1951-1959 → Age 73 ✅
- Born 1960+ → Age 75 ✅

**Source:** SECURE 2.0 Act (H.R. 2617, Section 107)

---

### 3. Basic RMD Formula
**Status:** ✅ **CORRECT**

```javascript
const rmdAmount = account.balance / lifeFactor;
```

**Formula:** RMD = Prior Year-End Balance ÷ Life Expectancy Factor  
**Source:** IRC §401(a)(9), IRS Pub 590-B

---

### 4. QCD Eligibility Rules
**Status:** ✅ **CORRECT**

- Age 70.5+ eligibility ✅
- $105,000 limit (2024) ✅ (inflation-adjusted from $100K)
- Satisfies RMD ✅
- Not taxable income ✅

**Source:** IRC §408(d)(8), adjusted by SECURE 2.0

---

### 5. Inherited IRA 10-Year Rule
**Status:** ✅ **LOGIC CORRECT**

10-year distribution window for non-spouse beneficiaries implemented correctly.

**Source:** SECURE Act (2019), IRC §401(a)(9)(H)

---

## ❌ CRITICAL ERRORS

### 1. **Missing: Age Calculation as of December 31**
**Severity:** 🔴 **HIGH**

**Current Implementation:**
```javascript
const age = calculateAge(person.birth_date, asOfDate);
```

**Problem:** RMDs must use age **as of December 31 of the RMD year**, not the calculation date.

**Example:**
- Client born March 15, 1951
- Turns 73 on March 15, 2024
- RMD calculated in January 2024 would show age 72 (WRONG)
- Should use age 73 (age on Dec 31, 2024)

**Fix:**
```javascript
function getAgeAsOfDecember31(birthDate, year) {
  const dec31 = new Date(year, 11, 31);
  return calculateAge(birthDate, dec31);
}
```

**IRS Citation:** "Your age for RMD purposes is your age on December 31 of the relevant year." - Pub 590-B, Chapter 1

---

### 2. **Missing: First-Year RMD Deadline (April 1 Rule)**
**Severity:** 🔴 **HIGH**

**Problem:** Code doesn't handle the special first-year deadline.

**IRS Rule:**
- Normal RMD deadline: **December 31**
- **First RMD only**: Can delay until **April 1 of following year**
- If delayed, must take **two RMDs** in second year (prior year's + current year's)

**Example:**
- Client turns 73 in 2024
- First RMD (for 2024): Due by April 1, 2025
- Second RMD (for 2025): Due by December 31, 2025
- Result: Two distributions in 2025

**Impact:** Tax planning opportunity missed. Many clients defer first RMD to spread income.

**Fix Needed:** Add `isFirstRMDYear` flag and `effectiveDeadline` field.

**IRS Citation:** IRC §401(a)(9)(C), Treas. Reg. §1.401(a)(9)-5

---

### 3. **Incorrect: Penalty Amount**
**Severity:** 🟡 **MEDIUM**

**Current Code:**
```javascript
// Comment says: "Penalty: 25% of shortfall"
```

**Problem:** While 25% is correct under SECURE 2.0, there's no actual calculation or tracking of the penalty.

**IRS Rule (2023+):**
- Penalty: 25% of shortfall (reduced from 50%)
- **Exception:** If corrected timely (within correction window), penalty reduced to **10%**

**Fix Needed:**
```javascript
penalty_base_rate: 0.25,
penalty_corrected_rate: 0.10,
correction_window_days: 366, // Tax year + extension
```

**IRS Citation:** SECURE 2.0 Section 302, IRC §4974

---

## ⚠️ COMPLIANCE CONCERNS

### 1. **Missing: Spouse Beneficiary Exception**
**Severity:** 🟡 **MEDIUM**

**Problem:** Code doesn't handle spouse beneficiary special rules.

**IRS Rule:** Surviving spouse can:
1. **Treat as own IRA** (most common - restart RMDs at their age 73)
2. **Remain beneficiary** (use deceased spouse's age, Table I)
3. **10-year rule doesn't apply** (grandfathered)

**Impact:** Major tax planning tool not available.

**IRS Citation:** IRC §401(a)(9)(B)(iv), Treas. Reg. §1.401(a)(9)-3

---

### 2. **Missing: Multiple Beneficiary Rules**
**Severity:** 🟡 **MEDIUM**

**Problem:** What if IRA has multiple beneficiaries?

**IRS Rule:**
- Use **oldest beneficiary's** age for RMD calculation
- Or: Split account by Sept 30 of year after death

**Impact:** Incorrect RMDs if account not split.

---

### 3. **Missing: Roth 401(k) RMD Rules**
**Severity:** 🟡 **MEDIUM**

**Problem:** Code treats all tax-deferred accounts the same.

**IRS Rule (changed in SECURE 2.0):**
- **Before 2024:** Roth 401(k) subject to RMDs (unlike Roth IRA)
- **After 2024:** Roth 401(k) RMDs eliminated
- **Recommendation:** Roll to Roth IRA to avoid RMDs

**Fix:** Add account type check:
```javascript
if (account.account_type === 'retirement_roth_401k' && year >= 2024) {
  // No RMD required (SECURE 2.0)
  continue;
}
```

**IRS Citation:** SECURE 2.0 Section 325

---

### 4. **Missing: Aggregation Rules Validation**
**Severity:** 🟠 **LOW-MEDIUM**

**Current Implementation:**
```javascript
// Comment: "IRAs can be aggregated, 401(k)s must be separate"
```

**Problem:** No validation that this actually happens correctly.

**IRS Rule:**
- Traditional IRAs: Aggregate, withdraw from any
- 403(b) accounts: Aggregate separately from IRAs
- 401(k) accounts: Must take from each 401(k)
- Inherited IRAs: Cannot aggregate with own IRAs

**Fix:** Add validation and error handling for incorrect aggregation.

---

## 💡 RECOMMENDATIONS

### 1. **Add: Still-Working Exception**
**Priority:** HIGH

**IRS Rule:** If still working at age 73+ and **don't own 5%+ of company**, can delay RMDs from **current employer's 401(k)** until retirement.

**Code Addition:**
```javascript
function isStillWorkingException(person, account, year) {
  return (
    person.employment_status === 'employed' &&
    account.is_current_employer_plan === true &&
    account.ownership_percentage < 5
  );
}
```

**Impact:** Common for executives and business owners.

---

### 2. **Add: RMD Shortfall Tracking**
**Priority:** HIGH

**Recommendation:** Track cumulative RMD history to detect shortfalls:
```javascript
{
  year: 2024,
  rmd_required: 50000,
  rmd_taken: 45000,
  shortfall: 5000,
  penalty_due: 1250, // 25%
  corrected: false
}
```

**Benefit:** Alert advisor before penalty assessed.

---

### 3. **Add: RMD Satisfied by Roth Conversion**
**Priority:** MEDIUM

**IRS Rule:** Roth conversions **do not** satisfy RMD.

**Code Check:** Ensure withdrawal sequencing takes RMD **before** conversion.

**Common Mistake:** Clients convert $50K, think RMD satisfied. IRS disagrees.

---

### 4. **Add: Qualified Longevity Annuity Contract (QLAC) Exclusion**
**Priority:** LOW

**IRS Rule:** Up to $200K (2024) in QLACs can be excluded from RMD balance.

**Impact:** Niche but growing (deferred income annuities).

---

### 5. **Add: Disaster Relief Waivers**
**Priority:** LOW

**IRS Rule:** During declared disasters, IRS may waive RMDs (e.g., COVID-19 in 2020).

**Recommendation:** Add `waiver_year` flag for historical accuracy.

---

## 🧪 RECOMMENDED TEST CASES

### Critical Scenarios to Test:

1. **First RMD Year**
   - Born Jan 1951, turns 73 in 2024
   - RMD due: April 1, 2025
   - Two RMDs in 2025

2. **Multiple Accounts**
   - 3 IRAs: $100K, $150K, $200K
   - 1 401(k): $300K
   - RMD: Aggregate IRAs ($450K / factor), separate 401(k)

3. **Inherited IRA**
   - Owner died 2022 (age 75)
   - 10-year rule: Must distribute by 2032
   - Suggested: $X per year to smooth taxes

4. **QCD Strategy**
   - Age 72, RMD = $40K
   - Charity goal: $20K
   - QCD: $20K to charity (satisfies $20K of RMD)
   - Remaining: $20K taxable withdrawal

5. **Still Working**
   - Age 75, still employed at ABC Corp
   - Owns 3% of company
   - Current 401(k): No RMD
   - Old employer 401(k): RMD required

6. **Roth 401(k)**
   - Year 2023: RMD required
   - Year 2024: No RMD (SECURE 2.0)
   - Recommendation: Roll to Roth IRA

---

## 📊 COMPARISON TO COMPETITORS

| Feature | **Prism (Current)** | **eMoney** | **RightCapital** | **Recommended** |
|---------|---------------------|------------|------------------|-----------------|
| Uniform Lifetime Table | ✅ Correct | ✅ | ✅ | ✅ |
| SECURE 2.0 Ages | ✅ Correct | ✅ | ✅ | ✅ |
| First RMD April 1 Rule | ❌ Missing | ✅ | ✅ | ✅ REQUIRED |
| Spouse Beneficiary | ❌ Missing | ✅ | ✅ | ✅ REQUIRED |
| Still-Working Exception | ❌ Missing | ✅ | ⚠️ Partial | ✅ REQUIRED |
| QCD Opportunities | ✅ Correct | ✅ | ✅ | ✅ |
| 10-Year Inherited Rule | ✅ Correct | ✅ | ✅ | ✅ |
| Penalty Tracking | ❌ Missing | ✅ | ✅ | ⚠️ Nice-to-have |
| Roth 401(k) SECURE 2.0 | ❌ Missing | ✅ | ✅ | ✅ REQUIRED |

**Gap Analysis:** Prism is missing **3 critical features** that both competitors have.

---

## 🎯 ACTION ITEMS

### Must Fix Before Production:
1. ❌ **Fix age calculation** (use Dec 31 age)
2. ❌ **Add first RMD deadline** (April 1 rule)
3. ❌ **Add spouse beneficiary rules**
4. ❌ **Add Roth 401(k) SECURE 2.0 exemption**
5. ❌ **Add still-working exception**

### Should Add (Competitive Parity):
6. ⚠️ **Add penalty calculation and tracking**
7. ⚠️ **Add multiple beneficiary logic**
8. ⚠️ **Add RMD shortfall alerts**

### Nice to Have (Advanced):
9. 💡 **Add QLAC exclusion**
10. 💡 **Add disaster waiver support**

---

## 📚 REGULATORY REFERENCES

1. **IRC §401(a)(9)** - RMD rules foundation
2. **IRS Publication 590-B** - Distributions from IRAs
3. **SECURE Act (2019)** - Original 10-year rule
4. **SECURE 2.0 Act (2022)** - Age changes, penalty reduction, Roth 401(k)
5. **Treasury Regulation §1.401(a)(9)-5** - RMD calculation methods
6. **IRS Notice 2022-53** - Inherited IRA guidance (proposed regs)

---

## ✍️ SIGN-OFF

**Reviewer:** Financial Expert (Quant + CFP® + CFA®)  
**Recommendation:** ⚠️ **DO NOT DEPLOY** until critical fixes implemented  
**Estimated Fix Time:** 8-12 hours  
**Re-Review Required:** YES (after fixes)

---

**Next Review:** Account Tracker + Cash Flow Engine
