import { Navigate } from 'react-router-dom';

// We accept 'children' as a prop from whatever wraps this component
const ProtectedRoute = ({ children }) => {
  // 1. Check if the user has a token in their browser storage
  const token = localStorage.getItem('token');
  
  // 2. If there is NO token, redirect them immediately to the login page.
  // The 'replace' keyword means they can't use the back button to escape the redirect.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. If they DO have a token, render whatever component is inside (the children)
  return children;
};

// You MUST export it so App.jsx can import it!
export default ProtectedRoute;