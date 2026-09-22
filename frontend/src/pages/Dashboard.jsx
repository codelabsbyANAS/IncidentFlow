import { useEffect, useState } from "react"
import { useNavigate, NavLink } from "react-router-dom"
import api from "../api/api"
import "./Dashboard.css"

function Dashboard() {
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // Get current logged-in user first
        const userResponse = await api.get("/auth/me")

        const currentUser = userResponse.data

        setUser(currentUser)

        // Dashboard summary is for staff users
        if (
          currentUser.role === "admin" ||
          currentUser.role === "manager" ||
          currentUser.role === "agent"
        ) {
          const summaryResponse = await api.get(
            "/dashboard/summary"
          )

          setSummary(summaryResponse.data)
        }
      } catch (err) {
        console.error(err)

        if (err.response?.status === 401) {
          localStorage.removeItem("access_token")
          navigate("/login")
          return
        }

        setError("Could not load your account.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    navigate("/login")
  }

  const canViewSLAPolicies =
    user?.role === "admin" ||
    user?.role === "manager"

  const canViewTeam =
    user?.role === "admin"

  const canViewStatistics =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "agent"

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        {error}
      </div>
    )
  }

  return (
    <div className="dashboard-layout">

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            IF
          </div>

          <div>
            <h2>IncidentFlow</h2>
            <span>Service Operations</span>
          </div>

        </div>


        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Dashboard
          </NavLink>


          <NavLink
            to="/incidents"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Incidents
          </NavLink>


          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            Notifications
          </NavLink>


          {canViewSLAPolicies && (
            <NavLink
              to="/sla-policies"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              SLA Policies
            </NavLink>
          )}


          {canViewTeam && (
            <NavLink
              to="/team"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              Team
            </NavLink>
          )}

        </nav>


        <div className="sidebar-bottom">

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>

      </aside>


      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>
            <h1>Dashboard</h1>

            <p>
              Monitor incidents, SLA performance and service operations.
            </p>
          </div>


          <div className="user-profile">

            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>

          </div>

        </header>


        <section className="welcome-card">

          <div>

            <p className="welcome-label">
              WELCOME BACK
            </p>

            <h2>{user?.name}</h2>

            <p>
              Here is an overview of your IncidentFlow workspace.
            </p>

          </div>


          <div className="account-details">

            <span>{user?.email}</span>

            <span>
              Organization #{user?.organization_id}
            </span>

          </div>

        </section>


        {canViewStatistics ? (
          <section className="stats-grid">

            <div className="stat-card">
              <span>Total Incidents</span>

              <strong>
                {summary?.total_incidents ?? 0}
              </strong>

              <p>All incidents</p>
            </div>


            <div className="stat-card">
              <span>Open Incidents</span>

              <strong>
                {summary?.open_incidents ?? 0}
              </strong>

              <p>Needs attention</p>
            </div>


            <div className="stat-card">
              <span>In Progress</span>

              <strong>
                {summary?.in_progress_incidents ?? 0}
              </strong>

              <p>Currently being handled</p>
            </div>


            <div className="stat-card">
              <span>SLA Escalations</span>

              <strong>
                {summary?.active_escalations ?? 0}
              </strong>

              <p>Active escalations</p>
            </div>

          </section>
        ) : (
          <section className="welcome-card">

            <div>

              <h2>Customer Workspace</h2>

              <p>
                Use the Incidents section to create and
                follow your incident tickets.
              </p>

            </div>

          </section>
        )}

      </main>

    </div>
  )
}

export default Dashboard  

