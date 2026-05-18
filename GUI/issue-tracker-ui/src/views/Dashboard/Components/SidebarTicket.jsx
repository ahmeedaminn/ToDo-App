import React from 'react'

const SidebarTicket = ({ task, setSelectedTask, navigate, selectedTask, activeTab }) => {
    return (

        <article
            key={task.id}
            onClick={() => { setSelectedTask(task); navigate(`/dashboard/${task.id}`) }} // NEW: Update the URL when selecting a task
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

    )
}

export default SidebarTicket