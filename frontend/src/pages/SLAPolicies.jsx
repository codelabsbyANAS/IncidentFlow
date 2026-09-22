import { useEffect, useState } from "react"
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

        setMessage("SLA policy updated successfully.")
      } else {
        await api.post("/sla-policies", payload)

        setMessage("SLA policy created successfully.")
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
    setResponseMinutes(policy.response_minutes)
    setResolutionMinutes(policy.resolution_minutes)

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
    if (!value) return ""

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    )
  }

  return (
    <div className="sla-page">

      <div className="sla-layout">

        {/* CREATE / EDIT FORM */}
        <section className="sla-form-card">

          <h1>
            {editingPolicy
              ? "Edit SLA Policy"
              : "Create SLA Policy"}
          </h1>

          {editingPolicy && (
            <p className="editing-message">
              Editing {formatPriority(editingPolicy.priority)} policy
            </p>
          )}

          {message && (
            <div className="sla-success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="sla-error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="sla-form-group">

              <label>Priority</label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                disabled={Boolean(editingPolicy)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

            </div>

            <div className="sla-form-group">

              <label>
                Response time (minutes)
              </label>

              <input
                type="number"
                min="1"
                value={responseMinutes}
                onChange={(event) =>
                  setResponseMinutes(event.target.value)
                }
                placeholder="Example: 30"
                required
              />

            </div>

            <div className="sla-form-group">

              <label>
                Resolution time (minutes)
              </label>

              <input
                type="number"
                min="1"
                value={resolutionMinutes}
                onChange={(event) =>
                  setResolutionMinutes(event.target.value)
                }
                placeholder="Example: 120"
                required
              />

            </div>

            <button
              type="submit"
              className="sla-submit-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingPolicy
                  ? "Save Changes"
                  : "Create Policy"}
            </button>

            {editingPolicy && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
            )}

          </form>

        </section>


        {/* CURRENT POLICIES */}
        <section className="sla-policies-card">

          <h1>Current Policies</h1>

          {policies.length === 0 ? (
            <p>No SLA policies configured.</p>
          ) : (
            <div className="sla-policy-list">

              {policies.map((policy) => (
                <div
                  className="sla-policy-item"
                  key={policy.id}
                >

                  <div className="sla-policy-header">

                    <h3>
                      {formatPriority(policy.priority)}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >

                      <span className="sla-active-badge">
                        {policy.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(policy)
                        }
                        style={{
                          padding: "7px 14px",
                          border: "1px solid #2563eb",
                          borderRadius: "7px",
                          background: "white",
                          color: "#2563eb",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Edit
                      </button>

                    </div>

                  </div>

                  <div className="sla-policy-times">

                    <div>
                      <span>Response</span>
                      <strong>
                        {policy.response_minutes} min
                      </strong>
                    </div>

                    <div>
                      <span>Resolution</span>
                      <strong>
                        {policy.resolution_minutes} min
                      </strong>
                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>

    </div>
  )
}

export default SLAPolicies