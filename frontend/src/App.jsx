import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

import { ConfigProvider, App as AntdApp } from 'antd';
import { AuthContext } from './contexts/authContext.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import CandidateLayout from './layouts/CandidateLayout.jsx';
import './styles/dashboard-enhanced.css';
import './styles/wow-theme.css';
import Profile from './pages/Profile.jsx';
import ChangePassword from './pages/changePassword.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Tests from './pages/hr/Tests.jsx';
import CreateTest from './pages/hr/CreateTest.jsx';
import HRResults from './pages/hr/Results.jsx';
import HRCandidates from './pages/hr/Candidates.jsx';
import CandidateDashboard from './pages/candidate/Dashboard.jsx';
import TakeTest from './pages/candidate/TakeTest.jsx';
import TestComplete from './pages/candidate/TestComplete.jsx';
import CandidateResults from './pages/candidate/Results.jsx';
import TestManage from './pages/hr/TestManage.jsx';
import QuestionBank from './pages/hr/QuestionBank.jsx';
import Pipeline from './pages/hr/Pipeline.jsx';
import CandidateProfile from './pages/hr/CandidateProfile.jsx';
import JobDetail from './pages/public/JobDetail.jsx';
import MyApplications from './pages/candidate/MyApplications.jsx';
import Recommendations from './pages/candidate/Recommendations.jsx';
import HRDashboard from './pages/hr/Dashboard.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import { bindAntdApp } from './utils/antdApp.js';

// External public pages
import Events from './pages/public/Events.jsx';
import Specs from './pages/public/Specs.jsx';

function AntdAppBridge() {
  const api = AntdApp.useApp();
  bindAntdApp(api);
  return null;
}

function App() {
  const { token } = useContext(AuthContext);
  return (
    <div className="wow-app">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#4f46e5',
            colorInfo: '#0891b2',
            colorSuccess: '#059669',
            colorWarning: '#d97706',
            colorError: '#ef4444',
            fontFamily: "'Sora', 'Manrope', 'Plus Jakarta Sans', 'Segoe UI', sans-serif",
            borderRadius: 16,
            colorBgContainer: '#ffffff',
            colorBgElevated: '#ffffff',
            colorBgLayout: '#f6f8ff',
            colorTextBase: '#0f172a',
            colorBorder: '#dbe3f3',
            colorBorderSecondary: '#eaf0fb',
            boxShadowSecondary: '0 20px 44px rgba(37, 99, 235, 0.12)',
          },
          components: {
            Button: {
              controlHeight: 42,
              borderRadius: 14,
              fontWeight: 700,
            },
            Card: {
              borderRadiusLG: 22,
              boxShadowTertiary: '0 18px 40px rgba(37, 99, 235, 0.10)',
            },
            Input: {
              controlHeight: 42,
              borderRadius: 16,
            },
            Select: {
              controlHeight: 42,
              borderRadius: 16,
            },
            Layout: {
              headerBg: 'rgba(255, 255, 255, 0.88)',
              bodyBg: '#f6f8ff',
              siderBg: 'rgba(243, 247, 255, 0.96)',
            }
          }
        }}
      >
        <AntdApp>
          <AntdAppBridge />
          <WebSocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Standalone auth pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* AuthLayout for forgot/reset password */}
                <Route element={<AuthLayout />}>
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Onboarding Wizard - Requires authentication but not standard dashboard layout */}
                <Route element={<ProtectedRoute allowedRoles={['candidat', 'HR']} />}>
                  <Route element={<AuthLayout />}>
                    <Route path="/onboarding" element={<Onboarding />} />
                  </Route>
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
                    <Route path="analytics" element={<HRDashboard />} />
                    <Route path="tests/edit/:id" element={<TestManage />} />
                    <Route path="question-bank" element={<QuestionBank />} />
                    <Route path="profile" element={<Profile />} />
                  </Route>
                </Route>

                {/* Candidate front-office under CandidateLayout */}
                <Route element={<ProtectedRoute allowedRoles={['candidat']} />}>
                  <Route element={<CandidateLayout />}>
                    <Route path="/tests" element={<CandidateDashboard />} />
                    <Route path="/tests/termine" element={<TestComplete />} />
                    <Route path="/tests/:id" element={<TakeTest />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/mes-resultats" element={<CandidateResults />} />
                    <Route path="/mes-candidatures" element={<MyApplications />} />
                    <Route path="/recommendations" element={<Recommendations />} />
                  </Route>
                </Route>

                {/* Marketing & careers (full-width public shell) */}
                <Route element={<PublicLayout />}>
                  <Route index element={<Home />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />

                  <Route path="/careers/:id" element={<JobDetail />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/specs" element={<Specs />} />
                </Route>

                {/* Fallback: always redirect unknown routes to /login */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </AntdApp>
      </ConfigProvider>
    </div>
  );
}

export default App;
