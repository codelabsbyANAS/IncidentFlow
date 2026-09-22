import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/api"
import "./Login.css"

function Login() {
  const navigate = useNavigate()    
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      })

      console.log("Login response:", response.data)

      localStorage.setItem(
        "access_token",
        response.data.access_token
      )

      navigate("/dashboard")

      setSuccess("Login successful!")
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your email and password."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-brand">
          <div className="brand-icon">IF</div>

          <div>
            <h1>IncidentFlow</h1>
            <p>Incident & SLA Management</p>
          </div>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to manage incidents and service operations.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Email address</label>

            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          {success && (
            <p className="login-success">{success}</p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <div className="signup-text">
          New organization?{" "}
          <a href="/signup">Create an account</a>
        </div>

      </div>
    </div>
  )
}

export default Login