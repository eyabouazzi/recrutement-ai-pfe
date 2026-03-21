import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import { ConfigProvider, App as AntdApp } from 'antd';
import { AuthContext } from './contexts/authContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { DarkModeProvider } from './contexts/DarkModeContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import CandidateLayout from './layouts/CandidateLayout.jsx';
import AddUser from './pages/AddUser.jsx';
import UsersList from './pages/UsersList.jsx';
import EditUser from './pages/EditUser.jsx';
import LogsList from './pages/LogsList.jsx';
import Profile from './pages/Profile.jsx';
import ChangePassword from './pages/changePassword.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import Tests from './pages/hr/Tests.jsx';
import CreateTest from './pages/hr/CreateTest.jsx';
import HRResults from './pages/hr/Results.jsx';
import HRDashboard from './pages/hr/Dashboard.jsx';
import HRCandidates from './pages/hr/Candidates.jsx';
import HRSettings from './pages/hr/Settings.jsx';
import HRExports from './pages/hr/Exports.jsx';
import CandidateDashboard from './pages/candidate/Dashboard.jsx';
import TakeTest from './pages/candidate/TakeTest.jsx';
import CandidateResults from './pages/candidate/Results.jsx';
import TestManage from './pages/hr/TestManage.jsx';
import Pipeline from './pages/hr/Pipeline.jsx';
import Careers from './pages/public/Careers.jsx';
import CandidateProfile from './pages/hr/CandidateProfile.jsx';
import JobDetail from './pages/public/JobDetail.jsx';
import MyApplications from './pages/candidate/MyApplications.jsx';
import Recommendations from './pages/candidate/Recommendations.jsx';
import Analytics from './pages/hr/Analytics.jsx';
import Notifications from './pages/Notifications.jsx';
import Calendar from './pages/Calendar.jsx';

function App() {
  const { token } = useContext(AuthContext);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb', // Premium Indigo
          colorInfo: '#2563eb',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          colorTextBase: '#334155', // Slate 700
          colorBorder: '#e2e8f0', // Slate 200
          boxShadowSecondary: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        },
        components: {
          Button: {
            controlHeight: 40,
            borderRadius: 8,
            fontWeight: 500,
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          },
          Input: {
            controlHeight: 40,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 40,
            borderRadius: 8,
          }
        }
      }}
    >
      <AntdApp>
        <DarkModeProvider>
          <NotificationProvider>
            <WebSocketProvider>
              <BrowserRouter>
            <Routes>
              {/* Auth routes under AuthLayout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* RH Back-office under DashboardLayout */}
              <Route element={<ProtectedRoute allowedRoles={['HR', 'admin']} />}>
                <Route path="/rh" element={<DashboardLayout />}>
                  <Route path="dashboard" element={<HRDashboard />} />
                  <Route path="tests" element={<Tests />} />
                  <Route path="tests/create" element={<CreateTest />} />
                  <Route path="candidats" element={<HRCandidates />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="candidate/:id" element={<CandidateProfile />} />
                  <Route path="resultats" element={<HRResults />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="parametres" element={<HRSettings />} />
                  <Route path="exports" element={<HRExports />} />
                  <Route path="tests/edit/:id" element={<TestManage />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Candidate front-office under CandidateLayout */}
              <Route element={<ProtectedRoute allowedRoles={['candidat']} />}>
                <Route element={<CandidateLayout />}>
                  <Route path="/tests" element={<CandidateDashboard />} />
                  <Route path="/tests/:id" element={<TakeTest />} />
                  <Route path="/mes-resultats" element={<CandidateResults />} />
                  <Route path="/mes-candidatures" element={<MyApplications />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                </Route>
              </Route>

              {/* Public Home Page & Main Layout */}
              <Route element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:id" element={<JobDetail />} />
              </Route>

              {/* Admin-only routes */}
              <Route path="/" element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<MainLayout />}>
                  <Route path="/user/add" element={<AddUser />} />
                  <Route path="/user/edit/:id" element={<EditUser />} />
                  <Route path="/user/list" element={<UsersList />} />
                  <Route path="/logs/list" element={<LogsList />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/change-password" element={<ChangePassword />} />
                </Route>
              </Route>

              {/* Fallback: always redirect unknown routes to /login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              </BrowserRouter>
            </WebSocketProvider>
          </NotificationProvider>
        </DarkModeProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
