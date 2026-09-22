import { useEffect, useState } from "react"
import api from "../api/api"

function IncidentSLA({ incidentId, refreshKey }) {
  const [sla, setSla] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchSLA = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await api.get(
          `/incidents/${incidentId}/sla-status`
        )

        setSla(response.data)
      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.detail ||
            "Could not load SLA status."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSLA()
  }, [incidentId, refreshKey])

  const formatStatus = (status) => {
    if (!status) return "—"

    return status
      .replaceAll("_", " ")
      .toUpperCase()
  }

  const formatDate = (date) => {
    if (!date) return "—"

    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <section className="sla-status-card">
        Loading SLA status...
      </section>
    )
  }

  if (error) {
    return (
      <section className="sla-status-card">
        {error}
      </section>
    )
  }

  if (!sla) {
    return null
  }

  return (
    <section className="sla-status-card">

      <h2>SLA Status</h2>

      {sla.response_status === "not_configured" ? (
        <p className="sla-not-configured">
          No SLA policy was configured when this incident
          was created.
        </p>
      ) : (
        <div className="sla-status-grid">

          <div className="sla-status-item">

            <span>Response SLA</span>

            <strong
              className={`sla-state ${sla.response_status}`}
            >
              {formatStatus(sla.response_status)}
            </strong>

            <p>
              Due: {formatDate(sla.response_due_at)}
            </p>

            <p>
              First response:{" "}
              {formatDate(sla.first_response_at)}
            </p>

          </div>

          <div className="sla-status-item">

            <span>Resolution SLA</span>

            <strong
              className={`sla-state ${sla.resolution_status}`}
            >
              {formatStatus(sla.resolution_status)}
            </strong>

            <p>
              Due: {formatDate(sla.resolution_due_at)}
            </p>

            <p>
              Resolved: {formatDate(sla.resolved_at)}
            </p>

          </div>

        </div>
      )}

    </section>
  )
}

export default IncidentSLA