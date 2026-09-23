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

    // Wrong email/password
    if (status === 401) {
      return "Invalid email or password."
    }

    // FastAPI validation error
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

    // Other API error
    if (typeof detail === "string") {
      return detail
    }

    // Backend not running / network problem
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

      <div className="login-card">

        <div className="login-brand">

          <div className="brand-icon">
            IF
          </div>

          <div>
            <h1>IncidentFlow</h1>

            <p>
              Incident & SLA Management
            </p>
          </div>

        </div>


        <div className="login-heading">

          <h2>
            Welcome back
          </h2>

          <p>
            Sign in to manage incidents and service operations.
          </p>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>
              Email address
            </label>

            <input
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

            <label>
              Password
            </label>

            <input
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
              : "Sign in"}
          </button>

        </form>


        <div className="signup-text">

          New organization?{" "}

          <Link to="/signup">
            Create an account
          </Link>

        </div>

      </div>

    </div>
  )
}

export default Login