import { useEffect, useState } from "react"
import api from "../api/api"

function IncidentHistory({
  incidentId,
  users,
  refreshKey,
}) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await api.get(
          `/incidents/${incidentId}/history`
        )

        setHistory(response.data)
      } catch (err) {
        console.error(err)

        setError(
          err.response?.data?.detail ||
            "Could not load incident history."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [incidentId, refreshKey])

  const getUserName = (userId) => {
    if (!userId) return "System"

    const user = users?.find(
      (item) => item.id === Number(userId)
    )

    return user ? user.name : `User ${userId}`
  }

  const formatDate = (date) => {
    if (!date) return ""

    return new Date(date).toLocaleString()
  }

  const formatEvent = (item) => {
    switch (item.event_type) {
      case "incident_created":
        return `Created incident ${item.new_value || ""}`

      case "incident_assigned":
        return `Assigned incident to ${getUserName(
          item.new_value
        )}`

      case "status_changed":
        return `Changed status from ${
          item.old_value || "—"
        } to ${item.new_value || "—"}`

      case "first_response":
        return "Added the first staff response"

      default:
        return item.event_type
          ?.replaceAll("_", " ")
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          )
    }
  }

  if (loading) {
    return (
      <section className="history-card">
        Loading activity...
      </section>
    )
  }

  if (error) {
    return (
      <section className="history-card">
        {error}
      </section>
    )
  }

  return (
    <section className="history-card">

      <h2>Activity Timeline</h2>

      {history.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        <div className="history-timeline">

          {history.map((item) => (
            <div
              className="history-item"
              key={item.id}
            >

              <div className="history-dot" />

              <div className="history-content">

                <strong>
                  {formatEvent(item)}
                </strong>

                <div className="history-meta">
                  <span>
                    {getUserName(item.actor_id)}
                  </span>

                  <span>
                    {formatDate(item.created_at)}
                  </span>
                </div>

              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  )
}

export default IncidentHistory