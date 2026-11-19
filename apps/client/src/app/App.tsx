import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import { PortfolioPage } from '../pages'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/authService'

const navItems = ['Trade', 'Portfolio']

function App() {
  const [activePage, setActivePage] = useState('Trade')
  const [authLoading, setAuthLoading] = useState(false)
  const [authUser, setAuthUser] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    let ignore = false

    const loadCurrentUser = async () => {
      try {
        const response = await getCurrentUser()
        if (!ignore) setAuthUser(response.user?.name ?? null)
      } catch {
        if (!ignore) setAuthUser(null)
      }
    }

    void loadCurrentUser()
    return () => {
      ignore = true
    }
  }, [])

  const handleAuthButton = async () => {
    if (authUser) {
      setAuthLoading(true)
      setAuthError(null)
      try {
        await logoutUser()
        setAuthUser(null)
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Sign-out failed.')
      } finally {
        setAuthLoading(false)
      }
      return
    }

    setAuthMode('login')
    setAuthError(null)
    setAuthModalOpen(true)
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const name = String(form.get('name') ?? '').trim()

    try {
      const response = authMode === 'register'
        ? await registerUser({ name, email, password })
        : await loginUser({ email, password })

      setAuthUser(response.user.name)
      setAuthModalOpen(false)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  const renderPage = () => {
    if (activePage === 'Portfolio') {
      return <PortfolioPage />
    }

    return (
      <main className="portfolio-page">
        <section className="portfolio-header">
          <div>
            <p className="eyebrow">Coming soon</p>
            <h1>{activePage}</h1>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark-inner" />
          </div>
          <div className="brand-name">CEX-CentralizedExchange</div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActivePage(item)}
              className={`nav-item${activePage === item ? ' nav-item-active' : ''}`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className={`connect-btn${authUser ? ' connected' : ''}`}
            onClick={handleAuthButton}
            disabled={authLoading}
            aria-live="polite"
            title={authError ?? undefined}
          >
            {authLoading
              ? authUser ? 'Signing out...' : 'Signing in...'
              : authUser ? `Sign out · ${authUser}` : 'Sign in'}
          </button>

          <button type="button" className="icon-btn" aria-label="Global">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 12h16M12 4c2.6 2.4 4 5.3 4 8s-1.4 5.6-4 8c-2.6-2.4-4-5.3-4-8s1.4-5.6 4-8Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>

          <button type="button" className="icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 17h8l-1.2-1.5A2 2 0 0 1 14.5 14V10a2.5 2.5 0 0 0-5 0v4a2 2 0 0 1-.3 1.1L8 17Zm3 4a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {authError && !authModalOpen ? <div className="auth-error" role="alert">{authError}</div> : null}

      {authModalOpen ? (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={() => !authLoading && setAuthModalOpen(false)}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="auth-modal-close" type="button" onClick={() => setAuthModalOpen(false)} disabled={authLoading} aria-label="Close">×</button>
            <p className="eyebrow">Secure account</p>
            <h2 id="auth-title">{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' ? (
                <label>
                  Full name
                  <input name="name" type="text" minLength={2} maxLength={80} autoComplete="name" required />
                </label>
              ) : null}

              <label>
                Email
                <input name="email" type="email" maxLength={254} autoComplete="email" required />
              </label>

              <label>
                Password
                <input name="password" type="password" minLength={6} maxLength={128} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} required />
              </label>

              {authError ? <p className="auth-form-error" role="alert">{authError}</p> : null}

              <button className="auth-submit" type="submit" disabled={authLoading}>
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <button
              className="auth-mode-switch"
              type="button"
              onClick={() => {
                setAuthError(null)
                setAuthMode((mode) => mode === 'login' ? 'register' : 'login')
              }}
              disabled={authLoading}
            >
              {authMode === 'login' ? 'New to CEX? Create account' : 'Already have an account? Sign in'}
            </button>
          </section>
        </div>
      ) : null}

      {renderPage()}
    </div>
  )
}

export default App
