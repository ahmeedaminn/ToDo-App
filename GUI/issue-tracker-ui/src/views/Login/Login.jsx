import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- Grab the taxi driver from the right company!
import { apiFetch } from "../../api/fetch";
import "./Login.css";

import nmuLogo from "../../assets/nmu-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  // --- DYNAMIC TAB TITLE ---
  useEffect(() => {
    // This changes the text at the very top of the browser tab
    document.title = "Login | NMU Ticketing System";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const isEmail = identifier.includes("@");
    const payload = {
      password,
      ...(isEmail ? { email: identifier } : { username: identifier }),
    };

    try {
      const data = await apiFetch("/auth", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", data["x-auth-token"]);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="auth-page-wrapper">
      {/* LEFT: Solid Gradient Banner */}
      <aside className="auth-banner">
        <div className="banner-content">
          <h1>NMU Ticketing System</h1>
          <p>Streamline your university workflow.</p>
        </div>
      </aside>

      {/* RIGHT: Form Section */}
      <section className="auth-form-section">
        {/* The White Card */}
        <article className="auth-card">
          <header className="auth-card-header">
            {/* --- THE LOGO --- */}
            <img
              src={nmuLogo}
              alt="NMU University Logo"
              className="brand-logo"
            />

            <h2>User Login</h2>
            <p>Please enter your credentials to continue.</p>
          </header>

          {error && (
            <div className="error-message" role="alert">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="identifier">Email / Username</label>
              <input
                id="identifier"
                className="input-field"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <div className="password-header">
                <label htmlFor="password">Password</label>
                {/* Just a dummy console.log for now until the API is ready! */}
                <button
                  type="button"
                  className="btn-forgot"
                  onClick={() => console.log("Forgot Password Triggered")}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                className="input-field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-actions">
              {/* Type is 'submit' to trigger the form */}
              <button className="btn btn-primary" type="submit">
                Login
              </button>
              {/* Type is 'button' so it DOES NOT submit the login form when clicked! */}
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
};

export default Login;
