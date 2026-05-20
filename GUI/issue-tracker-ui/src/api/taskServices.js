import { apiFetch } from "./fetch";

export const getAllTasks = async () => {
  const data = await apiFetch("/tasks", { method: "GET" });
  return data;
};

export const createTask = async (taskData) => {
  const data = await apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
  return data;
};

export const resolveTask = async (taskId, file, resolutionNotes) => {
  // what is the formData API? It allows
  //  us to construct a set of key/value pairs
  //  representing form fields and their values,
  //  which can include files. This is essential for file uploads
  //  because it properly formats the request as multipart/form-data,
  //  which is what the server expects when handling file uploads.
  //Multipart" literally means the box is divided into sections.
  //  The browser automatically generates a random string called a Boundary 
  // (think of it like a cardboard divider) to keep the items separate
  //  so they don't mash together during transit
  const formData = new FormData();

  if (file) formData.append("file", file); // "file" is the key the server expects, and file is the actual file object from the input
  if (resolutionNotes !== undefined && resolutionNotes !== null) formData.append("resolutionNotes", resolutionNotes); // Add resolution notes if provided

  const data = await apiFetch(`/tasks/${taskId}/resolve`, {
    method: "PATCH",
    body: formData,
    headers: {
      // We do NOT set the Content-Type header here!
      //  The browser will automatically set it to multipart/form-data
      //  and include the necessary boundary when we use FormData.
    },
  });

  return data;
};


export const updateDetails = async (taskId, details) => {
    const data = await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(details),
    });
    return data;
};

export const deleteTask = async (taskId) => {
    const data = await apiFetch(`/tasks/${taskId}`, {
        method: "DELETE",
    });
    return data;
}

export const removeFile = async (taskId) => {
    const data = await apiFetch(`/tasks/${taskId}/attachment`, {
        method: "DELETE"
    }) 
    return data
}


// 2. Added the VIP pass generator for downloads!
export const getDownloadUrl = async (taskId) => {
  const data = await apiFetch(`/tasks/${taskId}/attachments`, {
    method: "GET",  
  });
  return data; // This returns { url: "http://minio:9000/..." }
};

export const taskServices = {
    getAllTasks,
    createTask,
    resolveTask,
    updateDetails,
    deleteTask,
    removeFile,
    getDownloadUrl
}