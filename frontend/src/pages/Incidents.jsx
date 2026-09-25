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

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("medium")
  const [creating, setCreating] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")

  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  const fetchIncidents = async (targetPage = page) => {
    try {
      setLoading(true)
      setError("")

      const params = {
        skip: (targetPage - 1) * PAGE_SIZE,
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

      <div className="incidents-page-glow incidents-page-glow-one" />
      <div className="incidents-page-glow incidents-page-glow-two" />

      <div className="incidents-shell">

        <header className="incidents-header">

          <div className="incidents-heading-group">

            <button
              className="back-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <span className="back-button-icon">
                ←
              </span>
              Dashboard
            </button>

            <div className="incidents-title-row">

              <div className="incidents-title-icon">
                !
              </div>

              <div>
                <p className="incidents-eyebrow">
                  SERVICE OPERATIONS
                </p>

                <h1>
                  Incidents
                </h1>

                <p>
                  Create, search and manage incident tickets.
                </p>
              </div>

            </div>

          </div>

          <button
            className="create-incident-button"
            onClick={() => {
              setShowForm(true)
              setError("")
              setMessage("")
            }}
          >
            <span className="create-button-icon">
              +
            </span>
            New Incident
          </button>

        </header>

        {message && (
          <div className="incidents-message incidents-success">
            <span className="feedback-icon">
              ✓
            </span>

            <span>
              {message}
            </span>
          </div>
        )}

        {error && (
          <div className="incidents-error">
            <span className="feedback-icon">
              !
            </span>

            <span>
              {error}
            </span>
          </div>
        )}

        {showForm && (
          <section className="incident-form-card">

            <div className="incident-form-header">

              <div>
                <span className="form-kicker">
                  NEW INCIDENT
                </span>

                <h2>
                  Create Incident
                </h2>

                <p>
                  Add the incident details and set an initial priority.
                </p>
              </div>

              <button
                type="button"
                className="close-form-button"
                onClick={() =>
                  setShowForm(false)
                }
                aria-label="Close incident form"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreateIncident}>

              <div className="incident-form-group">

                <label>
                  Title
                </label>

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

                <label>
                  Description
                </label>

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

                  <label>
                    Category
                  </label>

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

                  <label>
                    Priority
                  </label>

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
                  className="create-incident-button form-submit-button"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create Incident"}
                </button>

              </div>

            </form>

          </section>
        )}

        <section className="incident-toolbar">

          <div className="incident-toolbar-heading">

            <div>
              <p className="toolbar-kicker">
                INCIDENT QUEUE
              </p>

              <h2>
                Find and filter tickets
              </h2>
            </div>

            <span className="toolbar-page-pill">
              Page {page}
            </span>

          </div>

          <div className="incident-filters">

            <div className="search-field">

              <span className="search-field-icon">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search ticket, title or category..."
              />

            </div>

            <div className="select-field">

              <span className="filter-label">
                Status
              </span>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
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

            </div>

            <div className="select-field">

              <span className="filter-label">
                Priority
              </span>

              <select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(
                    event.target.value
                  )
                  setPage(1)
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

            </div>

            <button
              type="button"
              className="reset-filters-button"
              onClick={handleResetFilters}
            >
              Reset
            </button>

          </div>

        </section>

        {loading ? (
          <div className="incidents-message loading-card">

            <div className="loading-dot" />

            Loading incidents...

          </div>
        ) : incidents.length === 0 ? (
          <div className="empty-incidents">

            <div className="empty-icon">
              !
            </div>

            <h3>
              No incidents found
            </h3>

            <p>
              Try changing your search or filters.
            </p>

          </div>
        ) : (
          <section className="incidents-table-container">

            <div className="table-card-header">

              <div>
                <p className="table-card-kicker">
                  CURRENT RESULTS
                </p>

                <h2>
                  Incident queue
                </h2>
              </div>

              <span className="result-count-pill">
                {incidents.length} shown
              </span>

            </div>

            <div className="incidents-table-scroll">

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

                      <td className="incident-title-cell">
                        {incident.title}
                      </td>

                      <td>
                        <span className="category-value">
                          {incident.category || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`priority-badge ${incident.priority}`}
                        >
                          <span className="badge-dot" />
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

                      <td className="created-date-cell">
                        {formatDate(
                          incident.created_at
                        )}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {!loading && incidents.length > 0 && (
          <div className="pagination-row">

            <button
              type="button"
              className="pagination-button"
              disabled={page === 1}
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1)
                )
              }
            >
              ← Previous
            </button>

            <span className="pagination-current">
              Page {page}
            </span>

            <button
              type="button"
              className="pagination-button"
              disabled={!hasNext}
              onClick={() =>
                setPage((current) =>
                  current + 1
                )
              }
            >
              Next →
            </button>

          </div>
        )}

      </div>

    </div>
  )
}

export default Incidents
