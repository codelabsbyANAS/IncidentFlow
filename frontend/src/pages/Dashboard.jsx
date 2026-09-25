import { useEffect, useState } from "react"
import { useNavigate, NavLink } from "react-router-dom"
import api from "../api/api"
import "./Dashboard.css"

function Dashboard() {
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [reportPeriod, setReportPeriod] =
    useState("weekly")

  const [reportDownloading, setReportDownloading] =
    useState(false)

  const [reportError, setReportError] =
    useState("")

  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // ---------------------------------------------
        // CURRENT USER
        // ---------------------------------------------

        const userResponse = await api.get("/auth/me")

        const currentUser = userResponse.data

        setUser(currentUser)

        // ---------------------------------------------
        // STAFF DASHBOARD SUMMARY
        // ---------------------------------------------

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

        // ---------------------------------------------
        // MANAGEMENT ANALYTICS
        // Admin + Manager only
        // ---------------------------------------------

        if (
          currentUser.role === "admin" ||
          currentUser.role === "manager"
        ) {
          const analyticsResponse = await api.get(
            "/dashboard/analytics"
          )

          setAnalytics(analyticsResponse.data)
        }
      } catch (err) {
        console.error(err)

        if (err.response?.status === 401) {
          localStorage.removeItem("access_token")
          navigate("/login")
          return
        }

        setError("Could not load your dashboard.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [navigate])

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    navigate("/login")
  }

  // ---------------------------------------------
  // DOWNLOAD EXCEL REPORT
  // ---------------------------------------------

  const handleDownloadReport = async () => {
    setReportDownloading(true)
    setReportError("")

    try {
      const response = await api.get(
        "/reports/operations.xlsx",
        {
          params: {
            period: reportPeriod,
          },
          responseType: "blob",
        }
      )

      const contentDisposition =
        response.headers["content-disposition"]

      let filename =
        `resolveops_${reportPeriod}_report.xlsx`

      if (contentDisposition) {
        const filenameMatch =
          contentDisposition.match(
            /filename="?([^"]+)"?/
          )

        if (
          filenameMatch &&
          filenameMatch[1]
        ) {
          filename = filenameMatch[1]
        }
      }

      const blob = new Blob(
        [response.data],
        {
          type:
            response.headers["content-type"] ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      )

      const downloadUrl =
        window.URL.createObjectURL(blob)

      const link =
        document.createElement("a")

      link.href = downloadUrl
      link.download = filename

      document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(
        downloadUrl
      )
    } catch (err) {
      console.error(err)

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token")
        navigate("/login")
        return
      }

      if (err.response?.status === 403) {
        setReportError(
          "You do not have permission to download management reports."
        )
      } else {
        setReportError(
          "Could not download the Excel report."
        )
      }
    } finally {
      setReportDownloading(false)
    }
  }

  // ---------------------------------------------
  // ROLE PERMISSIONS
  // ---------------------------------------------

  const canViewSLAPolicies =
    user?.role === "admin" ||
    user?.role === "manager"

  const canViewAutomationRules =
    user?.role === "admin" ||
    user?.role === "manager"

  const canViewTeam =
    user?.role === "admin"

  const canViewStatistics =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "agent"

  const canViewAnalytics =
    user?.role === "admin" ||
    user?.role === "manager"

  // ---------------------------------------------
  // HELPERS
  // ---------------------------------------------

  const formatLabel = (value) => {
    if (!value) {
      return ""
    }

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const formatResolutionTime = (minutes) => {
    if (
      minutes === null ||
      minutes === undefined
    ) {
      return "N/A"
    }

    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    }

    const hours = minutes / 60

    if (hours < 24) {
      return `${hours.toFixed(1)} hrs`
    }

    const days = hours / 24

    return `${days.toFixed(1)} days`
  }

  const getMaximumCount = (items = []) => {
    if (!items.length) {
      return 1
    }

    return Math.max(
      ...items.map((item) => item.count),
      1
    )
  }

  const getMaximumWorkload = (items = []) => {
    if (!items.length) {
      return 1
    }

    return Math.max(
      ...items.map(
        (item) => item.active_incidents
      ),
      1
    )
  }

  const priorityMaximum = getMaximumCount(
    analytics?.incidents_by_priority
  )

  const categoryMaximum = getMaximumCount(
    analytics?.incidents_by_category
  )

  const trendMaximum = getMaximumCount(
    analytics?.daily_incidents
  )

  const workloadMaximum = getMaximumWorkload(
    analytics?.agent_workload
  )

  // ---------------------------------------------
  // LOADING
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading dashboard...
      </div>
    )
  }

  // ---------------------------------------------
  // ERROR
  // ---------------------------------------------

  if (error) {
    return (
      <div className="dashboard-loading">
        {error}
      </div>
    )
  }

  return (
    <div className="dashboard-layout">

      {/* =============================================
          SIDEBAR
      ============================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            RO
          </div>

          <div>
            <h2>ResolveOps</h2>

            <span>
              Service Operations
            </span>
          </div>

        </div>


        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            Dashboard
          </NavLink>


          <NavLink
            to="/incidents"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            Incidents
          </NavLink>


          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            Notifications
          </NavLink>


          {canViewSLAPolicies && (
            <NavLink
              to="/sla-policies"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              SLA Policies
            </NavLink>
          )}


          {canViewAutomationRules && (
            <NavLink
              to="/automation-rules"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              Automation Rules
            </NavLink>
          )}


          {canViewTeam && (
            <NavLink
              to="/team"
              className={({ isActive }) =>
                `nav-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              Team
            </NavLink>
          )}

        </nav>


      </aside>


      {/* =============================================
          MAIN CONTENT
      ============================================== */}

      <main className="dashboard-main">

        {/* ---------------------------------------------
            HEADER
        ---------------------------------------------- */}

        <header className="dashboard-header">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Monitor incidents, SLA performance
              and service operations.
            </p>

          </div>


          <div className="header-user-actions">

            <div className="user-profile">

              <div className="user-avatar">
                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>

                <strong>
                  {user?.name}
                </strong>

                <span>
                  {formatLabel(user?.role)}
                </span>

              </div>

            </div>

            <button
              type="button"
              className="header-logout-button"
              onClick={handleLogout}
            >
              Sign out
            </button>

          </div>

        </header>


        {/* ---------------------------------------------
            WELCOME CARD
        ---------------------------------------------- */}

        <section className="welcome-card welcome-card-premium">

          <div className="welcome-content">

            <div className="welcome-kicker-row">
              <p className="welcome-label">
                WELCOME BACK
              </p>

              <span className="welcome-product-badge">
                Service Operations
              </span>
            </div>

            <h2 className="welcome-title">
              Keep operations moving, {user?.name}.
            </h2>

            <p className="welcome-description">
              Track incidents, SLA health and team workload
              from one ResolveOps workspace.
            </p>

            <div className="account-details account-details-inline">

              <span>
                {user?.email}
              </span>

              <span>
                Organization #
                {user?.organization_id}
              </span>

            </div>

          </div>

          <div className="welcome-visual" aria-hidden="true">
            <div className="welcome-visual-glow" />
            <img
              src="/resolveops-operations.png"
              alt=""
              className="welcome-illustration"
            />
          </div>

        </section>


        {/* =============================================
            STAFF SUMMARY
        ============================================== */}

        {canViewStatistics ? (
          <section className="stats-grid">

            <div className="stat-card stat-card-total">

              <div className="stat-card-top">
                <span className="stat-icon stat-icon-blue">
                  ◈
                </span>

                <span className="stat-card-label">
                  Total Incidents
                </span>
              </div>

              <strong>
                {summary?.total_incidents ?? 0}
              </strong>

              <p>
                All incidents in your workspace
              </p>

            </div>


            <div className="stat-card stat-card-open">

              <div className="stat-card-top">
                <span className="stat-icon stat-icon-violet">
                  !
                </span>

                <span className="stat-card-label">
                  Open Incidents
                </span>
              </div>

              <strong>
                {summary?.open_incidents ?? 0}
              </strong>

              <p>
                Waiting for attention
              </p>

            </div>


            <div className="stat-card stat-card-progress">

              <div className="stat-card-top">
                <span className="stat-icon stat-icon-cyan">
                  ↗
                </span>

                <span className="stat-card-label">
                  In Progress
                </span>
              </div>

              <strong>
                {
                  summary
                    ?.in_progress_incidents ?? 0
                }
              </strong>

              <p>
                Currently being handled
              </p>

            </div>


            <div className="stat-card stat-card-sla">

              <div className="stat-card-top">
                <span className="stat-icon stat-icon-amber">
                  ◷
                </span>

                <span className="stat-card-label">
                  SLA Escalations
                </span>
              </div>

              <strong>
                {
                  summary
                    ?.active_escalations ?? 0
                }
              </strong>

              <p>
                Active escalations
              </p>

            </div>

          </section>
        ) : (

          <section className="welcome-card">

            <div>

              <h2>
                Customer Workspace
              </h2>

              <p>
                Use the Incidents section to
                create and follow your
                incident tickets.
              </p>

            </div>

          </section>
        )}


        {/* =============================================
            MANAGEMENT ANALYTICS
            ADMIN + MANAGER ONLY
        ============================================== */}

        {canViewAnalytics && analytics && (
          <>

            {/* -----------------------------------------
                ANALYTICS HEADER
            ------------------------------------------ */}

            <section className="analytics-heading">

              <div>

                <p className="welcome-label">
                  OPERATIONS ANALYTICS
                </p>

                <h2>
                  Service Performance
                </h2>

                <p>
                  Monitor SLA compliance,
                  resolution efficiency and
                  operational workload.
                </p>

              </div>

            </section>


            {/* =========================================
                OPERATIONS REPORTS
            ========================================== */}

            <section className="analytics-panel report-panel">

              <div className="analytics-panel-header report-panel-header">

                <div className="panel-heading-with-icon">

                  <div className="panel-icon panel-icon-blue">
                    ⇩
                  </div>

                  <div>

                    <h3>
                      Operations Reports
                    </h3>

                    <p>
                      Export incident-level service operations
                      records for weekly, monthly or all-time review.
                    </p>

                  </div>

                </div>

                <span className="panel-badge">
                  Excel export
                </span>

              </div>


              <div className="report-controls">

                <div className="report-field">

                  <label htmlFor="report-period">
                    Report period
                  </label>

                  <select
                    id="report-period"
                    className="report-select"
                    value={reportPeriod}
                    onChange={(event) => {
                      setReportPeriod(
                        event.target.value
                      )

                      setReportError("")
                    }}
                  >

                    <option value="weekly">
                      Weekly
                    </option>

                    <option value="monthly">
                      Monthly
                    </option>

                    <option value="all_time">
                      All Time
                    </option>

                  </select>

                </div>


                <button
                  type="button"
                  className="report-download-button"
                  onClick={handleDownloadReport}
                  disabled={reportDownloading}
                >
                  <span className="report-button-icon">
                    ⇩
                  </span>

                  {reportDownloading
                    ? "Generating Report..."
                    : "Download Excel Report"}
                </button>

              </div>


              <div className="report-note">
                <span className="report-note-dot" />

                Includes a full incident register with status,
                assignment, timestamps and SLA details, plus
                Executive Summary, SLA Performance and Team Workload.
              </div>


              {reportError && (
                <p className="report-error">
                  {reportError}
                </p>
              )}

            </section>


            {/* -----------------------------------------
                ANALYTICS KPI CARDS
            ------------------------------------------ */}

            <section className="analytics-kpi-grid">

              <div className="analytics-kpi-card kpi-compliance">

                <div className="analytics-kpi-top">
                  <span className="analytics-kpi-icon">
                    ✓
                  </span>

                  <span className="analytics-kpi-label">
                    SLA Compliance
                  </span>
                </div>

                <strong>
                  {
                    analytics
                      .sla_compliance_percentage
                  }
                  %
                </strong>

                <p>
                  Completed incidents within SLA
                </p>

              </div>


              <div className="analytics-kpi-card kpi-resolution">

                <div className="analytics-kpi-top">
                  <span className="analytics-kpi-icon">
                    ◷
                  </span>

                  <span className="analytics-kpi-label">
                    Average Resolution
                  </span>
                </div>

                <strong>
                  {formatResolutionTime(
                    analytics
                      .average_resolution_minutes
                  )}
                </strong>

                <p>
                  Average time to resolve
                </p>

              </div>


              <div className="analytics-kpi-card kpi-breached">

                <div className="analytics-kpi-top">
                  <span className="analytics-kpi-icon">
                    !
                  </span>

                  <span className="analytics-kpi-label">
                    Breached Incidents
                  </span>
                </div>

                <strong>
                  {
                    analytics
                      .breached_incidents
                  }
                </strong>

                <p>
                  Response or resolution breached
                </p>

              </div>


              <div className="analytics-kpi-card kpi-active">

                <div className="analytics-kpi-top">
                  <span className="analytics-kpi-icon">
                    ↗
                  </span>

                  <span className="analytics-kpi-label">
                    Active Incidents
                  </span>
                </div>

                <strong>
                  {
                    analytics
                      .active_incidents
                  }
                </strong>

                <p>
                  Open operational workload
                </p>

              </div>

            </section>


            {/* =========================================
                PRIORITY + CATEGORY
            ========================================== */}

            <section className="analytics-grid">

              {/* PRIORITY */}

              <div className="analytics-panel analytics-data-panel">

                <div className="analytics-panel-header">

                  <div className="panel-heading-with-icon">

                    <div className="panel-icon panel-icon-violet">
                      ◈
                    </div>

                    <div>

                      <h3>
                        Incidents by Priority
                      </h3>

                      <p>
                        Distribution of incident severity.
                      </p>

                    </div>

                  </div>

                </div>


                <div className="analytics-list">

                  {analytics
                    .incidents_by_priority
                    .map((item) => (

                    <div
                      className="analytics-list-item"
                      key={item.label}
                    >

                      <div className="analytics-list-row">

                        <span>
                          {formatLabel(
                            item.label
                          )}
                        </span>

                        <strong className="analytics-value-pill">
                          {item.count}
                        </strong>

                      </div>


                      <div className="analytics-bar-track">

                        <div
                          className={`analytics-bar-fill priority-bar priority-${item.label}`}
                          style={{
                            width:
                              `${
                                (
                                  item.count /
                                  priorityMaximum
                                ) * 100
                              }%`
                          }}
                        />

                      </div>

                    </div>
                  ))}

                </div>

              </div>


              {/* CATEGORY */}

              <div className="analytics-panel analytics-data-panel">

                <div className="analytics-panel-header">

                  <div className="panel-heading-with-icon">

                    <div className="panel-icon panel-icon-cyan">
                      ⌘
                    </div>

                    <div>

                      <h3>
                        Incidents by Category
                      </h3>

                      <p>
                        Most common service problem areas.
                      </p>

                    </div>

                  </div>

                </div>


                <div className="analytics-list">

                  {analytics
                    .incidents_by_category
                    .length === 0 ? (

                    <p className="analytics-empty">
                      No category data available.
                    </p>

                  ) : (

                    analytics
                      .incidents_by_category
                      .map((item) => (

                      <div
                        className="analytics-list-item"
                        key={item.label}
                      >

                        <div className="analytics-list-row">

                          <span>
                            {formatLabel(
                              item.label
                            )}
                          </span>

                          <strong className="analytics-value-pill">
                            {item.count}
                          </strong>

                        </div>


                        <div className="analytics-bar-track">

                          <div
                            className="analytics-bar-fill category-bar"
                            style={{
                              width:
                                `${
                                  (
                                    item.count /
                                    categoryMaximum
                                  ) * 100
                                }%`
                            }}
                          />

                        </div>

                      </div>
                    ))
                  )}

                </div>

              </div>

            </section>


            {/* =========================================
                7 DAY TREND
            ========================================== */}

            <section className="analytics-panel trend-panel">

              <div className="analytics-panel-header">

                <div className="panel-heading-with-icon">

                  <div className="panel-icon panel-icon-blue">
                    ↗
                  </div>

                  <div>

                    <h3>
                      7-Day Incident Trend
                    </h3>

                    <p>
                      New incidents created during the last seven days.
                    </p>

                  </div>

                </div>

                <span className="panel-badge panel-badge-soft">
                  Last 7 days
                </span>

              </div>


              <div className="trend-chart">

                {analytics
                  .daily_incidents
                  .map((item) => {

                    const date =
                      new Date(
                        `${item.date}T00:00:00`
                      )

                    const dayName =
                      date.toLocaleDateString(
                        undefined,
                        {
                          weekday: "short"
                        }
                      )

                    const percentage =
                      (
                        item.count /
                        trendMaximum
                      ) * 100

                    return (
                      <div
                        className="trend-column"
                        key={item.date}
                      >

                        <div className="trend-value">
                          {item.count}
                        </div>


                        <div className="trend-bar-area">

                          <div
                            className="trend-bar"
                            style={{
                              height:
                                `${percentage}%`
                            }}
                          />

                        </div>


                        <span>
                          {dayName}
                        </span>

                      </div>
                    )
                  })}

              </div>

            </section>


            {/* =========================================
                AGENT WORKLOAD
            ========================================== */}

            <section className="analytics-panel workload-panel">

              <div className="analytics-panel-header">

                <div className="panel-heading-with-icon">

                  <div className="panel-icon panel-icon-violet">
                    ◎
                  </div>

                  <div>

                    <h3>
                      Team Workload
                    </h3>

                    <p>
                      Active assigned incidents across operational staff.
                    </p>

                  </div>

                </div>

                <span className="panel-badge panel-badge-soft">
                  Live workload
                </span>

              </div>


              <div className="analytics-list workload-list">

                {analytics
                  .agent_workload
                  .length === 0 ? (

                  <p className="analytics-empty">
                    No staff workload data.
                  </p>

                ) : (

                  analytics
                    .agent_workload
                    .map((member) => (

                    <div
                      className="analytics-list-item workload-item"
                      key={member.user_id}
                    >

                      <div className="analytics-list-row workload-list-row">

                        <div className="workload-user-row">

                          <div className="workload-avatar">
                            {member.name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div className="workload-user">

                            <strong>
                              {member.name}
                            </strong>

                            <span>
                              {formatLabel(
                                member.role
                              )}
                            </span>

                          </div>

                        </div>


                        <span className="workload-count">
                          {
                            member
                              .active_incidents
                          }{" "}
                          active
                        </span>

                      </div>


                      <div className="analytics-bar-track workload-track">

                        <div
                          className="analytics-bar-fill workload-bar"
                          style={{
                            width:
                              `${
                                (
                                  member
                                    .active_incidents /
                                  workloadMaximum
                                ) * 100
                              }%`
                          }}
                        />

                      </div>

                    </div>
                  ))
                )}

              </div>

            </section>

          </>
        )}

      </main>

    </div>
  )
}

export default Dashboard