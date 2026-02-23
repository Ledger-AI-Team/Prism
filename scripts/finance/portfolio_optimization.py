import numpy as np
from scipy.optimize import minimize

def optimize_portfolio(exp_returns, cov_matrix, rf_rate=0.045, method='max_sharpe'):
    n = len(exp_returns)
    bounds = tuple((0, 1) for _ in range(n))
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    x0 = np.array([1/n] * n)

    if method == 'max_sharpe':
        def obj(w):
            ret = np.dot(w, exp_returns) - rf_rate
            vol = np.sqrt(np.dot(w.T, np.dot(cov_matrix, w)))
            return -ret / vol
    elif method == 'min_variance':
        def obj(w):
            return np.dot(w.T, np.dot(cov_matrix, w))
    elif method == 'risk_parity':
        def obj(w):
            vol = np.sqrt(np.dot(w.T, np.dot(cov_matrix, w)))
            mc = np.dot(cov_matrix, w) / vol
            rc = w * mc
            return np.sum((rc - vol/n) ** 2)

    result = minimize(obj, x0, method='SLSQP', bounds=bounds, constraints=constraints)
    return result.x

def black_litterman(mkt_weights, cov, risk_aversion, P, Q, omega, tau=0.05):
    pi = risk_aversion * np.dot(cov, mkt_weights)
    tau_cov = tau * cov
    M1 = np.linalg.inv(np.linalg.inv(tau_cov) + P.T @ np.linalg.inv(omega) @ P)
    M2 = np.linalg.inv(tau_cov) @ pi + P.T @ np.linalg.inv(omega) @ Q
    return np.dot(M1, M2)
