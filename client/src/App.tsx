import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'
import { getCurrentUser, loginUser, registerUser, type AuthUser } from './services/authService'

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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('portfolio-token')

    if (!token) {
      return
    }

    getCurrentUser(token)
      .then((data) => setCurrentUser(data.user))
      .catch(() => {
        localStorage.removeItem('portfolio-token')
        setCurrentUser(null)
      })
  }, [])

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
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('portfolio-token')
    setCurrentUser(null)
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
          <a href="#admin">Admin</a>
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
              <a className="ghost-btn" href="#contact">Request Demo</a>
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
            <div className="admin-box">
              <p>Signed in as <strong>{currentUser.name}</strong></p>
              <p>{currentUser.email}</p>
              <button type="button" className="primary-btn" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <form className="admin-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' ? (
                <label>
                  Name
                  <input
                    type="text"
                    name="name"
                    value={authForm.name}
                    onChange={handleAuthFieldChange}
                    placeholder="Your full name"
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
                  placeholder="admin@example.com"
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
                  placeholder="Password"
                  required
                />
              </label>

              {authError ? <p className="error-text">{authError}</p> : null}

              <button type="submit" className="primary-btn submit-btn">
                {authMode === 'login' ? 'Login' : 'Register'}
              </button>

              <button
                type="button"
                className="toggle-link"
                onClick={() => setAuthMode((previous) => (previous === 'login' ? 'register' : 'login'))}
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
