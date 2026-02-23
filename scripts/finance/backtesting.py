import numpy as np
import pandas as pd

class PortfolioBacktester:
    def __init__(self, prices_df, risk_free_rate=0.045):
        self.prices = prices_df
        self.returns = prices_df.pct_change().dropna()
        self.rf = risk_free_rate / 252

    def run_backtest(self, strategy_func, rebalance_freq='M',
                     cost=0.001, capital=1000000):
        values = [capital]
        weights = None
        reb_dates = self.returns.resample(rebalance_freq).last().index

        for date in self.returns.index:
            if date in reb_dates or weights is None:
                new_w = strategy_func(self.returns.loc[:date], date)
                if weights is not None:
                    turnover = np.sum(np.abs(new_w - weights))
                    values[-1] -= turnover * cost * values[-1]
                weights = new_w
            daily_ret = np.dot(weights, self.returns.loc[date].values)
            values.append(values[-1] * (1 + daily_ret))
            drift = weights * (1 + self.returns.loc[date].values)
            weights = drift / drift.sum()

        return pd.Series(values[1:], index=self.returns.index)

    def metrics(self, series):
        ret = series.pct_change().dropna()
        total = series.iloc[-1] / series.iloc[0] - 1
        years = len(ret) / 252
        cagr = (1 + total) ** (1/years) - 1
        vol = ret.std() * np.sqrt(252)
        sharpe = (ret.mean() - self.rf) / ret.std() * np.sqrt(252)
        down = ret[ret < 0]
        sortino = (ret.mean() - self.rf) / down.std() * np.sqrt(252)
        cum = (1 + ret).cumprod()
        dd = (cum / cum.expanding().max() - 1).min()
        var95 = -np.percentile(ret, 5)
        tail = ret[ret <= -var95]
        cvar95 = -tail.mean() if len(tail) > 0 else var95
        return {
            'CAGR': f'{cagr:.2%}', 'Vol': f'{vol:.2%}',
            'Sharpe': f'{sharpe:.2f}', 'Sortino': f'{sortino:.2f}',
            'Max DD': f'{dd:.2%}', 'VaR 95%': f'{var95:.2%}',
            'CVaR 95%': f'{cvar95:.2%}', 'Win Rate': f'{(ret>0).mean():.2%}'
        }

    def walk_forward(self, strategy_func, train=252, test=63):
        results = []
        total = len(self.returns)
        for i in range((total - train) // test):
            t_end = i * test + train
            test_end = min(t_end + test, total)
            if test_end > total: break
            train_data = self.returns.iloc[i*test:t_end]
            test_data = self.returns.iloc[t_end:test_end]
            w = strategy_func(train_data, train_data.index[-1])
            tr = test_data.dot(w)
            results.append({
                'return': tr.sum(),
                'sharpe': tr.mean()/tr.std()*np.sqrt(252) if tr.std()>0 else 0
            })
        return pd.DataFrame(results)
