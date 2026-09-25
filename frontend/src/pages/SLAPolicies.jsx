import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "../api/api"
import "./SLAPolicies.css"

function SLAPolicies() {
  const [policies, setPolicies] = useState([])

  const [priority, setPriority] = useState("low")
  const [responseMinutes, setResponseMinutes] = useState("")
  const [resolutionMinutes, setResolutionMinutes] = useState("")

  const [editingPolicy, setEditingPolicy] = useState(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchPolicies = async () => {
    try {
      const response = await api.get("/sla-policies")
      setPolicies(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not load SLA policies."
      )
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const resetForm = () => {
    setPriority("low")
    setResponseMinutes("")
    setResolutionMinutes("")
    setEditingPolicy(null)
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage("")
    setError("")

    const responseValue = Number(responseMinutes)
    const resolutionValue = Number(resolutionMinutes)

    if (responseValue <= 0 || resolutionValue <= 0) {
      setError("SLA times must be greater than 0.")
      return
    }

    if (resolutionValue < responseValue) {
      setError(
        "Resolution time cannot be shorter than response time."
      )
      return
    }

    const payload = {
      priority,
      response_minutes: responseValue,
      resolution_minutes: resolutionValue,
    }

    setLoading(true)

    try {
      if (editingPolicy) {
        await api.patch(
          `/sla-policies/${editingPolicy.id}`,
          payload
        )

        setMessage(
          "SLA policy updated successfully."
        )
      } else {
        await api.post(
          "/sla-policies",
          payload
        )

        setMessage(
          "SLA policy created successfully."
        )
      }

      resetForm()
      await fetchPolicies()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not save SLA policy."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (policy) => {
    setEditingPolicy(policy)

    setPriority(policy.priority)
    setResponseMinutes(
      policy.response_minutes
    )
    setResolutionMinutes(
      policy.resolution_minutes
    )

    setMessage("")
    setError("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const handleCancelEdit = () => {
    resetForm()
    setMessage("")
  }

  const formatPriority = (value) => {
    if (!value) {
      return ""
    }

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    )
  }

  const activeCount = policies.filter(
    (policy) => policy.is_active
  ).length

  return (
    <div className="sla-page">

      <div className="sla-page-glow sla-page-glow-one" />
      <div className="sla-page-glow sla-page-glow-two" />

      <div className="sla-shell">

        <Link
          to="/dashboard"
          className="sla-back"
        >
          <span className="sla-back-icon">
            ←
          </span>
          Dashboard
        </Link>


        {/* =============================================
            HERO
        ============================================== */}

        <section className="sla-hero">

          <div className="sla-hero-copy">

            <div className="sla-title-row">

              <div className="sla-title-icon">
                ◷
              </div>

              <div>
                <p className="sla-eyebrow">
                  SERVICE LEVEL MANAGEMENT
                </p>

                <h1>
                  SLA Policies
                </h1>

                <p>
                  Define response and resolution targets for each
                  incident priority.
                </p>
              </div>

            </div>

          </div>


          <div className="sla-hero-stats">

            <div className="sla-hero-stat">
              <span>Policies</span>
              <strong>{policies.length}</strong>
            </div>

            <div className="sla-hero-stat">
              <span>Active</span>
              <strong>{activeCount}</strong>
            </div>

          </div>

        </section>


        {/* =============================================
            MAIN LAYOUT
        ============================================== */}

        <div className="sla-layout">

          {/* ---------------------------------------------
              CREATE / EDIT FORM
          ---------------------------------------------- */}

          <section className="sla-form-card">

            <div className="sla-card-heading">

              <div className="sla-card-heading-icon">
                {editingPolicy ? "✎" : "+"}
              </div>

              <div>
                <span className="sla-card-kicker">
                  {editingPolicy
                    ? "EDIT POLICY"
                    : "NEW POLICY"}
                </span>

                <h2>
                  {editingPolicy
                    ? "Edit SLA Policy"
                    : "Create SLA Policy"}
                </h2>
              </div>

            </div>


            <p className="sla-card-description">
              Configure the maximum response and resolution time
              for a priority level.
            </p>


            {editingPolicy && (
              <div className="editing-message">

                <span className="editing-indicator">
                  ✎
                </span>

                <span>
                  Editing{" "}
                  <strong>
                    {formatPriority(
                      editingPolicy.priority
                    )}
                  </strong>{" "}
                  priority policy
                </span>

              </div>
            )}


            {message && (
              <div className="sla-success-message">
                <span>✓</span>
                {message}
              </div>
            )}


            {error && (
              <div className="sla-error-message">
                <span>!</span>
                {error}
              </div>
            )}


            <form
              className="sla-form"
              onSubmit={handleSubmit}
            >

              <div className="sla-form-group">

                <label>
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value
                    )
                  }
                  disabled={Boolean(
                    editingPolicy
                  )}
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="critical">
                    Critical
                  </option>
                </select>

              </div>


              <div className="sla-form-group">

                <label>
                  Response time
                </label>

                <div className="sla-input-with-unit">

                  <input
                    type="number"
                    min="1"
                    value={responseMinutes}
                    onChange={(event) =>
                      setResponseMinutes(
                        event.target.value
                      )
                    }
                    placeholder="Example: 30"
                    required
                  />

                  <span>
                    minutes
                  </span>

                </div>

              </div>


              <div className="sla-form-group">

                <label>
                  Resolution time
                </label>

                <div className="sla-input-with-unit">

                  <input
                    type="number"
                    min="1"
                    value={resolutionMinutes}
                    onChange={(event) =>
                      setResolutionMinutes(
                        event.target.value
                      )
                    }
                    placeholder="Example: 120"
                    required
                  />

                  <span>
                    minutes
                  </span>

                </div>

              </div>


              <button
                type="submit"
                className="sla-submit-button"
                disabled={loading}
              >
                <span className="sla-submit-icon">
                  {editingPolicy ? "✓" : "+"}
                </span>

                {loading
                  ? "Saving..."
                  : editingPolicy
                    ? "Save Changes"
                    : "Create Policy"}
              </button>


              {editingPolicy && (
                <button
                  type="button"
                  className="sla-cancel-button"
                  onClick={handleCancelEdit}
                >
                  Cancel editing
                </button>
              )}

            </form>

          </section>


          {/* ---------------------------------------------
              CURRENT POLICIES
          ---------------------------------------------- */}

          <section className="sla-policies-card">

            <div className="sla-policies-header">

              <div>
                <span className="sla-card-kicker">
                  CURRENT CONFIGURATION
                </span>

                <h2>
                  Current Policies
                </h2>

                <p>
                  Response and resolution targets currently configured
                  for your organization.
                </p>
              </div>

              <span className="sla-policy-count">
                {policies.length} configured
              </span>

            </div>


            {policies.length === 0 ? (

              <div className="sla-empty">

                <div className="sla-empty-icon">
                  ◷
                </div>

                <h3>
                  No SLA policies configured
                </h3>

                <p>
                  Create your first policy using the form.
                </p>

              </div>

            ) : (

              <div className="sla-policy-list">

                {policies.map(
                  (policy) => (

                    <article
                      className={`sla-policy-item priority-${policy.priority}`}
                      key={policy.id}
                    >

                      <div className="sla-policy-header">

                        <div className="sla-policy-priority-wrap">

                          <div
                            className={`sla-priority-icon ${policy.priority}`}
                          >
                            ◷
                          </div>

                          <div>
                            <span className="sla-policy-label">
                              PRIORITY
                            </span>

                            <h3>
                              {formatPriority(
                                policy.priority
                              )}
                            </h3>
                          </div>

                        </div>


                        <div className="sla-policy-actions">

                          <span
                            className={
                              policy.is_active
                                ? "sla-active-badge"
                                : "sla-inactive-badge"
                            }
                          >
                            <span className="sla-badge-dot" />
                            {policy.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <button
                            type="button"
                            className="sla-edit-button"
                            onClick={() =>
                              handleEdit(
                                policy
                              )
                            }
                          >
                            Edit
                          </button>

                        </div>

                      </div>


                      <div className="sla-policy-times">

                        <div className="sla-time-card">

                          <span className="sla-time-label">
                            Response
                          </span>

                          <strong>
                            {
                              policy
                                .response_minutes
                            }
                          </strong>

                          <span className="sla-time-unit">
                            minutes
                          </span>

                        </div>


                        <div className="sla-time-connector">
                          →
                        </div>


                        <div className="sla-time-card">

                          <span className="sla-time-label">
                            Resolution
                          </span>

                          <strong>
                            {
                              policy
                                .resolution_minutes
                            }
                          </strong>

                          <span className="sla-time-unit">
                            minutes
                          </span>

                        </div>

                      </div>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </div>

    </div>
  )
}

export default SLAPolicies
