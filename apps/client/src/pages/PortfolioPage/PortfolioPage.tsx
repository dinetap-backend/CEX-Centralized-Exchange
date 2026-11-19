import { useCallback, useEffect, useState } from 'react'
import './PortfolioPage.css'
import { getPortfolio, type PortfolioSummary } from '../../services/tradingService'

const formatMoney = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const formatQuantity = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 8 })

const emptyPortfolio: PortfolioSummary = {
  accountValue: 0,
  unrealizedPnl: 0,
  unrealizedPnlPercent: 0,
  volume: 0,
  pnl: 0,
  maxDrawdown: 0,
  totalEquity: 0,
  tradingEquity: 0,
  earnBalance: 0,
  wallets: [],
  trades: [],
}

const tabs = ['Balances', 'Positions', 'Open orders', 'TWAP', 'Chase', 'Trade history', 'Funding history', 'Order history', 'Interest', 'Deposits', 'Withdrawals']

function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('Positions')
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(emptyPortfolio)
  const [loading, setLoading] = useState(true)

  const fetchPortfolio = useCallback(async () => {
    try {
      setPortfolio(await getPortfolio())
    } catch {
      setPortfolio(emptyPortfolio)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPortfolio()
    const interval = window.setInterval(() => void fetchPortfolio(), 5000)
    window.addEventListener('portfolio-refresh', fetchPortfolio)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('portfolio-refresh', fetchPortfolio)
    }
  }, [fetchPortfolio])

  const accountMetrics = [
    { label: 'PNL', value: formatMoney(portfolio.pnl) },
    { label: 'Volume', value: formatMoney(portfolio.volume) },
    { label: 'Max drawdown', value: `${portfolio.maxDrawdown.toFixed(2)}%` },
    { label: 'Total equity', value: formatMoney(portfolio.totalEquity) },
    { label: 'Trading equity', value: formatMoney(portfolio.tradingEquity) },
    { label: 'Earn balance', value: formatMoney(portfolio.earnBalance) },
  ]

  return (
    <main className="portfolio-page">
      <section className="portfolio-toolbar" aria-label="Portfolio actions">
        <button type="button" className="toolbar-link">Link staking</button>
        <button type="button" className="toolbar-link">Swap stablecoins</button>
        <button type="button" className="toolbar-link">EVM ↔ Core</button>
        <button type="button" className="toolbar-link">Account type</button>
        <button type="button" className="toolbar-link">Send</button>
        <button type="button" className="toolbar-link">Withdraw</button>
        <button type="button" className="toolbar-link toolbar-primary">Deposit</button>
      </section>

      <section className="account-overview">
        <div className="overview-card volume-card">
          <div className="period-control">14 day volume</div>
          <strong>{formatMoney(portfolio.volume)}</strong>

          <div className="fee-summary">
            <span>Fees (taker / maker)</span>
            <strong>0.0450% / 0.0150%</strong>
          </div>
        </div>

        <div className="overview-card account-card">
          <div className="card-controls">
            <button type="button" className="period-control">Perps + Spot + Vaults</button>
            <div className="control-spacer" />
            <button type="button" className="period-control">30D</button>
          </div>

          <div className="account-grid">
            <div>
              {accountMetrics.map((metric) => (
                <div className="account-row" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <div className="performance-chart" aria-label="Account performance">
              <div className="chart-value">Account value</div>
              <div className="chart-axis"><span>3</span><span>2</span><span>1</span><span>0</span></div>
              <div className="chart-grid"><span /></div>
            </div>
          </div>
        </div>

        <div className="overview-card pnl-card">
          <div className="metric-row"><span>Account value</span><strong>{formatMoney(portfolio.accountValue)}</strong></div>
          <div className="metric-row"><span>Unrealized P&amp;L</span><strong>{formatMoney(portfolio.unrealizedPnl)}</strong></div>
          <div className="metric-row"><span>Unrealized P&amp;L %</span><strong>{portfolio.unrealizedPnlPercent.toFixed(2)}%</strong></div>
        </div>
      </section>

      <section className="portfolio-details">
        <div className="tab-bar" role="tablist" aria-label="Portfolio sections">
          {tabs.map((tab) => (
            <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
              className={activeTab === tab ? 'detail-tab active' : 'detail-tab'} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Balances' ? (
          <div className="live-list">
            {portfolio.wallets.length ? portfolio.wallets.map((wallet) => (
              <div className="live-row" key={wallet.id}><strong>{wallet.currency}</strong><span>{formatQuantity(wallet.balance)}</span><small>{new Date(wallet.updatedAt).toLocaleString()}</small></div>
            )) : <div className="empty-state compact-empty"><strong>No balances</strong><p>Deposits and trades will appear here.</p></div>}
          </div>
        ) : activeTab === 'Trade history' ? (
          <div className="live-list">
            {portfolio.trades.length ? portfolio.trades.map((trade) => (
              <div className="live-row trade-row" key={trade.id}><strong>{trade.symbol}</strong><span className={trade.side}>{trade.side.toUpperCase()}</span><span>{formatQuantity(trade.quantity)}</span><span>{formatMoney(trade.price)}</span><span>{formatMoney(trade.notional)}</span><small>{new Date(trade.createdAt).toLocaleString()}</small></div>
            )) : <div className="empty-state compact-empty"><strong>No trade history</strong><p>Completed trades will appear here.</p></div>}
          </div>
        ) : activeTab === 'Positions' ? (
          <div className="positions-table">
            <div className="positions-header"><span>Market</span><span>Size</span><span>Position value</span><span>Entry price</span><span>Mark price</span><span>P&amp;L</span><span>Liquidation</span><span>Margin</span><span>Funding</span></div>
            <div className="empty-state"><span className="empty-icon">—</span><strong>{loading ? 'Loading positions...' : 'No open positions'}</strong><p>Positions created on this account will appear here.</p></div>
          </div>
        ) : (
          <div className="empty-state compact-empty"><strong>No {activeTab.toLowerCase()}</strong><p>Activity for this section will appear here.</p></div>
        )}
      </section>
    </main>
  )
}

export default PortfolioPage
