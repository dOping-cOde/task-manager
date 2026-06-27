import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Guards routes that require authentication.
const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;