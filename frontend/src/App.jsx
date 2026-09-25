import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import Incidents from "./pages/Incidents"
import IncidentDetails from "./pages/IncidentDetails"
import Team from "./pages/Team"
import Notifications from "./pages/Notifications"
import SLAPolicies from "./pages/SLAPolicies"
import AutomationRules from "./pages/AutomationRules"

import ProtectedRoute from "./components/ProtectedRoute"
import RoleProtectedRoute from "./components/RoleProtectedRoute"

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public routes */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* Incidents */}

        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <Incidents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/incidents/:incidentId"
          element={
            <ProtectedRoute>
              <IncidentDetails />
            </ProtectedRoute>
          }
        />


        {/* Notifications */}

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />


        {/* Team - ADMIN ONLY */}

        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={["admin"]}
              >
                <Team />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* SLA Policies - ADMIN + MANAGER */}

        <Route
          path="/sla-policies"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "admin",
                  "manager",
                ]}
              >
                <SLAPolicies />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* Automation Rules - ADMIN + MANAGER */}

        <Route
          path="/automation-rules"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute
                allowedRoles={[
                  "admin",
                  "manager",
                ]}
              >
                <AutomationRules />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />


        {/* Default */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* Unknown route */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App