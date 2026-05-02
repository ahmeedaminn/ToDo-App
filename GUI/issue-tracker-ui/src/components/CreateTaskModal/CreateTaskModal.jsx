import { useState, useEffect } from "react";
import { taskServices } from "../../api/taskServices";
import { userServices } from "../../api/userServices";
import Select  from "react-select";
import "./CreateTaskModal.css";

const CreateTaskModal = ({ onClose, onSuccess }) => {
  // --- STATE ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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

  // --- THE DIVIDE & CONQUER SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);

      // Step 1: Fire the JSON endpoint to create the record
      const newTaskData = {
        title,
        description,
        priority,
        // Only send if they actually selected something
        assigneeId: assigneeId ? assigneeId : undefined,
        dueDate: dueDate ? dueDate : undefined,
      };

      const createdTask = await taskServices.createTask(newTaskData);

      if (file) {
        try {
          await taskServices.resolveTask(createdTask.id, file, null);
        } catch (uploadError) {
          // The Rollback
          // The upload failed. We must delete the orphan task from Postgres!
          await taskServices.deleteTask(createdTask.id);

          // Throw the error so the outer catch block displays it to the user
          throw new Error(
            "File upload failed. The task creation was cancelled.",
          );
        }
      }

      // Step 3: Success! Tell the Dashboard to refresh the list, then close the modal.
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create task.");
      setIsSubmitting(false);
    }
  };

  // 2. Filter the assignees BEFORE mapping them
  const filteredAssignees = assignees.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const roleFriendly = user.role.replace("_", " ").toLowerCase();

    // Search by username OR role
    if (!searchLower) return true; // If search is empty, show all
    return (
      user.username.toLowerCase().includes(searchLower) ||
      roleFriendly.includes(searchLower)
    );
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <header className="modal-header">
          <h2>Create New Ticket</h2>
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

              {/*
                react-select is being used here instead of a native <select>.
                It expects an array of option objects shaped like { value, label }.
                - options: the list of choices shown in the dropdown
                - value: the currently selected object from that list
                - onChange: receives the selected object (or null when cleared)
              */}
              <Select
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select or search assignee..."
                isClearable={true}
                isSearchable={true} // allows typing to filter options in the dropdown
                options={assignees.map((user) => ({
                  value: user.id,
                  label: `${user.username} (${user.role.replace("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())})`,
                }))}
                value={
                  assigneeId
                    ? {
                        value: assigneeId,
                        label: assignees.find((u) => u.id === assigneeId)?.username || "Unknown",
                      }
                    : null
                }
                // react-select sends the selected object instead of a native event.
                onChange={(selectedOption) => {
                  setAssigneeId(selectedOption ? selectedOption.value : "");
                }}
              />
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

          {/* Full Width File Upload */}
          <div className="input-group full-width attachment-group">
            <label>Attachment (Optional)</label>
            {/* <input type="file"> tag is designed to handle multiple files (if you add the multiple attribute). Because of this, the browser always returns an array of files, even if the user only selected one.
            we just choose just the first item in this array as our current logic */}
            <input
              type="file"
              className="file-input"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,image/*,.doc,.docx" // Matches your Multer limits
            />
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
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
