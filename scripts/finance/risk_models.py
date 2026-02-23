import numpy as np
from scipy import stats

def calculate_var(returns, confidence=0.95, method='historical'):
    if method == 'historical':
        return -np.percentile(returns, (1 - confidence) * 100)
    elif method == 'parametric':
        mu, sigma = returns.mean(), returns.std()
        return -(mu + stats.norm.ppf(1 - confidence) * sigma)
    elif method == 'monte_carlo':
        sims = np.random.normal(returns.mean(), returns.std(), 100000)
        return -np.percentile(sims, (1 - confidence) * 100)

def calculate_cvar(returns, confidence=0.95):
    var_threshold = np.percentile(returns, (1 - confidence) * 100)
    return -returns[returns <= var_threshold].mean()

def monte_carlo_portfolio(weights, returns_data, n_sims=10000,
                          horizon_days=252, confidence=0.95):
    mean_ret = returns_data.mean().values
    cov = returns_data.cov().values
    results = np.zeros(n_sims)
    for i in range(n_sims):
        rand_ret = np.random.multivariate_normal(
            mean_ret * horizon_days, cov * horizon_days)
        results[i] = np.dot(weights, rand_ret)
    var = -np.percentile(results, (1 - confidence) * 100)
    tail = results[results <= -var]
    cvar = -tail.mean() if len(tail) > 0 else var
    return {
        'expected_return': np.mean(results),
        'volatility': np.std(results),
        'var_95': var, 'cvar_95': cvar,
        'prob_loss': np.mean(results < 0),
        'sharpe': np.mean(results) / np.std(results) if np.std(results) > 0 else 0
    }
