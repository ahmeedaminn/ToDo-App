// It turns "2026-04-25T15:00:00Z" into "Apr 25, 2026"
export const formatDate = (dateString) => {
  if (!dateString) return "No date set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
