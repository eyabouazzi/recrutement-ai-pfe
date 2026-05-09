import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ allowedRoles }) => {
    const { token, user } = useContext(AuthContext);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user) {
        // Still loading user data
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirection if unauthorized role
        if (user.role === 'HR' || user.role === 'admin') {
            return <Navigate to="/rh/dashboard" replace />;
        } else if (user.role === 'candidat') {
            return <Navigate to="/tests" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
