import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // Simple check for token presence. 
    // For robust app, we might want to decode/validate expiry here or via an AuthContext.
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
