import { useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "../api/api"
import "./Team.css"

function Team() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("agent")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdUser, setCreatedUser] = useState(null)

  const handleCreateUser = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError("")
    setCreatedUser(null)

    try {
      const response = await api.post("/users", {
        name,
        email,
        password,
        role,
      })

      setCreatedUser(response.data)

      setName("")
      setEmail("")
      setPassword("")
      setRole("agent")
    } catch (err) {
      console.error(err)

      const detail = err.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .join(", ")
        )
      } else if (typeof detail === "string") {
        setError(detail)
      } else {
        setError("Could not create team member.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="team-page">

      <div className="team-glow team-glow-one" />
      <div className="team-glow team-glow-two" />

      <div className="team-shell">

        <button
          className="team-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <span className="team-back-icon">
            ←
          </span>
          Dashboard
        </button>


        {/* =============================================
            HERO
        ============================================== */}

        <section className="team-hero">

          <div className="team-hero-copy">

            <div className="team-title-row">

              <div className="team-title-icon">
                ◎
              </div>

              <div>
                <p className="team-eyebrow">
                  ORGANIZATION ACCESS
                </p>

                <h1>
                  Team
                </h1>

                <p>
                  Add people to your ResolveOps organization and
                  assign the right access level for service operations.
                </p>
              </div>

            </div>

          </div>


          <div className="team-hero-note">

            <span>
              MULTI-TENANT ACCESS
            </span>

            <strong>
              Members are created inside your current organization.
            </strong>

          </div>

        </section>


        {/* =============================================
            MAIN CONTENT
        ============================================== */}

        <div className="team-layout">

          {/* ---------------------------------------------
              CREATE MEMBER
          ---------------------------------------------- */}

          <section className="team-card">

            <div className="team-card-heading">

              <div className="team-card-heading-icon">
                +
              </div>

              <div>
                <span className="team-card-kicker">
                  NEW MEMBER
                </span>

                <h2>
                  Add team member
                </h2>
              </div>

            </div>


            <p className="team-card-description">
              Create a new organization user and choose the role
              they should use inside ResolveOps.
            </p>


            {error && (
              <div className="team-error">
                <span className="team-message-icon">
                  !
                </span>
                {error}
              </div>
            )}


            {createdUser && (
              <div className="team-success">

                <div className="team-success-icon">
                  ✓
                </div>

                <div className="team-success-content">

                  <strong>
                    Team member created successfully
                  </strong>

                  <div className="team-created-user">

                    <span>
                      {createdUser.name}
                    </span>

                    <span className="team-created-role">
                      {createdUser.role}
                    </span>

                  </div>

                  <p>
                    {createdUser.email}
                  </p>

                  <small>
                    User ID #{createdUser.id}
                  </small>

                </div>

              </div>
            )}


            <form onSubmit={handleCreateUser}>

              <div className="team-form-group">

                <label>
                  Name
                </label>

                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />

              </div>


              <div className="team-form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  placeholder="rahul@company.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

              </div>


              <div className="team-form-group">

                <label>
                  Temporary password
                </label>

                <input
                  type="password"
                  placeholder="Create temporary password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

                <small>
                  Share this password securely with the new member.
                </small>

              </div>


              <div className="team-form-group">

                <label>
                  Role
                </label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                >
                  <option value="agent">
                    Agent
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="customer">
                    Customer
                  </option>
                </select>

              </div>


              <button
                className="team-create-button"
                type="submit"
                disabled={loading}
              >
                <span className="team-create-icon">
                  +
                </span>

                {loading
                  ? "Creating..."
                  : "Add Team Member"}
              </button>

            </form>

          </section>


          {/* ---------------------------------------------
              ROLE GUIDE
          ---------------------------------------------- */}

          <section className="team-role-card">

            <div className="team-role-header">

              <div>
                <span className="team-card-kicker">
                  ACCESS GUIDE
                </span>

                <h2>
                  Choose the right role
                </h2>

                <p>
                  ResolveOps uses role-based access so each user sees
                  the tools appropriate for their responsibilities.
                </p>
              </div>

            </div>


            <div className="team-role-list">

              <article
                className={`team-role-item ${
                  role === "agent"
                    ? "selected"
                    : ""
                }`}
              >

                <div className="team-role-icon agent">
                  A
                </div>

                <div className="team-role-copy">

                  <div className="team-role-title">

                    <h3>
                      Agent
                    </h3>

                    {role === "agent" && (
                      <span>
                        Selected
                      </span>
                    )}

                  </div>

                  <p>
                    Handles assigned incidents, updates lifecycle
                    status and works with incident comments.
                  </p>

                </div>

              </article>


              <article
                className={`team-role-item ${
                  role === "manager"
                    ? "selected"
                    : ""
                }`}
              >

                <div className="team-role-icon manager">
                  M
                </div>

                <div className="team-role-copy">

                  <div className="team-role-title">

                    <h3>
                      Manager
                    </h3>

                    {role === "manager" && (
                      <span>
                        Selected
                      </span>
                    )}

                  </div>

                  <p>
                    Oversees operations, assignments, SLA performance,
                    automation and management reporting.
                  </p>

                </div>

              </article>


              <article
                className={`team-role-item ${
                  role === "customer"
                    ? "selected"
                    : ""
                }`}
              >

                <div className="team-role-icon customer">
                  C
                </div>

                <div className="team-role-copy">

                  <div className="team-role-title">

                    <h3>
                      Customer
                    </h3>

                    {role === "customer" && (
                      <span>
                        Selected
                      </span>
                    )}

                  </div>

                  <p>
                    Creates and follows customer-facing incidents
                    without access to internal support notes.
                  </p>

                </div>

              </article>

            </div>


            <div className="team-security-note">

              <div className="team-security-icon">
                ✓
              </div>

              <div>
                <strong>
                  Organization isolation
                </strong>

                <p>
                  New users are created inside the current ResolveOps
                  organization and remain isolated from other tenants.
                </p>
              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  )
}

export default Team
