import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/api"
import "./Notifications.css"

function Notifications() {
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [markingId, setMarkingId] = useState(null)

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications")
      setNotifications(response.data)
    } catch (err) {
      console.error(err)

      const detail = err.response?.data?.detail

      if (typeof detail === "string") {
        setError(detail)
      } else {
        setError("Could not load notifications.")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId) => {
    setMarkingId(notificationId)
    setError("")

    try {
      const response = await api.patch(
        `/notifications/${notificationId}/read`
      )

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? response.data
            : notification
        )
      )
    } catch (err) {
      console.error(err)

      const detail = err.response?.data?.detail

      if (typeof detail === "string") {
        setError(detail)
      } else {
        setError("Could not mark notification as read.")
      }
    } finally {
      setMarkingId(null)
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length

  if (loading) {
    return (
      <div className="notifications-message">
        Loading notifications...
      </div>
    )
  }

  return (
    <div className="notifications-page">

      <button
        className="notifications-back"
        onClick={() => navigate("/dashboard")}
      >
        ← Dashboard
      </button>

      <div className="notifications-header">

        <div>
          <h1>Notifications</h1>

          <p>
            Updates about your assigned incidents and SLA activity.
          </p>
        </div>

        <div className="unread-counter">
          {unreadCount} unread
        </div>

      </div>

      {error && (
        <div className="notifications-error">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="notifications-empty">

          <div className="notifications-empty-icon">
            🔔
          </div>

          <h2>No notifications yet</h2>

          <p>
            Your notifications will appear here.
          </p>

        </div>
      ) : (
        <div className="notifications-list">

          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-card ${
                notification.is_read
                  ? "notification-read"
                  : "notification-unread"
              }`}
            >

              <div className="notification-content">

                <div className="notification-title-row">

                  <strong>
                    {notification.notification_type
                      .replaceAll("_", " ")}
                  </strong>

                  {!notification.is_read && (
                    <span className="unread-dot" />
                  )}

                </div>

                <p>{notification.message}</p>

                <span className="notification-date">
                  {new Date(
                    notification.created_at
                  ).toLocaleString()}
                </span>

              </div>

              <div className="notification-actions">

                {notification.incident_id && (
                  <button
                    className="view-incident-button"
                    onClick={() =>
                      navigate(
                        `/incidents/${notification.incident_id}`
                      )
                    }
                  >
                    View Incident
                  </button>
                )}

                {!notification.is_read && (
                  <button
                    className="mark-read-button"
                    onClick={() =>
                      markAsRead(notification.id)
                    }
                    disabled={markingId === notification.id}
                  >
                    {markingId === notification.id
                      ? "Updating..."
                      : "Mark as read"}
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  )
}

export default Notifications