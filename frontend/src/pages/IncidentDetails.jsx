import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import api from "../api/api"
import "./IncidentDetails.css"

import IncidentComments from "../components/IncidentComments"
import IncidentSLA from "../components/IncidentSLA"
import IncidentHistory from "../components/IncidentHistory"

function IncidentDetails() {
  const { incidentId } = useParams()
  const navigate = useNavigate()

  const [incident, setIncident] = useState(null)
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const [selectedUser, setSelectedUser] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = () => {
    setRefreshKey((current) => current + 1)
  }

  const fetchIncident = async () => {
    try {
      const response = await api.get(
        `/incidents/${incidentId}`
      )

      setIncident(response.data)

      return response.data
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not load incident."
      )

      return null
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get(
        "/users/directory"
      )

      setUsers(response.data)
    } catch (err) {
      console.error(err)
      setUsers([])
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me")

      setCurrentUser(response.data)
    } catch (err) {
      console.error(err)
      setCurrentUser(null)
    }
  }

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true)
      setError("")

      await Promise.all([
        fetchIncident(),
        fetchUsers(),
        fetchCurrentUser(),
      ])

      setLoading(false)
    }

    loadPage()
  }, [incidentId])

  const getUserName = (userId) => {
    if (!userId) return "Unassigned"

    const user = users.find(
      (item) => item.id === Number(userId)
    )

    return user ? user.name : `User ${userId}`
  }

  const assignableUsers = users.filter(
    (user) =>
      user.role === "agent" ||
      user.role === "manager"
  )

  const canAssign =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager"

  const canChangeStatus =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    currentUser?.role === "agent"

  const handleAssign = async () => {
    if (!selectedUser) {
      setError("Please select a team member.")
      return
    }

    try {
      setActionLoading(true)
      setError("")

      const response = await api.patch(
        `/incidents/${incidentId}/assign`,
        {
          assigned_to: Number(selectedUser),
        }
      )

      setIncident(response.data)
      setSelectedUser("")

      triggerRefresh()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not assign incident."
      )
    } finally {
      setActionLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    try {
      setActionLoading(true)
      setError("")

      const response = await api.patch(
        `/incidents/${incidentId}/status`,
        {
          status: newStatus,
        }
      )

      setIncident(response.data)

      triggerRefresh()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not update incident status."
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleCommentAdded = () => {
    triggerRefresh()
  }

  const formatDate = (date) => {
    if (!date) return "—"

    return new Date(date).toLocaleString()
  }

  const formatStatus = (status) => {
    if (!status) return "—"

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  if (loading) {
    return (
      <div className="incident-details-page">
        <p>Loading incident...</p>
      </div>
    )
  }

  if (error && !incident) {
    return (
      <div className="incident-details-page">

        <button
          className="back-button"
          onClick={() => navigate("/incidents")}
        >
          ← Back to Incidents
        </button>

        <p>{error}</p>

      </div>
    )
  }

  if (!incident) {
    return null
  }

  return (
    <div className="incident-details-page">

      <button
        className="back-button"
        onClick={() => navigate("/incidents")}
      >
        ← Back to Incidents
      </button>

      <div className="incident-details-header">

        <div>
          <span className="ticket-number">
            {incident.ticket_number}
          </span>

          <h1>{incident.title}</h1>
        </div>

      </div>

      {error && (
        <div className="incident-error">
          {error}
        </div>
      )}

      <div className="incident-details-grid">

        <section className="incident-main-card">

          <h2>Description</h2>

          <p>
            {incident.description ||
              "No description provided."}
          </p>

        </section>


        <aside className="incident-side-card">

          <h2>Incident information</h2>

          {canAssign &&
            incident.status !== "closed" && (
              <div className="assignment-section">

                <label>
                  Assign incident
                </label>

                <div className="assignment-controls">

                  <select
                    value={selectedUser}
                    onChange={(event) =>
                      setSelectedUser(
                        event.target.value
                      )
                    }
                    disabled={actionLoading}
                  >

                    <option value="">
                      Select team member
                    </option>

                    {assignableUsers.map((user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name} ({user.role})
                      </option>
                    ))}

                  </select>

                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={
                      !selectedUser ||
                      actionLoading
                    }
                  >
                    Assign
                  </button>

                </div>

              </div>
            )}


          {canChangeStatus &&
            incident.status === "assigned" && (
              <button
                className="status-action-button"
                onClick={() =>
                  updateStatus("in_progress")
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Updating..."
                  : "Start Progress"}
              </button>
            )}


          {canChangeStatus &&
            incident.status === "in_progress" && (
              <button
                className="status-action-button"
                onClick={() =>
                  updateStatus("resolved")
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Updating..."
                  : "Resolve Incident"}
              </button>
            )}


          {canChangeStatus &&
            incident.status === "resolved" && (
              <button
                className="status-action-button"
                onClick={() =>
                  updateStatus("closed")
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Updating..."
                  : "Close Incident"}
              </button>
            )}


          <div className="incident-info-item">
            <span>Category</span>
            <strong>
              {incident.category || "—"}
            </strong>
          </div>

          <div className="incident-info-item">
            <span>Priority</span>
            <strong>
              {formatStatus(incident.priority)}
            </strong>
          </div>

          <div className="incident-info-item">
            <span>Status</span>
            <strong>
              {formatStatus(incident.status)}
            </strong>
          </div>

          <div className="incident-info-item">
            <span>Assigned to</span>
            <strong>
              {getUserName(incident.assigned_to)}
            </strong>
          </div>

          <div className="incident-info-item">
            <span>Created</span>
            <strong>
              {formatDate(incident.created_at)}
            </strong>
          </div>

        </aside>

      </div>


      <IncidentComments
        incidentId={incidentId}
        users={users}
        currentUserRole={currentUser?.role}
        onCommentAdded={handleCommentAdded}
      />


      <IncidentSLA
        incidentId={incidentId}
        refreshKey={refreshKey}
      />


      <IncidentHistory
        incidentId={incidentId}
        users={users}
        refreshKey={refreshKey}
      />

    </div>
  )
}

export default IncidentDetails