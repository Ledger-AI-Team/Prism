import numpy as np

def stress_test(weights, returns_data, scenarios):
    results = {}
    for name, params in scenarios.items():
        if 'start' in params:
            period = returns_data.loc[params['start']:params['end']]
            cum = (1 + period).prod() - 1
            port_ret = np.dot(weights, cum.values)
        else:
            shocks = np.array([params.get(c, 0) for c in returns_data.columns])
            port_ret = np.dot(weights, shocks)
        results[name] = round(port_ret, 4)
    return results

# Predefined scenario shocks
HYPOTHETICAL_SCENARIOS = {
    'Stagflation': {'equities': -0.20, 'bonds': -0.05, 'commodities': 0.15, 'gold': 0.25},
    'Rate Shock (+200bps)': {'equities': -0.15, 'bonds': -0.10, 'commodities': 0.05, 'gold': -0.03},
    'Deflationary Bust': {'equities': -0.30, 'bonds': 0.15, 'commodities': -0.20, 'gold': 0.10},
    'Dollar Crisis': {'equities': -0.10, 'bonds': -0.05, 'commodities': 0.20, 'gold': 0.30},
}

HISTORICAL_SCENARIOS = {
    'COVID Crash': {'start': '2020-02-19', 'end': '2020-03-23'},
    'GFC': {'start': '2008-09-15', 'end': '2009-03-09'},
    'Dot-Com Bust': {'start': '2000-03-10', 'end': '2002-10-09'},
    '2022 Rate Shock': {'start': '2022-01-03', 'end': '2022-10-12'},
}
