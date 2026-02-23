---
name: backtesting-engine
description: >
  Backtest strategies with costs, walk-forward, bias detection.
metadata: {"openclaw":{"emoji":"⏪","requires":{"bins":["python3"]}}}
---
# Backtesting Engine
## When to Activate
- User wants to backtest any strategy
- User asks "how would X have performed"
## Instructions
1. Define strategy (momentum, risk parity, 60/40, custom)
2. Download data via yfinance
3. Backtest with 10bps costs
4. Full metrics (per SOUL.md standards)
5. Walk-forward: 252-day train, 63-day test
6. Compare S&P 500 and 60/40
7. Flag biases; append disclaimer
## Python Scripts
Use scripts in ~/.openclaw/workspace/scripts/finance/backtesting.py
