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

  const formatNotificationType = (value) => {
    if (!value) return "Notification"

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const getNotificationIcon = (type) => {
    const normalized = type?.toLowerCase() || ""

    if (normalized.includes("sla")) {
      return "◷"
    }

    if (normalized.includes("assign")) {
      return "↗"
    }

    if (
      normalized.includes("resolve") ||
      normalized.includes("close")
    ) {
      return "✓"
    }

    return "!"
  }

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-shell">
          <div className="notifications-loading-card">
            <div className="notifications-loading-dot" />
            <span>Loading notifications...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-page">

      <div className="notifications-glow notifications-glow-one" />
      <div className="notifications-glow notifications-glow-two" />

      <div className="notifications-shell">

        <button
          className="notifications-back"
          onClick={() => navigate("/dashboard")}
        >
          <span className="notifications-back-icon">
            ←
          </span>
          Dashboard
        </button>


        {/* =============================================
            HEADER
        ============================================== */}

        <section className="notifications-hero">

          <div className="notifications-hero-copy">

            <div className="notifications-title-row">

              <div className="notifications-title-icon">
                ◉
              </div>

              <div>
                <p className="notifications-eyebrow">
                  SERVICE UPDATES
                </p>

                <h1>
                  Notifications
                </h1>

                <p>
                  Stay on top of incident assignments,
                  SLA activity and service operations updates.
                </p>
              </div>

            </div>

          </div>


          <div className="notifications-hero-stats">

            <div className="notifications-stat">
              <span>Unread</span>
              <strong>{unreadCount}</strong>
            </div>

            <div className="notifications-stat">
              <span>Total</span>
              <strong>{notifications.length}</strong>
            </div>

          </div>

        </section>


        {error && (
          <div className="notifications-error">
            <span className="notifications-error-icon">
              !
            </span>
            {error}
          </div>
        )}


        {/* =============================================
            NOTIFICATION FEED
        ============================================== */}

        {notifications.length === 0 ? (
          <section className="notifications-empty">

            <div className="notifications-empty-icon">
              ◉
            </div>

            <span className="notifications-empty-kicker">
              ALL CAUGHT UP
            </span>

            <h2>
              No notifications yet
            </h2>

            <p>
              Assignment updates, SLA alerts and other
              operational activity will appear here.
            </p>

          </section>
        ) : (
          <section className="notifications-feed">

            <div className="notifications-feed-header">

              <div>
                <p className="notifications-feed-kicker">
                  ACTIVITY FEED
                </p>

                <h2>
                  Recent notifications
                </h2>
              </div>

              <span className="unread-counter">
                {unreadCount} unread
              </span>

            </div>


            <div className="notifications-list">

              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    notification.is_read
                      ? "notification-read"
                      : "notification-unread"
                  }`}
                >

                  <div className="notification-leading">

                    <div
                      className={`notification-type-icon ${
                        notification.is_read
                          ? "read"
                          : "unread"
                      }`}
                    >
                      {getNotificationIcon(
                        notification.notification_type
                      )}
                    </div>


                    <div className="notification-content">

                      <div className="notification-title-row">

                        <strong>
                          {formatNotificationType(
                            notification.notification_type
                          )}
                        </strong>

                        {!notification.is_read && (
                          <span className="notification-new-pill">
                            New
                          </span>
                        )}

                      </div>

                      <p>
                        {notification.message}
                      </p>

                      <div className="notification-meta">

                        <span>
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </span>

                        <span className="notification-status-text">
                          {notification.is_read
                            ? "Read"
                            : "Unread"}
                        </span>

                      </div>

                    </div>

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
                        <span>→</span>
                      </button>
                    )}

                    {!notification.is_read && (
                      <button
                        className="mark-read-button"
                        onClick={() =>
                          markAsRead(notification.id)
                        }
                        disabled={
                          markingId === notification.id
                        }
                      >
                        {markingId === notification.id
                          ? "Updating..."
                          : "Mark as read"}
                      </button>
                    )}

                  </div>

                </article>
              ))}

            </div>

          </section>
        )}

      </div>

    </div>
  )
}

export default Notifications
