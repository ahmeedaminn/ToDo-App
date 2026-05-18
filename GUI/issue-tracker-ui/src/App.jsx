import Login from "./views/Login/Login";
import Dashboard from "./views/Dashboard/Dashboard";
import Register from "./views/Register/Register";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,

} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/:taskId" element={
            <ProtectedRoute>

              <Dashboard />
            </ProtectedRoute>
          } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
