import { useState, useEffect, useRef } from "react";
import { taskServices } from "../../api/taskServices";
import CreateTaskModal from "../../components/CreateTaskModal/CreateTaskModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import EditTaskModal from "../../components/EditTaskModal/EditTaskModal";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  // 1. Start with an empty array. No fake data!
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [error, setError] = useState(null);
  // NEW: State for our Tabs
  const [activeTab, setActiveTab] = useState("assigned"); // defaults to "assigned"
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isEditingResolution, setIsEditingResolution] = useState(false);

  // get the id from the payload then extract the id from and setCurrentId to this id extracted.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // payload contains 3 pieces of info: header, payload, signature
      // we want the payload, which is the middle part, so we split by "." and take the second item (index 1)
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);
    } catch (err) {
      console.error("Failed to decode token.");
    }
  }, []);

  useEffect(() => {
    if (selectedTask) {
      document.title = `${selectedTask.title} | NMU Ticketing System`;
    } else {
      document.title = "Dashboard | NMU Ticketing System";
    }
  }, [selectedTask]);

  // 2. The Auto-Trigger: Fetch data when Dashboard loads
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await taskServices.getAllTasks();

        setTasks(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAll();
  }, []); // <-- This empty array is crucial! It tells React "Only run this ONCE when the page loads."

  // 1. (Opens the modal)
  const handleDeleteClick = () => {
    setTaskToDelete(selectedTask);
  };

  const executeDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);

    try {
      // 2. Send the specific ID to your Express backend
      await taskServices.deleteTask(selectedTask.id);

      // 3. Instantly remove it from the React state (the Sidebar)
      // We filter the array, keeping only tasks whose ID does NOT match the deleted one.

      setTasks(tasks.filter((task) => task.id !== selectedTask.id));

      // Close the modal and clear the main stage
      setTaskToDelete(null);
      setSelectedTask(null);
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete the ticket.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleDownloadClick = async (type) => {
    try {
      // 1. Fetch the temporary presigned URL from your backend
      const urls = await taskServices.getDownloadUrl(selectedTask.id);

      // Grabs either urls.creator or urls.assignee
      const targetUrl = urls[type];
      if (!targetUrl) return

      // 2. Create a temporary, invisible link element
      const link = document.createElement("a");
      link.href = targetUrl;

      // 3. set attributes to force download in a new tab safely.
      link.setAttribute("target", "_blank");
      link.setAttribute("download", true);

      // 4. Attach it to the page, click it, and instantly remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(urls);
    } catch (err) {
      console.error("Failed to download attachment:", err);
      // Optional: Set your error state here so the user knows it failed
      // setError("Failed to fetch the download link.");
    }
  };

  const handleDeleteAttachment = async () => {
    try {
      await taskServices.removeFile(selectedTask.id);

      // If it succeeds, you should also update the selectedTask
      // state here so the attachment UI disappears!

      // 2. Update the Main Stage: Strip the attachment URL from the currently selected task
      const updatedTask = { ...selectedTask };
      if (isCreator) updatedTask.creatorAttachment = null;
      if (isAssignee) updatedTask.assigneeAttachment = null;
      setSelectedTask(updatedTask);

      // 3. Update the Sidebar/Master List: Ensure it stays gone if you click away and come back
      setTasks(
        tasks.map((task) => (task.id === selectedTask.id ? updatedTask : task)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    try {
      // 1. Fire the PATCH endpoint to update PostgreSQL
      await taskServices.updateDetails(selectedTask.id, { status: newStatus });

      // 2. update the Main Stage (so the dropdown stays on the new value)
      setSelectedTask({ ...selectedTask, status: newStatus });

      // 3. update the sidebar list (so the dot color changes instantly)
      setTasks(
        tasks.map((task) =>
          task.id === selectedTask.id ? { ...task, status: newStatus } : task,
        ),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update the ticket status.");
    }
  };

  // 1. This function is attached to your visible Button
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    // 1. Grab the raw file object
    const file = event.target.files[0];
    if (!file) return; // User canceled the file browser

    setIsUploading(true);

    try {
      // The Professor only sends a file, no text notes
      const updatedTask = await taskServices.resolveTask(selectedTask.id, file, null);

      // Update the UI immediately so the download/delete buttons appear
      setSelectedTask(updatedTask);

      setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (err) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      // Reset the input so the user can upload the same file again if they deleted it
      e.target.value = null;
    }
  };

  // --- NEW: Assignee Submits Resolution ---
  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // The Assignee sends text, and OPTIONALLY a file
      const file = e.target.elements.resolutionFile.files[0];
      // If they deleted all text, send null so it clears the database
      const finalNotes = resolutionNotes.trim() === "" ? null : resolutionNotes;

      // Prevent submitting if BOTH are completely empty
      if (!file && !finalNotes) {
        setError("You must provide either a file or a note to resolve the ticket.");
        setIsUploading(false);
        return;
      }

      let updatedTask
      // 1. Update the resolution notes and files
      updatedTask = await taskServices.resolveTask(selectedTask.id, file, finalNotes);

      // 2. Instantly update the status based on what the user just did
      updatedTask = await taskServices.updateDetails(selectedTask.id, { status: "COMPLETED" });

      setSelectedTask(updatedTask);
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));

      // THE FIX: Reset everything so ghost data doesn't linger!S
      setIsEditingResolution(false);
      e.target.reset(); // Clears the form inputs, including the file input and the textarea
    } catch (err) {
      setError(err.message || "Failed to submit resolution.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- EDIT SUCCESS HANDLER ---
  const handleEditSuccess = (updatedTaskFromBackend) => {
    // 1. Update the Master List in the sidebar
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === updatedTaskFromBackend.id ? updatedTaskFromBackend : t,
      ),
    );

    // 2. Update the Main Stage instantly so the UI feels fast
    setSelectedTask(updatedTaskFromBackend);
  };

  // here we filter the tasks based on the active tab and the current user's ID
  // if the active tab is assigned, we filter and get only tasks where the assigneeId is me (currentUserId)
  // if the active tab is created, we filter and get only tasks where the creatorId is me (currentUserId)
  // if the active tab is "all", we skip filtering and show everything
  const filteredTasks = tasks
    .filter((task) => {
      // FUNNEL 1: Filter by the active tab
      if (activeTab === "assigned") return task.assigneeId === currentUserId;
      else if (activeTab === "created") return task.creatorId === currentUserId;
      return true; // For "all" tab, we don't filter anything out
    })
    .filter((task) => {
      // FUNNEL 2: Filter by the search term
      return (
        // If the search bar is empty, includes("") is always true, so it changes nothing!
        searchTerm === "" ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  // It turns "2026-04-25T15:00:00Z" into "Apr 25, 2026"
  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if the logged-in user is the creator of the currently selected task
  // this is called RBAC: Role-Based Access Control. We can use this boolean to conditionally render certain buttons or features that only the creator should see.
  const isCreator = selectedTask?.creatorId === currentUserId;
  const isAssignee = selectedTask?.assigneeId === currentUserId;

  return (
    <div>
      <main className="dashboard-layout">
        {/* --- LEFT SIDEBAR (Master List) --- */}
        <aside className="sidebar">
          <header className="sidebar-header">
            <div>
              <h2>Ticketing System</h2>
              <p className="sidebar-subtitle">Dashboard</p>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </header>

          {/* --- TABS switch --- */}
          <div className="tab-container">
            <button
              className={`tab-btn ${activeTab === "assigned" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("assigned");
                setSelectedTask(null);
              }} // Clear the selected task when switching tabs to avoid confusion
            >
              Assigned to Me
            </button>
            <button
              className={`tab-btn ${activeTab === "created" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("created");
                setSelectedTask(null);
              }} // Clear the selected task when switching tabs to avoid confusion
            >
              Created by Me
            </button>
          </div>

          <div className="ticket-list">
            {error && <div className="error-message">⚠️ {error}</div>}

            <div className="search-tab">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="side-bar-search-tab"
              />
            </div>

            {filteredTasks.length === 0 && !error ? (
              <p className="no-tasks-msg">No tasks found in this tab.</p>
            ) : (
              filteredTasks.map((task) => (
                <article
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`ticket-card ${task.id === selectedTask?.id ? "active" : ""}`}
                >
                  <div className="ticket-card-header">
                    <h4>{task.title}</h4>
                    <span
                      className={`status-dot ${task.status.toLowerCase()}`}
                    ></span>
                  </div>
                  <p className="ticket-card-preview">
                    {/* Show just a snippet of the description */}
                    {task.description?.substring(0, 30)}...
                  </p>
                  <div className="ticket-card-footer">
                    <small>
                      {activeTab === "assigned"
                        ? `From ${task.creator?.username || "Unknown"}`
                        : `To ${task.assignee?.username || "Unassigned"}`}
                    </small>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Placeholder for future pagination */}
          {/* <div className="pagination-controls">...</div> */}
        </aside>

        {/* Main content area */}
        <main className="main-stage">
          {!selectedTask ? (
            <div className="empty-state">
              <div className="empty-state-content">
                <h3>No Ticket Selected</h3>
                <p>👈 Select a ticket from the sidebar to view details</p>
              </div>
            </div>
          ) : (
            <article className="ticket-details">
              {/* 1. HEADER & STATUS DROPDOWN */}
              <header className="ticket-header-group">
                <div className="title-row">
                  <h1>{selectedTask.title}</h1>

                  {isAssignee ? (
                    <select
                      className={`status-select ${selectedTask.status.toLowerCase()}`}
                      value={selectedTask.status}
                      onChange={handleStatusChange}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  ) : (
                    <span
                      className={`status-badge ${selectedTask.status.toLowerCase()}`}
                    >
                      {selectedTask.status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <p className="ticket-meta">Ticket ID: #{selectedTask.id}</p>
              </header>

              {/* 2. THE DATA GRID */}
              <div className="ticket-info-grid">
                <div className="info-item">
                  <span className="info-label">Assignee: </span>
                  <span className="info-value">
                    {selectedTask.assignee?.username || "Unassigned"}
                    {selectedTask.assigneeId && (
                      <small> ({selectedTask.assigneeId})</small>
                    )}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Priority: </span>
                  <span
                    className={`priority-text ${selectedTask.priority?.toLowerCase()}`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Due Date: </span>
                  <span className="info-value">
                    {formatDate(selectedTask.dueDate)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created: </span>
                  <span className="info-value">
                    {formatDate(selectedTask.createdAt)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Updated: </span>
                  <span className="info-value">
                    {formatDate(selectedTask.updatedAt)}
                  </span>
                </div>
              </div>

              {/* 3. TICKET BODY */}
              <section className="ticket-body">
                <h3>Description</h3>
                <p className="description-text">{selectedTask.description}</p>
              </section>

              {/* 4. ATTACHMENT SECTION (Only shows if attachmentUrl exists) */}

              <section className="ticket-attachment">
                <h3>Attachments</h3>
                {selectedTask.creatorAttachment ? (
                  <div className="attachment-actions">
                    <button
                      className="btn-outline"
                      onClick={() => handleDownloadClick("creator")}

                    >
                      📄 Download Attached File
                    </button>

                    {isCreator && (
                      <button
                        className="btn-delete-attachment"
                        onClick={handleDeleteAttachment}
                        title="Delete File"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : isCreator ? (
                  <div>
                    <button
                      className="btn-outline"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                    >
                      {isUploading ? "⏳ Uploading..." : "➕ Add Attachment"}
                    </button>
                    <input
                      type="file"
                      className="file-input btn-outline"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: "none" }} // HIDDEN!
                      accept=".pdf,image/*,.doc,.docx" // Matches your Multer limits
                    />
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No attachments provided.
                  </p>
                )}
              </section>

              {/* 5. THE RESOLUTION SECTION (BIDIRECTIONAL MAGIC) */}
              <section className="ticket-resolution">
                <h3 className="resolution-title">Ticket Resolution</h3>


                {/* VIEW A: Ticket is already resolved! */}
                {(selectedTask.resolutionNotes || selectedTask.assigneeAttachment) && !isEditingResolution ? (
                  <div className="resolution-content">
                    {selectedTask.resolutionNotes && (
                      <p className="resolution-notes">
                        "{selectedTask.resolutionNotes}"
                      </p>
                    )}
                    <div className="attachment-actions">

                      {selectedTask.assigneeAttachment && (
                        <div className="attachment-actions">
                          <button className="btn-outline" onClick={() => handleDownloadClick("assignee")}>
                            ✅ Download Resolution File
                          </button>
                          {isAssignee && (
                            <button className="btn-delete-attachment" onClick={handleDeleteAttachment} title="Delete File">✕</button>
                          )}
                        </div>
                      )}

                      {/* NEW: The Edit Button you requested! */}
                      {isAssignee && (
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setResolutionNotes(selectedTask.resolutionNotes || ""); // Pre-fill their old notes
                            setIsEditingResolution(true); // Open the form
                          }}
                        >
                          ✏️ Edit Resolution
                        </button>
                      )}
                    </div>
                  </div>
                ) :
                  /* VIEW B: Assignee needs to fill it out! */
                  isAssignee ? (
                    <form className="resolution-form" onSubmit={handleSubmitResolution}>
                      <textarea
                        className="resolution-textarea"
                        placeholder="Explain how you fixed the issue..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        rows="3"
                      />
                      <div className="resolution-form-actions">

                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {/* THE UX FIX: Tell the user their file is safe! */}
                          {selectedTask.assigneeAttachment && isEditingResolution && (
                            <span style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "500" }}>
                              📎 Current file attached. (Upload below to replace)
                            </span>
                          )}
                          <input
                            type="file"
                            className="resolution-file-input"
                            name="resolutionFile"
                            accept=".pdf,image/*,.doc,.docx"
                          />
                        </div>

                        <div>
                          {isEditingResolution && (
                            <button onClick={(e) => {
                              setIsEditingResolution(false);
                              setResolutionNotes(selectedTask.resolutionNotes || "");
                              setError(null);
                              e.target.closest('form').reset();
                            }
                            } type="button" className="btn-outline">
                              Cancel
                            </button>
                          )}

                          <button type="submit" className="btn-primary" disabled={isUploading}>
                            {isUploading ? "Submitting..." : "Resolve Ticket"}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* VIEW C: Waiting for IT to fix it (Creator sees this) */
                    <p className="resolution-waiting">⏳ Awaiting resolution from the assignee.</p>
                  )}
              </section>

              {/* 5. FOOTER ACTIONS */}
              {isCreator && (
                <footer className="ticket-actions">
                  <div className="action-group-left">
                    <button
                      className="btn-secondary"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      Edit Ticket
                    </button>
                  </div>
                  <div className="action-group-right">
                    <button onClick={handleDeleteClick} className="btn-danger">
                      Delete Ticket
                    </button>
                  </div>
                </footer>
              )}
            </article>
          )}
        </main>
      </main>

      {/* The Floating Action Button */}
      <button className="btn-fab" onClick={() => setIsCreateModalOpen(true)}>
        +
      </button>
      {/* The Open Create Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            // Re-fetch the tasks so the new one appears instantly!
            const refreshTasks = async () => {
              const data = await taskServices.getAllTasks();
              setTasks(data);
            };
            refreshTasks();
          }}
        />
      )}

      {/* The Open Edit Modal */}
      {isEditModalOpen && (
        <EditTaskModal
          task={selectedTask}
          onClose={() => setIsEditModalOpen(false)}
          // here when the modal run the onScuccess it will pass the updated task from the backend to the handleEditSuccess, and we will update our UI with the new data from the backend to ensure everything is in sync and up to date.
          onSuccess={handleEditSuccess}
        />
      )}

      {/* The Open Delete Message Modal  */}
      <ConfirmModal
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onConfirm={executeDelete}
        isProcessing={isDeleting}
        title="Delete Ticket?"
        message={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This cannot be undone.`}
      />
    </div>
  );
};

export default Dashboard;
