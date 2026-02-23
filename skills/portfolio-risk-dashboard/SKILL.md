---
name: portfolio-risk-dashboard
description: >
  Real-time portfolio risk: VaR, CVaR, Sharpe, drawdowns, correlations, stress tests.
metadata: {"openclaw":{"emoji":"📊","requires":{"bins":["python3"]}}}
---
# Portfolio Risk Dashboard
## When to Activate
- User asks about portfolio risk, VaR, drawdowns, or risk metrics
- User requests stress testing or scenario analysis
## Instructions
1. Get holdings (memory, user input, or file)
2. Download prices: pip3 install yfinance numpy pandas scipy
3. Calculate: VaR 95%/99%, CVaR, Sharpe, Sortino, Max DD, Beta, Correlations
4. Stress test: COVID, GFC, 2022 Rate Shock
5. Present in tables with benchmark comparison
6. Include risk disclaimer
## Python Scripts
Use scripts in ~/.openclaw/workspace/scripts/finance/risk_models.py
