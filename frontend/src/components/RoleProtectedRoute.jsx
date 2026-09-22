import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

import api from "../api/api"

function RoleProtectedRoute({
  allowedRoles,
  children,
}) {
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [authFailed, setAuthFailed] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await api.get("/auth/me")

        setUserRole(response.data.role)
      } catch (err) {
        console.error(err)
        setAuthFailed(true)
      } finally {
        setLoading(false)
      }
    }

    checkRole()
  }, [])

  if (loading) {
    return <p>Checking permissions...</p>
  }

  if (authFailed) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}

export default RoleProtectedRoute