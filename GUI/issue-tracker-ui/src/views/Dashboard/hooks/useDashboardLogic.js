import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { taskServices } from "../../../api/taskServices";

export const useDashboardLogic = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // get the id from the payload then extract the id from and setCurrentId to this id extracted.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // payload contains 3 pieces of info: header, payload, signature
      // we want the payload, which is the middle part, so we split by "." and take the second item (index 1)
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);

      // 👉 THE FIX: Proactive Logout Timer
      // The JWT 'exp' is in seconds, so we multiply by 1000 to get milliseconds
      const expirationTime = payload.exp * 1000;
      const timeRemaining = expirationTime - Date.now();

      if (timeRemaining <= 0) {
        //token expired
        handleLogout();
      } else {
        // Token is still good! Set a silent alarm to kick them out when time runs out
        const logoutTimer = setTimeout(() => {
          handleLogout();
        }, timeRemaining);

        // Clean up the timer if they leave the page manually
        return () => clearTimeout(logoutTimer); // Clean up the timer if the component unmounts or token changes
      }
    } catch (err) {
      console.error(`${err.message}Failed to decode token.`);
      handleLogout(); // If token is malformed, log them out just to be safe
    }
  }, []); // Empty dependency array means this runs once when the Dashboard loads, just once when user logs in at first time only.

  useEffect(() => {
    if (selectedTask) {
      document.title = `${selectedTask.title} | NMU Ticketing System`;
    } else {
      document.title = "Dashboard | NMU Ticketing System";
    }
  }, [selectedTask]);

  // --- NEW: Sync URL ID with the selected task ---
  useEffect(() => {
    // If we have tasks loaded, AND there is an ID in the URL...
    if (tasks.length > 0 && taskId) {
      // Find the specific ticket that matches the URL
      // (Using String() ensures a safe comparison between numbers and strings)
      const taskFromUrl = tasks.find((t) => String(t.id) === String(taskId));

      if (taskFromUrl) {
        setSelectedTask(taskFromUrl);
      }
    }
  }, [taskId, tasks]); // Only re-run if the URL changes or tasks update

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

  const handleDownloadClick = async (type) => {
    try {
      // 1. Fetch the temporary presigned URL from your backend
      const urls = await taskServices.getDownloadUrl(selectedTask.id);

      // Grabs either urls.creator or urls.assignee
      const targetUrl = urls[type];
      if (!targetUrl) return;

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
      const updatedTask = await taskServices.resolveTask(
        selectedTask.id,
        file,
        null,
      );

      // Update the UI immediately so the download/delete buttons appear
      setSelectedTask(updatedTask);

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
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
      const finalNotes = resolutionNotes.trim() 

      // // Prevent submitting if BOTH are completely empty
      // if (!file && !finalNotes) {
      //   setError(
      //     "You must provide either a file or a note to resolve the ticket.",
      //   );
      //   setIsUploading(false);
      //   return;
      // }

      let updatedTask;
      // 1. Update the resolution notes and files
      updatedTask = await taskServices.resolveTask(
        selectedTask.id,
        file,
        finalNotes,
      );

      // 2. Instantly update the status based on what the user just did
      updatedTask = await taskServices.updateDetails(selectedTask.id, {
        status: "COMPLETED",
      });

      setSelectedTask(updatedTask);
      setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));

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

  // Check if the logged-in user is the creator of the currently selected task
  // this is called RBAC: Role-Based Access Control. We can use this boolean to conditionally render certain buttons or features that only the creator should see.
  const isCreator = selectedTask?.creatorId === currentUserId;
  const isAssignee = selectedTask?.assigneeId === currentUserId;

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

  // 4. THE MAGIC: Return an object containing exactly what the UI needs to draw itself
  return {
    navigate,
    tasks,
    selectedTask,
    error,
    setError,
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
    currentUserId,
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
  };
};
