import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/api"
import "./Team.css"

function Team() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("agent")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdUser, setCreatedUser] = useState(null)

  const handleCreateUser = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError("")
    setCreatedUser(null)

    try {
      const response = await api.post("/users", {
        name,
        email,
        password,
        role,
      })

      setCreatedUser(response.data)

      setName("")
      setEmail("")
      setPassword("")
      setRole("agent")
    } catch (err) {
      console.error(err)

      const detail = err.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
         detail
           .map((item) => item.msg)
           .join(", ")
        )
      } else if (typeof detail === "string") {
        setError(detail)
      } else {
        setError("Could not create team member.")
      }
    
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="team-page">

      <button
        className="team-back-button"
        onClick={() => navigate("/dashboard")}
      >
        ← Dashboard
      </button>

      <div className="team-header">
        <div>
          <h1>Team</h1>
          <p>
            Add people to your IncidentFlow organization.
          </p>
        </div>
      </div>

      <div className="team-card">

        <h2>Add team member</h2>

        <form onSubmit={handleCreateUser}>

          <div className="team-form-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="team-form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="rahul@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="team-form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Create temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="team-form-group">
            <label>Role</label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="agent">Agent</option>
              <option value="manager">Manager</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          {error && (
            <div className="team-error">
              {error}
            </div>
          )}

          {createdUser && (
            <div className="team-success">
              <strong>Team member created successfully.</strong>

              <p>
                ID: {createdUser.id}
              </p>

              <p>
                {createdUser.name} — {createdUser.role}
              </p>

              <p>{createdUser.email}</p>
            </div>
          )}

          <button
            className="team-create-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Add Team Member"}
          </button>

        </form>

      </div>

    </div>
  )
}

export default Team