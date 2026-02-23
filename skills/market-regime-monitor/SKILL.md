---
name: market-regime-monitor
description: >
  Economic regime detection using GDP, CPI, yield curve, PMI. Allocation bias.
metadata: {"openclaw":{"emoji":"🌡️","requires":{"bins":["python3"]}}}
---
# Market Regime Monitor
## When to Activate
- User asks about market/economic conditions or regime
- User wants macro-based allocation recommendations
## Instructions
1. Fetch macro data (FRED, web, yfinance ^TNX ^FVX)
2. Classify: GDP vs 2%, CPI vs 3%
3. Map regime to asset biases (SOUL.md table)
4. Flag upcoming releases (FOMC, CPI, NFP, ISM)
