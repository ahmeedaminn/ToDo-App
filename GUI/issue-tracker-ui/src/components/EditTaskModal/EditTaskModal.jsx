import { useState, useEffect } from "react";
import { taskServices } from "../../api/taskServices";
import { userServices } from "../../api/userServices";
import "./EditTaskModal.css"; // We can completely reuse the exact same CSS file!

const EditTaskModal = ({ task, onClose, onSuccess }) => {
  // --- UTILITY: Format Date ---
  // HTML <input type="date"> requires the exact format "YYYY-MM-DD"
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; 
  };

  // --- STATE (Pre-filled with task data) ---
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(formatDateForInput(task.dueDate));
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");

  const [assignees, setAssignees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // --- FETCH ASSIGNEES ON MOUNT ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userServices.getAssignees();
        setAssignees(users);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchUsers();
  }, []);

  // --- THE UPDATE LOGIC ---
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      // Package the updated data
      const updatedData = {
        title,
        description,
        priority,
        // If they changed it to "-- Unassigned --", send null to clear it in Postgres
        assigneeId: assigneeId ? assigneeId : null, 
        dueDate: dueDate ? dueDate : null,
      };

      // Fire the PUT/PATCH endpoint
      // Ensure you have an updateTask function in your taskServices!
      const updatedTask = await taskServices.updateDetails(task.id, updatedData);

      // Tell Dashboard to refresh, passing the new task data if needed, then close.
      onSuccess(updatedTask); 
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update task.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <header className="modal-header">
          <h2>Edit Ticket #{task.id.slice(0, 8)}</h2>
          <button
            className="btn-close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">⚠️ {error}</div>}

          {/* Full Width */}
          <div className="input-group full-width">
            <label>Title</label>
            <input
              type="text"
              className="input-field"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="input-group full-width">
            <label>Description</label>
            <textarea
              className="input-field textarea"
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 2-Column Grid Area */}
          <div className="form-grid">
            <div className="input-group">
              <label>Priority</label>
              <select
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="input-group">
              <label>Assignee (Optional)</label>
              <select
                className="input-field"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">-- Unassigned --</option>
                {assignees.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Due Date (Optional)</label>
              <input
                type="date"
                className="input-field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <footer className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;