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
        password,
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

      <div className="login-shell">

        {/* =============================================
            SIGNUP FORM
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
                CREATE YOUR WORKSPACE
              </span>

              <h2>
                Start with ResolveOps
              </h2>

              <p>
                Create your organization and
                administrator account to start
                managing service operations.
              </p>

            </div>


            <form
              className="login-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label htmlFor="organization-name">
                  Organization name
                </label>

                <input
                  id="organization-name"
                  type="text"
                  placeholder="Acme Technologies"
                  value={organizationName}
                  onChange={(e) =>
                    setOrganizationName(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="organization-slug">
                  Organization slug
                </label>

                <input
                  id="organization-slug"
                  type="text"
                  placeholder="acme-technologies"
                  value={organizationSlug}
                  onChange={(e) =>
                    setOrganizationSlug(
                      e.target.value
                    )
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="admin-name">
                  Administrator name
                </label>

                <input
                  id="admin-name"
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

                <label htmlFor="admin-email">
                  Administrator email
                </label>

                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@company.com"
                  value={adminEmail}
                  onChange={(e) =>
                    setAdminEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                />

              </div>


              <div className="form-group">

                <label htmlFor="signup-password">
                  Password
                </label>

                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  autoComplete="new-password"
                />

              </div>


              {error && (
                <p className="login-error">
                  {error}
                </p>
              )}


              {success && (
                <p className="login-success">
                  {success}
                </p>
              )}


              <button
                className="login-button"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Creating workspace..."
                  : "Create ResolveOps workspace"}
              </button>

            </form>


            <div className="signup-text">

              <span>
                Already have an account?
              </span>

              <Link to="/login">
                Sign in
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
              RESOLVEOPS WORKSPACE
            </span>

            <h2>
              Build a clearer service
              operations workflow.
            </h2>

            <p>
              Bring incident routing, SLA visibility,
              team coordination and resolution tracking
              into one workspace.
            </p>

          </div>


          <div className="login-illustration">

            <img
              src="/resolveops-login.png"
              alt="ResolveOps incident and SLA operations workflow"
            />

          </div>


          <div className="visual-features">

            <div className="visual-feature">

              <span className="feature-icon">
                ↗
              </span>

              <div>
                <strong>
                  Incident Routing
                </strong>

                <span>
                  Organized workflows
                </span>
              </div>

            </div>


            <div className="visual-feature">

              <span className="feature-icon">
                ◷
              </span>

              <div>
                <strong>
                  SLA Visibility
                </strong>

                <span>
                  Monitor deadlines
                </span>
              </div>

            </div>


            <div className="visual-feature">

              <span className="feature-icon">
                ✓
              </span>

              <div>
                <strong>
                  Team Operations
                </strong>

                <span>
                  Resolve together
                </span>
              </div>

            </div>

          </div>

        </section>

      </div>

    </div>
  )
}

export default Signup