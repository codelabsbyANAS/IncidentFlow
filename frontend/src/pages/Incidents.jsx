import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "../api/api"
import "./Incidents.css"

const PAGE_SIZE = 5

function Incidents() {
  const navigate = useNavigate()

  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  // Create incident
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("medium")
  const [creating, setCreating] = useState(false)

  // Search + filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  // Pagination
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  const fetchIncidents = async (targetPage = page) => {
    try {
      setLoading(true)
      setError("")

      const params = {
        skip: (targetPage - 1) * PAGE_SIZE,

        // Fetch one extra record so we know
        // whether another page exists.
        limit: PAGE_SIZE + 1,
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      if (statusFilter) {
        params.status = statusFilter
      }

      if (priorityFilter) {
        params.priority = priorityFilter
      }

      const response = await api.get(
        "/incidents",
        { params }
      )

      const data = response.data

      setHasNext(data.length > PAGE_SIZE)
      setIncidents(data.slice(0, PAGE_SIZE))
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not load incidents."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Small delay prevents an API request
    // on every single keystroke.
    const timer = setTimeout(() => {
      fetchIncidents(page)
    }, 300)

    return () => clearTimeout(timer)
  }, [
    page,
    search,
    statusFilter,
    priorityFilter,
  ])

  const handleCreateIncident = async (event) => {
    event.preventDefault()

    if (!title.trim()) {
      setError("Incident title is required.")
      return
    }

    try {
      setCreating(true)
      setError("")
      setMessage("")

      await api.post("/incidents", {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        priority,
      })

      setTitle("")
      setDescription("")
      setCategory("")
      setPriority("medium")
      setShowForm(false)

      setMessage(
        "Incident created successfully."
      )

      // Newly created incidents are newest,
      // so return to page 1.
      if (page !== 1) {
        setPage(1)
      } else {
        await fetchIncidents(1)
      }
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not create incident."
      )
    } finally {
      setCreating(false)
    }
  }

  const handleResetFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPriorityFilter("")
    setPage(1)
  }

  const formatStatus = (value) => {
    if (!value) return "—"

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  const formatDate = (date) => {
    if (!date) return "—"

    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="incidents-page">

      {/* HEADER */}
      <div className="incidents-header">

        <div>
          <button
            className="back-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

          <h1>Incidents</h1>

          <p>
            Create, search and manage incident tickets.
          </p>
        </div>

        <button
          className="create-incident-button"
          onClick={() => {
            setShowForm(true)
            setError("")
            setMessage("")
          }}
        >
          + New Incident
        </button>

      </div>


      {/* SUCCESS / ERROR */}

      {message && (
        <div className="incidents-message">
          {message}
        </div>
      )}

      {error && (
        <div className="incidents-error">
          {error}
        </div>
      )}


      {/* CREATE INCIDENT FORM */}

      {showForm && (
        <div className="incident-form-card">

          <div className="incident-form-header">

            <h2>Create Incident</h2>

            <button
              type="button"
              className="close-form-button"
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>

          </div>

          <form onSubmit={handleCreateIncident}>

            <div className="incident-form-group">

              <label>Title</label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: Payment gateway issue"
                required
              />

            </div>


            <div className="incident-form-group">

              <label>Description</label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the incident..."
                rows="4"
              />

            </div>


            <div className="incident-form-row">

              <div className="incident-form-group">

                <label>Category</label>

                <input
                  type="text"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  placeholder="Example: Payments"
                />

              </div>


              <div className="incident-form-group">

                <label>Priority</label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
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

            </div>


            <div className="incident-form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-incident-button"
                disabled={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create Incident"}
              </button>

            </div>

          </form>

        </div>
      )}


      {/* SEARCH + FILTERS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(220px, 2fr) 1fr 1fr auto",
          gap: "12px",
          alignItems: "center",
          marginBottom: "20px",
          padding: "18px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
        }}
      >

        <input
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search ticket, title or category..."
          style={{
            height: "44px",
            padding: "0 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        />


        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
          style={{
            height: "44px",
            padding: "0 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            background: "white",
          }}
        >

          <option value="">
            All Statuses
          </option>

          <option value="open">
            Open
          </option>

          <option value="assigned">
            Assigned
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="resolved">
            Resolved
          </option>

          <option value="closed">
            Closed
          </option>

        </select>


        <select
          value={priorityFilter}
          onChange={(event) => {
            setPriorityFilter(
              event.target.value
            )
            setPage(1)
          }}
          style={{
            height: "44px",
            padding: "0 12px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            background: "white",
          }}
        >

          <option value="">
            All Priorities
          </option>

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


        <button
          type="button"
          onClick={handleResetFilters}
          style={{
            height: "44px",
            padding: "0 18px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            background: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Reset
        </button>

      </div>


      {/* INCIDENT TABLE */}

      {loading ? (
        <div className="incidents-message">
          Loading incidents...
        </div>
      ) : incidents.length === 0 ? (
        <div className="empty-incidents">

          <h3>No incidents found</h3>

          <p>
            Try changing your search or filters.
          </p>

        </div>
      ) : (
        <div className="incidents-table-container">

          <table className="incidents-table">

            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>

              {incidents.map((incident) => (
                <tr key={incident.id}>

                  <td>
                    <button
                      type="button"
                      className="ticket-link"
                      onClick={() =>
                        navigate(
                          `/incidents/${incident.id}`
                        )
                      }
                    >
                      {incident.ticket_number}
                    </button>
                  </td>

                  <td>
                    {incident.title}
                  </td>

                  <td>
                    {incident.category || "—"}
                  </td>

                  <td>
                    <span
                      className={`priority-badge ${incident.priority}`}
                    >
                      {formatStatus(
                        incident.priority
                      )}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${incident.status}`}
                    >
                      {formatStatus(
                        incident.status
                      )}
                    </span>
                  </td>

                  <td>
                    {formatDate(
                      incident.created_at
                    )}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}


      {/* PAGINATION */}

      {!loading && incidents.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "14px",
            marginTop: "22px",
          }}
        >

          <button
            type="button"
            disabled={page === 1}
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
            style={{
              padding: "9px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background:
                page === 1
                  ? "#f1f5f9"
                  : "white",
              cursor:
                page === 1
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            ← Previous
          </button>


          <strong>
            Page {page}
          </strong>


          <button
            type="button"
            disabled={!hasNext}
            onClick={() =>
              setPage((current) =>
                current + 1
              )
            }
            style={{
              padding: "9px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: !hasNext
                ? "#f1f5f9"
                : "white",
              cursor: !hasNext
                ? "not-allowed"
                : "pointer",
            }}
          >
            Next →
          </button>

        </div>
      )}

    </div>
  )
}

export default Incidents