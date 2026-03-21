import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ allowedRoles }) => {
    const { token, user } = useContext(AuthContext);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!user) {
        // Still loading user data
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirection if unauthorized role
        if (user.role === 'HR') {
            return <Navigate to="/rh/dashboard" replace />;
        } else if (user.role === 'candidat') {
            return <Navigate to="/tests" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
