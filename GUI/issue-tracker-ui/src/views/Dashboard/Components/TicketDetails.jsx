import React from 'react'

const TicketDetails = ({
    selectedTask,
    isAssignee,
    handleStatusChange,
    formatDate,
    handleDownloadClick,
    handleDeleteAttachment,
    handleDeleteClick,
    handleFileChange,
    handleSubmitResolution,
    handleUploadClick,
    isCreator,
    isUploading,
    fileInputRef,
    setResolutionNotes,
    resolutionNotes,
    isEditingResolution,
    setIsEditingResolution,
    setError,
    setIsEditModalOpen }) => {

    return (
        <div>
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
                                        onChange={(e) => setResolutionNotes(e.target.value.length ? e.target.value : "")}
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
                                                    setResolutionNotes(selectedTask.resolutionNotes || ""); // Revert to old notes
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
        </div>
    )
}

export default TicketDetails