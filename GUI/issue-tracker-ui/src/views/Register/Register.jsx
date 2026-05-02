import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userServices } from "../../api/userServices";
import "./Register.css";

const Register = () => {
  // 1. Form State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE"); // Default role
  // 2. System State
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // The Taxi Driver

  useEffect(() => {
    document.title = "Register - NMU Ticketing System";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // 1. FRONTEND VALIDATION: Check passwords before talking to the server
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return; // Stop the function here!
    }

    try {
      const createUser = await userServices.createUser({
        username,
        email,
        password,
        role,
      });

      localStorage.setItem("token", createUser["x-auth-token"]); // VIP Pass for the Dashboard

      if (localStorage.getItem("token")) {
        navigate("/dashboard"); // Take them to the Dashboard
      } else {
        setError(
          "Registration successful, but no token received. Please log in.",
        );
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // <main> tells the browser this is the primary content of the page
    <main className="register-page-wrapper">
      {/* <section> wraps a distinct thematic block of content */}
      <section className="auth-card">
        {/* <header> introduces the section */}
        <header className="auth-header">
          <h2>Create an Account</h2>
          <p>Join the NMU Ticketing System</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="auth-form"
          aria-label="Registration Form"
        >
          {/* aria-live ensures screen readers announce errors immediately */}
          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              ⚠️ {error}
            </div>
          )}

          <div className="input-group">
            {/* Semantics: Always link <label htmlFor> to the <input id> */}
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              placeholder="e.g., ahmed.cs"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">University Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="student@nmu.edu.eg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-confirm-password">Confirm Password</label>
            <input
              id="reg-confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="reg-role">Role</label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="PROFESSOR">Professor</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
            </select>
          </div>

          <button type="submit" className="btn-primary auth-submit">
            Register Account
          </button>
        </form>

        {/* <footer> wraps the concluding elements of the section */}
        <footer className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </footer>
      </section>
    </main>
  );
};

export default Register;
