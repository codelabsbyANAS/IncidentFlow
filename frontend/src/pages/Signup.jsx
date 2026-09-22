import { useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/api"
import "./Login.css"

function Signup() {
  const [organizationName, setOrganizationName] = useState("")
  const [organizationSlug, setOrganizationSlug] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
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
      const response = await api.post("/auth/signup", {
        organization_name: organizationName,
        organization_slug: organizationSlug,
        admin_name: adminName,
        admin_email: adminEmail,
        password: password,
      })

      console.log("Signup response:", response.data)

      setSuccess(
        "Organization created successfully. You can now sign in."
      )

      setOrganizationName("")
      setOrganizationSlug("")
      setAdminName("")
      setAdminEmail("")
      setPassword("")
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Signup failed. Please check your information."
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
          <h2>Create organization</h2>
          <p>
            Create your workspace and administrator account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Organization name</label>

            <input
              type="text"
              placeholder="Acme Technologies"
              value={organizationName}
              onChange={(e) =>
                setOrganizationName(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Organization slug</label>

            <input
              type="text"
              placeholder="acme-technologies"
              value={organizationSlug}
              onChange={(e) =>
                setOrganizationSlug(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Administrator name</label>

            <input
              type="text"
              placeholder="John Doe"
              value={adminName}
              onChange={(e) =>
                setAdminName(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Administrator email</label>

            <input
              type="email"
              placeholder="admin@company.com"
              value={adminEmail}
              onChange={(e) =>
                setAdminEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
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
            {loading ? "Creating..." : "Create organization"}
          </button>

        </form>

        <div className="signup-text">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </div>

      </div>
    </div>
  )
}

export default Signup