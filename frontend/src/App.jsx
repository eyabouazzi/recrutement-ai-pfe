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
import PublicLayout from './layouts/PublicLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import CandidateLayout from './layouts/CandidateLayout.jsx';
import './styles/dashboard-enhanced.css';
import './styles/wow-theme.css';
import AddUser from './pages/AddUser.jsx';
import UsersList from './pages/UsersList.jsx';
import EditUser from './pages/EditUser.jsx';
import LogsList from './pages/LogsList.jsx';
import Profile from './pages/Profile.jsx';
import ChangePassword from './pages/changePassword.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Tests from './pages/hr/Tests.jsx';
import CreateTest from './pages/hr/CreateTest.jsx';
import HRResults from './pages/hr/Results.jsx';
import HRCandidates from './pages/hr/Candidates.jsx';
import HRSettings from './pages/hr/Settings.jsx';
import HRExports from './pages/hr/Exports.jsx';
import CandidateDashboard from './pages/candidate/Dashboard.jsx';
import TakeTest from './pages/candidate/TakeTest.jsx';
import TestComplete from './pages/candidate/TestComplete.jsx';
import PrivacyData from './pages/candidate/PrivacyData.jsx';
import CandidateResults from './pages/candidate/Results.jsx';
import TestManage from './pages/hr/TestManage.jsx';
import QuestionBank from './pages/hr/QuestionBank.jsx';
import Pipeline from './pages/hr/Pipeline.jsx';
import Careers from './pages/public/Careers.jsx';
import CandidateProfile from './pages/hr/CandidateProfile.jsx';
import JobDetail from './pages/public/JobDetail.jsx';
import MyApplications from './pages/candidate/MyApplications.jsx';
import Recommendations from './pages/candidate/Recommendations.jsx';
import Favorites from './pages/candidate/Favorites.jsx';
import Analytics from './pages/hr/Analytics.jsx';
import HRAudit from './pages/hr/HRAudit.jsx';
import Notifications from './pages/Notifications.jsx';
import Calendar from './pages/Calendar.jsx';
import Contact from './pages/Contact.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';

// External public pages
import Companies from './pages/public/Companies.jsx';
import Events from './pages/public/Events.jsx';
import Recruiters from './pages/public/Recruiters.jsx';
import CompanyDetail from './pages/public/CompanyDetail.jsx';
import RecruiterDetail from './pages/public/RecruiterDetail.jsx';
import Specs from './pages/public/Specs.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';

function App() {
  const { token } = useContext(AuthContext);
  return (
    <div className="wow-app">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#0f766e',
            colorInfo: '#0284c7',
            colorSuccess: '#16a34a',
            colorWarning: '#ea580c',
            colorError: '#dc2626',
            fontFamily: "'Sora', 'Manrope', 'Plus Jakarta Sans', 'Segoe UI', sans-serif",
            borderRadius: 12,
            colorBgContainer: '#ffffff',
            colorTextBase: '#0f172a',
            colorBorder: '#dbe4ef',
            boxShadowSecondary: '0 14px 30px rgba(2, 6, 23, 0.08)',
          },
          components: {
            Button: {
              controlHeight: 42,
              borderRadius: 12,
              fontWeight: 700,
            },
            Card: {
              borderRadiusLG: 18,
              boxShadowTertiary: '0 14px 30px rgba(2, 6, 23, 0.08)',
            },
            Input: {
              controlHeight: 42,
              borderRadius: 12,
            },
            Select: {
              controlHeight: 42,
              borderRadius: 12,
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
              <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
                <Route path="/rh" element={<DashboardLayout />}>
                  <Route path="dashboard" element={<Analytics />} />
                  <Route path="tests" element={<Tests />} />
                  <Route path="tests/create" element={<CreateTest />} />
                  <Route path="candidats" element={<HRCandidates />} />
                  <Route path="pipeline" element={<Pipeline />} />
                  <Route path="candidate/:id" element={<CandidateProfile />} />
                  <Route path="resultats" element={<HRResults />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="parametres" element={<HRSettings />} />
                  <Route path="exports" element={<HRExports />} />
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
                  <Route path="/mes-donnees" element={<PrivacyData />} />
                  <Route path="/mes-resultats" element={<CandidateResults />} />
                  <Route path="/mes-candidatures" element={<MyApplications />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
              </Route>

              {/* Marketing & careers (full-width public shell) */}
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:id" element={<JobDetail />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                <Route path="/recruiters" element={<Recruiters />} />
                <Route path="/recruiters/:id" element={<RecruiterDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/specs" element={<Specs />} />
              </Route>

              {/* Admin-only routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<MainLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<UsersList />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Fallback: always redirect unknown routes to /login */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
                </BrowserRouter>
              </WebSocketProvider>
            </NotificationProvider>
          </DarkModeProvider>
        </AntdApp>
      </ConfigProvider>
    </div>
  );
}

export default App;
