import { formatDate } from "../../utils/dateUtils";
import { useDashboardLogic } from "./hooks/useDashboardLogic";
import { taskServices } from "../../api/taskServices";
import SidebarTicket from "./Components/SidebarTicket";
import CreateTaskModal from "../../components/CreateTaskModal/CreateTaskModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import EditTaskModal from "../../components/EditTaskModal/EditTaskModal";
import "./Dashboard.css";
import TicketDetails from "./Components/TicketDetails";

const Dashboard = () => {
  const {
    navigate,
    selectedTask,
    setError,
    error,
    setSelectedTask,
    executeDelete,
    handleStatusChange,
    handleDeleteClick,
    handleDownloadClick,
    handleDeleteAttachment,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    isUploading,
    isDeleting,
    taskToDelete,
    setTaskToDelete,
    isEditModalOpen,
    setIsEditModalOpen,
    searchTerm,
    setSearchTerm,
    resolutionNotes,
    setResolutionNotes,
    handleSubmitResolution,
    activeTab,
    setActiveTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditingResolution,
    setIsEditingResolution,
    handleEditSuccess,
    isCreator,
    isAssignee,
    handleLogout,
    setTasks,
    filteredTasks,
  } = useDashboardLogic();

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
                <SidebarTicket
                  key={task.id}
                  task={task}
                  setSelectedTask={setSelectedTask}
                  navigate={navigate}
                  selectedTask={selectedTask}
                  activeTab={activeTab} />
              ))
            )}
          </div>

          {/* Placeholder for future pagination */}
          {/* <div className="pagination-controls">...</div> */}
        </aside>

        {/* Main content area */}
        <main className="main-stage">
          <TicketDetails
            selectedTask={selectedTask}
            isAssignee={isAssignee}
            handleStatusChange={handleStatusChange}
            formatDate={formatDate}
            handleDownloadClick={handleDownloadClick}
            handleDeleteAttachment={handleDeleteAttachment}
            handleDeleteClick={handleDeleteClick}
            handleFileChange={handleFileChange}
            handleSubmitResolution={handleSubmitResolution}
            handleUploadClick={handleUploadClick}
            isCreator={isCreator}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            setResolutionNotes={setResolutionNotes}
            resolutionNotes={resolutionNotes}
            isEditingResolution={isEditingResolution}
            setIsEditingResolution={setIsEditingResolution}
            setError={setError}
            setIsEditModalOpen={setIsEditModalOpen} />
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
