import numpy as np

def retirement_mc(portfolio, contribution, yrs_to_retire, yrs_in_retire,
                  withdrawal, inflation=0.03, exp_ret=0.07, vol=0.15, n=10000):
    total = yrs_to_retire + yrs_in_retire
    results = np.zeros((n, total + 1))
    results[:, 0] = portfolio
    for sim in range(n):
        for yr in range(1, total + 1):
            r = np.random.normal(exp_ret, vol)
            if yr <= yrs_to_retire:
                results[sim, yr] = results[sim, yr-1] * (1+r) + contribution
            else:
                adj_w = withdrawal * (1+inflation) ** (yr - yrs_to_retire)
                results[sim, yr] = max(0, results[sim, yr-1] * (1+r) - adj_w)
    final = results[:, -1]
    return {
        'success_rate': np.mean(final > 0),
        'median': np.median(final),
        'p10': np.percentile(final, 10), 'p25': np.percentile(final, 25),
        'p75': np.percentile(final, 75), 'p90': np.percentile(final, 90)
    }

def bond_price(face, coupon_rate, ytm, years, freq=2):
    n = int(years * freq)
    c = face * coupon_rate / freq
    r = ytm / freq
    pv_coupons = sum(c / (1+r)**t for t in range(1, n+1))
    pv_face = face / (1+r)**n
    return pv_coupons + pv_face

def modified_duration(face, coupon_rate, ytm, years, freq=2):
    n = int(years * freq)
    c = face * coupon_rate / freq
    r = ytm / freq
    price = bond_price(face, coupon_rate, ytm, years, freq)
    weighted = sum((t/freq) * c / (1+r)**t for t in range(1, n))
    weighted += (n/freq) * (c + face) / (1+r)**n
    mac_dur = weighted / price
    return mac_dur / (1 + r)

def future_value(pv, rate, years):
    return pv * (1 + rate) ** years

def present_value(fv, rate, years):
    return fv / (1 + rate) ** years

def annuity_pv(pmt, rate, years):
    return pmt * ((1 - (1 + rate) ** (-years)) / rate)

def annuity_fv(pmt, rate, years):
    return pmt * (((1 + rate) ** years - 1) / rate)

def real_return(nominal, inflation):
    return (1 + nominal) / (1 + inflation) - 1

def tax_equiv_yield(muni_yield, tax_rate):
    return muni_yield / (1 - tax_rate)
