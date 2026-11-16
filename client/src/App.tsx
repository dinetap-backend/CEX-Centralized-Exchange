import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'
import { getCurrentUser, loginUser, registerUser, type AuthUser } from './services/authService'
import {
  createWallet,
  depositWallet,
  getWalletDetail,
  getWallets,
  type Wallet,
  type WalletDetail,
  withdrawWallet,
} from './services/walletService'

const skills = [
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'PostgreSQL',
  'REST APIs',
  'Risk Controls',
  'Wallet UX',
]

const projects = [
  {
    title: 'Spot Trading Dashboard',
    description: 'A centralized exchange interface for live order books, balance tracking, and fast trade execution workflows.',
    stack: ['React', 'TypeScript', 'Trading UI'],
  },
  {
    title: 'Wallet & Settlement Engine',
    description: 'A secure internal system for balances, custody flows, and settlement events across user accounts.',
    stack: ['Node.js', 'Express', 'PostgreSQL'],
  },
  {
    title: 'CEX Portfolio Showcase',
    description: 'A polished product landing page for a centralized exchange, designed to present trust, liquidity, and usability.',
    stack: ['Vite', 'React', 'Brand Design'],
  },
]

function App() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')
  const [view, setView] = useState<'home' | 'auth' | 'wallet'>('home')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [walletDetails, setWalletDetails] = useState<WalletDetail[]>([])
  const [walletForm, setWalletForm] = useState({ currency: 'USDT', amount: '100' })
  const [walletError, setWalletError] = useState('')
  const [walletStatus, setWalletStatus] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('portfolio-token')

    if (!token) {
      setCurrentUser(null)
      setWallets([])
      return
    }

    getCurrentUser(token)
      .then((data) => setCurrentUser(data.user))
      .catch(() => {
        localStorage.removeItem('portfolio-token')
        setCurrentUser(null)
      })
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setWallets([])
      setWalletDetails([])
      return
    }

    const token = localStorage.getItem('portfolio-token')

    if (!token) {
      return
    }

    getWallets(token)
      .then(async (walletList) => {
        setWallets(walletList)

        if (walletList.length === 0) {
          setWalletDetails([])
          return
        }

        const details = await Promise.all(
          walletList.map(async (wallet) => {
            try {
              return await getWalletDetail(token, wallet.currency)
            } catch {
              return null
            }
          }),
        )

        setWalletDetails(details.filter((wallet): wallet is WalletDetail => wallet !== null))
      })
      .catch(() => {
        setWallets([])
        setWalletDetails([])
      })
  }, [currentUser, view])

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleAuthFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setAuthForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleWalletFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setWalletForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleWalletAction = async (action: 'create' | 'deposit' | 'withdraw') => {
    if (!currentUser) {
      return
    }

    const token = localStorage.getItem('portfolio-token')

    if (!token) {
      setWalletError('Authentication required.')
      return
    }

    try {
      setWalletError('')
      setWalletStatus('Processing wallet request...')

      const currency = walletForm.currency.trim() || 'USDT'
      const amount = Number(walletForm.amount)

      if (action === 'create') {
        const wallet = await createWallet(token, currency)
        setWallets((previous) => {
          const existing = previous.find((item) => item.currency === wallet.currency)
          if (existing) {
            return previous.map((item) => (item.currency === wallet.currency ? wallet : item))
          }
          return [...previous, wallet]
        })
        setWalletStatus(`${wallet.currency} wallet created.`)
        return
      }

      if (action === 'deposit') {
        const wallet = await depositWallet(token, currency, amount)
        setWallets((previous) =>
          previous.map((item) => (item.currency === wallet.currency ? wallet : item)),
        )
        setWalletStatus(`${wallet.currency} deposit successful.`)
        return
      }

      const wallet = await withdrawWallet(token, currency, amount)
      setWallets((previous) =>
        previous.map((item) => (item.currency === wallet.currency ? wallet : item)),
      )
      setWalletStatus(`${wallet.currency} withdrawal successful.`)
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Wallet request failed.')
      setWalletStatus('')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('Sending message...')

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setStatus('Message sent successfully.')
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to send message.')
    }
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')

    try {
      const response =
        authMode === 'login'
          ? await loginUser({
              email: authForm.email,
              password: authForm.password,
            })
          : await registerUser({
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
            })

      localStorage.setItem('portfolio-token', response.token)
      setCurrentUser(response.user)
      setAuthForm({ name: '', email: '', password: '' })
      setView('home')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('portfolio-token')
    setCurrentUser(null)
    setWallets([])
    setWalletDetails([])
    setWalletError('')
    setWalletStatus('')
  }

  if (view === 'wallet') {
    return (
      <div className="portfolio-shell wallet-page-shell">
        <header className="topbar wallet-topbar">
          <div className="brand">CEX Exchange</div>
          <nav>
            <button type="button" className="nav-button" onClick={() => setView('home')}>
              Home
            </button>
            <button type="button" className="nav-button" onClick={() => setView('auth')}>
              {currentUser ? 'Dashboard' : 'Login'}
            </button>
          </nav>
        </header>

        <main className="wallet-page">
          <section className="wallet-header-panel">
            <div>
              <p className="eyebrow">Portfolio</p>
              <h1>Wallet overview</h1>
            </div>
            {currentUser ? (
              <button type="button" className="primary-btn" onClick={handleLogout}>Logout</button>
            ) : null}
          </section>

          {!currentUser ? (
            <div className="admin-box">
              <p>Please sign in to view your wallet and transaction history.</p>
              <button type="button" className="primary-btn" onClick={() => setView('auth')}>
                Open authentication page
              </button>
            </div>
          ) : (
            <>
              <section className="wallet-summary-grid">
                {walletDetails.length > 0 ? (
                  walletDetails.map(({ wallet }) => (
                    <article key={wallet.id} className="wallet-summary-card">
                      <span>{wallet.currency}</span>
                      <strong>{wallet.balance.toFixed(2)}</strong>
                      <small>Last updated {new Date(wallet.updatedAt).toLocaleString()}</small>
                    </article>
                  ))
                ) : (
                  <article className="wallet-summary-card empty-wallet-card">
                    <span>No wallet data</span>
                    <strong>Create a wallet</strong>
                  </article>
                )}
              </section>

              <section className="wallet-operations-panel">
                <div className="wallet-form-row">
                  <label>
                    Currency
                    <input
                      type="text"
                      name="currency"
                      value={walletForm.currency}
                      onChange={handleWalletFieldChange}
                      placeholder="USDT"
                    />
                  </label>

                  <label>
                    Amount
                    <input
                      type="number"
                      name="amount"
                      min="0"
                      step="0.01"
                      value={walletForm.amount}
                      onChange={handleWalletFieldChange}
                      placeholder="100"
                    />
                  </label>
                </div>

                <div className="wallet-actions">
                  <button type="button" className="primary-btn" onClick={() => void handleWalletAction('create')}>
                    Create Wallet
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => void handleWalletAction('deposit')}>
                    Deposit
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => void handleWalletAction('withdraw')}>
                    Withdraw
                  </button>
                </div>

                {walletStatus ? <p className="status-text">{walletStatus}</p> : null}
                {walletError ? <p className="error-text">{walletError}</p> : null}
              </section>

              <section className="wallet-table-panel">
                <div className="section-heading compact-heading">
                  <p className="eyebrow">Transactions</p>
                  <h2>Activity history</h2>
                </div>

                {walletDetails.length === 0 ? (
                  <p className="muted-text">No transactions available yet.</p>
                ) : (
                  <div className="wallet-table-wrap">
                    <table className="wallet-table">
                      <thead>
                        <tr>
                          <th>Currency</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Balance after</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletDetails
                          .flatMap(({ wallet, transactions }) =>
                            transactions.map((transaction) => ({
                              ...transaction,
                              walletCurrency: wallet.currency,
                            })),
                          )
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((transaction) => (
                            <tr key={transaction.id}>
                              <td>{transaction.walletCurrency}</td>
                              <td className={transaction.type === 'deposit' ? 'success-text' : 'warning-text'}>
                                {transaction.type}
                              </td>
                              <td>{transaction.amount.toFixed(2)}</td>
                              <td>{transaction.balanceAfter.toFixed(2)}</td>
                              <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    )
  }

  if (view === 'auth') {
    return (
      <div className="auth-page-shell">
        <div className="auth-card">
          <div className="auth-brand-row">
            <div className="brand">CEX Exchange</div>
            <button type="button" className="link-button" onClick={() => setView('home')}>
              Back home
            </button>
          </div>

          <div className="auth-header">
            <p className="eyebrow">Secure access</p>
            <h1>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h1>
            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Sign in to manage your exchange workspace.'
                : 'Register to access your trading and account tools.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' ? (
              <label>
                Full name
                <input
                  type="text"
                  name="name"
                  value={authForm.name}
                  onChange={handleAuthFieldChange}
                  placeholder="Enter your full name"
                  required
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthFieldChange}
                placeholder="name@exchange.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthFieldChange}
                placeholder="Enter your password"
                required
              />
            </label>

            {authError ? <p className="error-text">{authError}</p> : null}

            <button type="submit" className="primary-btn auth-submit">
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>

            <button
              type="button"
              className="toggle-link"
              onClick={() => {
                setAuthMode((previous) => (previous === 'login' ? 'register' : 'login'))
                setAuthError('')
              }}
            >
              {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="portfolio-shell">
      <header className="topbar">
        <div className="brand">CEX Exchange</div>
        <nav>
          <a href="#about">Overview</a>
          <a href="#projects">Products</a>
          <a href="#skills">Platform</a>
          <a href="#contact">Contact</a>
          <button type="button" className="nav-button" onClick={() => setView('auth')}>
            {currentUser ? 'Dashboard' : 'Login'}
          </button>
          <button type="button" className="nav-button" onClick={() => setView('wallet')}>
            Wallets
          </button>
        </nav>
      </header>

      <main>
        <section className="hero section">
          <div className="hero-copy">
            <p className="eyebrow">Centralized exchange platform</p>
            <h1>Trade faster with a clean, secure exchange experience.</h1>
            <p className="lead">
              CEX Exchange is designed for seamless order flow, trusted wallet handling, and a reliable trading experience built for modern crypto users.
            </p>
            <div className="cta-row">
              <a className="primary-btn" href="#projects">Explore Features</a>
              <button type="button" className="ghost-btn" onClick={() => setView('auth')}>
                {currentUser ? 'Open dashboard' : 'Request Demo'}
              </button>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-card">
              <span>Market status</span>
              <strong>24/7 liquidity access • secure wallet routing</strong>
            </div>
            <div className="mini-stats">
              <div>
                <strong>4+</strong>
                <span>Years</span>
              </div>
              <div>
                <strong>12</strong>
                <span>Projects</span>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section about">
          <div className="section-heading">
            <p className="eyebrow">Overview</p>
            <h2>A CEX product built around trust, speed, and control.</h2>
          </div>
          <p>
            This exchange platform concept focuses on usability, secure account flows, and a strong trading experience for users who need a clean centralized market interface with reliable backend operations.
          </p>
        </section>

        <section id="projects" className="section">
          <div className="section-heading">
            <p className="eyebrow">Products</p>
            <h2>Core exchange capabilities.</h2>
          </div>

          <div className="project-grid">
            {projects.map((project) => (
              <article key={project.title} className="project-card">
                <div className="project-badge">Case Study</div>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <ul>
                  {project.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="skills" className="section">
          <div className="section-heading">
            <p className="eyebrow">Platform</p>
            <h2>Built for performance and risk-aware operations.</h2>
          </div>

          <div className="skill-list">
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </section>

        <section id="contact" className="section contact">
          <div className="section-heading">
            <p className="eyebrow">Contact</p>
            <h2>Let’s build the next exchange product.</h2>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Message
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell me about your project"
                rows={5}
                required
              />
            </label>

            <button type="submit" className="primary-btn submit-btn">Send Message</button>
            {status ? <p className="status-text">{status}</p> : null}
          </form>
        </section>

        <section id="admin" className="section admin-panel-section">
          <div className="section-heading">
            <p className="eyebrow">Admin access</p>
            <h2>Exchange authentication.</h2>
          </div>

          {currentUser ? (
            <div className="admin-box wallet-box">
              <div className="wallet-header">
                <div>
                  <p>Signed in as <strong>{currentUser.name}</strong></p>
                  <p>{currentUser.email}</p>
                </div>
                <button type="button" className="primary-btn" onClick={handleLogout}>Logout</button>
              </div>

              <div className="wallet-grid">
                {wallets.length > 0 ? (
                  wallets.map((wallet) => (
                    <div key={wallet.id} className="wallet-card">
                      <span>{wallet.currency}</span>
                      <strong>{wallet.balance.toFixed(2)}</strong>
                      <small>Updated {new Date(wallet.updatedAt).toLocaleString()}</small>
                    </div>
                  ))
                ) : (
                  <div className="wallet-card empty-wallet-card">
                    <span>No wallets yet</span>
                    <strong>Start with a new balance</strong>
                  </div>
                )}
              </div>

              <div className="wallet-form-row">
                <label>
                  Currency
                  <input
                    type="text"
                    name="currency"
                    value={walletForm.currency}
                    onChange={handleWalletFieldChange}
                    placeholder="USDT"
                  />
                </label>

                <label>
                  Amount
                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={walletForm.amount}
                    onChange={handleWalletFieldChange}
                    placeholder="100"
                  />
                </label>
              </div>

              <div className="wallet-actions">
                <button type="button" className="primary-btn" onClick={() => void handleWalletAction('create')}>
                  Create Wallet
                </button>
                <button type="button" className="ghost-btn" onClick={() => void handleWalletAction('deposit')}>
                  Deposit
                </button>
                <button type="button" className="ghost-btn" onClick={() => void handleWalletAction('withdraw')}>
                  Withdraw
                </button>
              </div>

              {walletStatus ? <p className="status-text">{walletStatus}</p> : null}
              {walletError ? <p className="error-text">{walletError}</p> : null}
            </div>
          ) : (
            <div className="admin-box">
              <p>Access the exchange admin panel to manage your account.</p>
              <button type="button" className="primary-btn" onClick={() => setView('auth')}>
                Open authentication page
              </button>
              <button type="button" className="ghost-btn" onClick={() => setView('wallet')}>
                Wallet page
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
