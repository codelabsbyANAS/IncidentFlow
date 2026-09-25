import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import api from "../api/api"
import "./AutomationRules.css"

function AutomationRules() {
  const [rules, setRules] = useState([])
  const [users, setUsers] = useState([])

  const [name, setName] = useState("")
  const [priority, setPriority] = useState("")
  const [category, setCategory] = useState("")
  const [assignToUserId, setAssignToUserId] = useState("")
  const [isActive, setIsActive] = useState(true)

  const [editingRule, setEditingRule] = useState(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchRules = async () => {
    try {
      const response = await api.get(
        "/automation-rules"
      )

      setRules(response.data)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not load automation rules."
      )
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get(
        "/users/directory"
      )

      const assignableUsers = response.data.filter(
        (user) =>
          user.role === "agent" ||
          user.role === "manager"
      )

      setUsers(assignableUsers)
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not load assignable users."
      )
    }
  }

  useEffect(() => {
    fetchRules()
    fetchUsers()
  }, [])

  const resetForm = () => {
    setName("")
    setPriority("")
    setCategory("")
    setAssignToUserId("")
    setIsActive(true)

    setEditingRule(null)
    setError("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setMessage("")
    setError("")

    if (!name.trim()) {
      setError("Rule name is required.")
      return
    }

    if (!assignToUserId) {
      setError(
        "Please select an agent or manager."
      )
      return
    }

    const payload = {
      name: name.trim(),

      priority:
        priority === ""
          ? null
          : priority,

      category:
        category.trim() === ""
          ? null
          : category.trim(),

      assign_to_user_id:
        Number(assignToUserId),

      is_active: isActive,
    }

    setLoading(true)

    try {
      if (editingRule) {
        await api.patch(
          `/automation-rules/${editingRule.id}`,
          payload
        )

        setMessage(
          "Automation rule updated successfully."
        )
      } else {
        await api.post(
          "/automation-rules",
          payload
        )

        setMessage(
          "Automation rule created successfully."
        )
      }

      resetForm()

      await fetchRules()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not save automation rule."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rule) => {
    setEditingRule(rule)

    setName(rule.name || "")
    setPriority(rule.priority || "")
    setCategory(rule.category || "")

    setAssignToUserId(
      rule.assign_to_user_id
        ? String(rule.assign_to_user_id)
        : ""
    )

    setIsActive(rule.is_active)

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

  const handleDelete = async (rule) => {
    const confirmed = window.confirm(
      `Delete automation rule "${rule.name}"?`
    )

    if (!confirmed) {
      return
    }

    setMessage("")
    setError("")

    try {
      await api.delete(
        `/automation-rules/${rule.id}`
      )

      if (
        editingRule &&
        editingRule.id === rule.id
      ) {
        resetForm()
      }

      setMessage(
        "Automation rule deleted successfully."
      )

      await fetchRules()
    } catch (err) {
      console.error(err)

      setError(
        err.response?.data?.detail ||
          "Could not delete automation rule."
      )
    }
  }

  const formatValue = (value) => {
    if (!value) {
      return "Any"
    }

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    )
  }

  const getUserName = (userId) => {
    const user = users.find(
      (item) => item.id === userId
    )

    if (!user) {
      return `User #${userId}`
    }

    return (
      user.name ||
      user.full_name ||
      user.email ||
      `User #${user.id}`
    )
  }

  const activeRuleCount = rules.filter(
    (rule) => rule.is_active
  ).length

  return (
    <div className="automation-page">

      <div className="automation-glow automation-glow-one" />
      <div className="automation-glow automation-glow-two" />

      <div className="automation-shell">

        <div className="automation-back">
          <Link to="/dashboard">
            <span className="automation-back-icon">
              ←
            </span>
            Dashboard
          </Link>
        </div>


        {/* =============================================
            HERO
        ============================================== */}

        <section className="automation-hero">

          <div className="automation-hero-copy">

            <div className="automation-title-row">

              <div className="automation-title-icon">
                ⇄
              </div>

              <div>
                <p className="automation-eyebrow">
                  INTELLIGENT ROUTING
                </p>

                <h1>
                  Automation Rules
                </h1>

                <p>
                  Automatically route incidents using priority,
                  category and assignment rules.
                </p>
              </div>

            </div>

          </div>


          <div className="automation-hero-stats">

            <div className="automation-hero-stat">
              <span>Total Rules</span>
              <strong>{rules.length}</strong>
            </div>

            <div className="automation-hero-stat">
              <span>Active</span>
              <strong>{activeRuleCount}</strong>
            </div>

          </div>

        </section>


        {/* =============================================
            MAIN LAYOUT
        ============================================== */}

        <div className="automation-layout">

          {/* ---------------------------------------------
              CREATE / EDIT RULE
          ---------------------------------------------- */}

          <section className="automation-form-card">

            <div className="automation-card-heading">

              <div className="automation-card-heading-icon">
                {editingRule ? "✎" : "+"}
              </div>

              <div>
                <span className="automation-card-kicker">
                  {editingRule
                    ? "EDIT RULE"
                    : "NEW RULE"}
                </span>

                <h2>
                  {editingRule
                    ? "Edit Automation Rule"
                    : "Create Automation Rule"}
                </h2>
              </div>

            </div>


            <p className="automation-description">
              Configure how matching incidents should be routed
              to an agent or manager.
            </p>


            {editingRule && (
              <div className="automation-editing-message">
                <span className="automation-message-icon">
                  ✎
                </span>

                <span>
                  Editing{" "}
                  <strong>
                    {editingRule.name}
                  </strong>
                </span>
              </div>
            )}


            {message && (
              <div className="automation-success-message">
                <span className="automation-message-icon">
                  ✓
                </span>
                {message}
              </div>
            )}


            {error && (
              <div className="automation-error-message">
                <span className="automation-message-icon">
                  !
                </span>
                {error}
              </div>
            )}


            <form onSubmit={handleSubmit}>

              <div className="automation-form-group">

                <label>
                  Rule name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Example: Critical incident routing"
                  minLength="2"
                  maxLength="150"
                  required
                />

              </div>


              <div className="automation-form-row">

                <div className="automation-form-group">

                  <label>
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value)
                    }
                  >

                    <option value="">
                      Any priority
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


                <div className="automation-form-group">

                  <label>
                    Category
                  </label>

                  <input
                    type="text"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    placeholder="Example: payments"
                    maxLength="100"
                  />

                  <small>
                    Leave blank to match any category.
                  </small>

                </div>

              </div>


              <div className="automation-form-group">

                <label>
                  Assign to
                </label>

                <select
                  value={assignToUserId}
                  onChange={(event) =>
                    setAssignToUserId(
                      event.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    Select agent or manager
                  </option>

                  {users.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {
                        user.name ||
                        user.full_name ||
                        user.email
                      }
                      {" — "}
                      {formatValue(user.role)}
                    </option>
                  ))}

                </select>

              </div>


              <div className="automation-checkbox-card">

                <div>
                  <strong>
                    Rule status
                  </strong>

                  <span>
                    Active rules are used when new incidents are created.
                  </span>
                </div>

                <label className="automation-switch">

                  <input
                    id="automation-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(
                        event.target.checked
                      )
                    }
                  />

                  <span className="automation-switch-track">
                    <span className="automation-switch-thumb" />
                  </span>

                </label>

              </div>


              <button
                type="submit"
                className="automation-submit-button"
                disabled={loading}
              >
                <span className="automation-submit-icon">
                  {editingRule ? "✓" : "+"}
                </span>

                {loading
                  ? "Saving..."
                  : editingRule
                    ? "Save Changes"
                    : "Create Rule"}
              </button>


              {editingRule && (
                <button
                  type="button"
                  className="automation-cancel-button"
                  onClick={handleCancelEdit}
                >
                  Cancel editing
                </button>
              )}

            </form>

          </section>


          {/* ---------------------------------------------
              EXISTING RULES
          ---------------------------------------------- */}

          <section className="automation-rules-card">

            <div className="automation-rules-header">

              <div>
                <span className="automation-card-kicker">
                  CURRENT CONFIGURATION
                </span>

                <h2>
                  Routing rules
                </h2>

                <p>
                  Rules are evaluated from most specific to least specific
                  when an incident is created.
                </p>
              </div>

              <span className="automation-rule-count">
                {rules.length} configured
              </span>

            </div>


            <div className="automation-match-order">

              <span className="automation-match-label">
                MATCH ORDER
              </span>

              <div className="automation-match-pills">

                <span>
                  1
                  <strong>
                    Priority + Category
                  </strong>
                </span>

                <span>
                  2
                  <strong>
                    Category
                  </strong>
                </span>

                <span>
                  3
                  <strong>
                    Priority
                  </strong>
                </span>

                <span>
                  4
                  <strong>
                    Catch-all
                  </strong>
                </span>

              </div>

            </div>


            {rules.length === 0 ? (

              <div className="automation-empty">

                <div className="automation-empty-icon">
                  ⇄
                </div>

                <h3>
                  No automation rules configured
                </h3>

                <p>
                  Create your first routing rule using the form.
                </p>

              </div>

            ) : (

              <div className="automation-rule-list">

                {rules.map((rule) => (

                  <article
                    className={`automation-rule-item ${
                      rule.is_active
                        ? "rule-active"
                        : "rule-inactive"
                    }`}
                    key={rule.id}
                  >

                    <div className="automation-rule-header">

                      <div className="automation-rule-title-wrap">

                        <div className="automation-rule-icon">
                          ⇄
                        </div>

                        <div>

                          <span className="automation-rule-label">
                            ROUTING RULE
                          </span>

                          <h3>
                            {rule.name}
                          </h3>

                          <span
                            className={
                              rule.is_active
                                ? "automation-active-badge"
                                : "automation-inactive-badge"
                            }
                          >
                            <span className="automation-badge-dot" />

                            {rule.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </div>

                      </div>


                      <div className="automation-rule-actions">

                        <button
                          type="button"
                          className="automation-edit-button"
                          onClick={() =>
                            handleEdit(rule)
                          }
                        >
                          Edit
                        </button>


                        <button
                          type="button"
                          className="automation-delete-button"
                          onClick={() =>
                            handleDelete(rule)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>


                    <div className="automation-rule-details">

                      <div className="automation-rule-detail">

                        <span>
                          Priority
                        </span>

                        <strong>
                          {formatValue(
                            rule.priority
                          )}
                        </strong>

                      </div>


                      <div className="automation-rule-detail">

                        <span>
                          Category
                        </span>

                        <strong>
                          {formatValue(
                            rule.category
                          )}
                        </strong>

                      </div>


                      <div className="automation-rule-detail">

                        <span>
                          Assign to
                        </span>

                        <strong>
                          {getUserName(
                            rule.assign_to_user_id
                          )}
                        </strong>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>

        </div>

      </div>

    </div>
  )
}

export default AutomationRules
