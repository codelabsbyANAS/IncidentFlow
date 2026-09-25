import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../api/api"
import "./Login.css"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const getErrorMessage = (err) => {
    const status = err.response?.status
    const detail = err.response?.data?.detail

    if (status === 401) {
      return "Invalid email or password."
    }

    if (status === 422) {
      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => item?.msg)
          .filter(Boolean)

        if (messages.length > 0) {
          return messages.join(" ")
        }
      }

      if (typeof detail === "string") {
        return detail
      }

      return "Please check the information you entered."
    }

    if (typeof detail === "string") {
      return detail
    }

    if (!err.response) {
      return "Could not connect to the server. Please make sure the backend is running."
    }

    return "Login failed. Please try again."
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")
    setLoading(true)

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      })

      localStorage.setItem(
        "access_token",
        response.data.access_token
      )

      navigate("/dashboard")
    } catch (err) {
      console.error("Login error:", err)

      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      <div className="login-shell">

        {/* =============================================
            LOGIN FORM
        ============================================== */}

        <section className="login-panel">

          <div className="login-brand">

            <div className="brand-icon">
              RO
            </div>

            <div>
              <h1>ResolveOps</h1>

              <p>
                Service Operations
              </p>
            </div>

          </div>


          <div className="login-content">

            <div className="login-heading">

              <span className="login-eyebrow">
                INCIDENT & SLA MANAGEMENT
              </span>

              <h2>
                Welcome back
              </h2>

              <p>
                Sign in to manage incidents,
                monitor SLA performance and keep
                service operations moving.
              </p>

            </div>


            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label htmlFor="login-email">
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />

              </div>


              <div className="form-group">

                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  minLength={8}
                  autoComplete="current-password"
                />

              </div>


              {error && (
                <p className="login-error">
                  {error}
                </p>
              )}


              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign in to ResolveOps"}
              </button>

            </form>


            <div className="signup-text">

              <span>
                New organization?
              </span>

              <Link to="/signup">
                Create an account
              </Link>

            </div>

          </div>


          <p className="login-footer-text">
            Multi-tenant incident and service
            operations platform
          </p>

        </section>


        {/* =============================================
            VISUAL PANEL
        ============================================== */}

        <section className="login-visual-panel">

          <div className="visual-glow visual-glow-one" />
          <div className="visual-glow visual-glow-two" />


          <div className="visual-copy">

            <span className="visual-badge">
              SERVICE OPERATIONS
            </span>

            <h2>
              Keep every incident
              moving toward resolution.
            </h2>

            <p>
              Route incidents, monitor SLA health,
              coordinate teams and stay ahead of
              operational risk.
            </p>

          </div>


          <div className="login-illustration">

            <img
              src="/resolveops-login.png"
              alt="ResolveOps incident routing and SLA workflow"
            />

          </div>


          <div className="visual-features">

            <div className="visual-feature">
              <span className="feature-icon">
                ↗
              </span>

              <div>
                <strong>
                  Smart Routing
                </strong>

                <span>
                  Automated assignment
                </span>
              </div>
            </div>


            <div className="visual-feature">
              <span className="feature-icon">
                ◷
              </span>

              <div>
                <strong>
                  SLA Tracking
                </strong>

                <span>
                  Real-time visibility
                </span>
              </div>
            </div>


            <div className="visual-feature">
              <span className="feature-icon">
                ✓
              </span>

              <div>
                <strong>
                  Resolution
                </strong>

                <span>
                  Clear operations flow
                </span>
              </div>
            </div>

          </div>

        </section>

      </div>

    </div>
  )
}

export default Login