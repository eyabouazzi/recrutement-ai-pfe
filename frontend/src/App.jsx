import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { useContext } from 'react';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';

import { ConfigProvider } from 'antd';
import { AuthContext } from './contexts/authContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import CandidateLayout from './layouts/CandidateLayout.jsx';
import AddUser from './pages/AddUser.jsx';
import UsersList from './pages/UsersList.jsx';

function App() {
  const { token } = useContext(AuthContext);
  return (
    // pour detetecter browser brave, edge...
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#13c2c2',
          colorInfo: '#13c2c2',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Auth routes under AuthLayout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* RH Back-office under DashboardLayout */}
          <Route path="/rh" element={<DashboardLayout />}>
            <Route path="dashboard" element={<div>Tableau de bord RH</div>} />
            <Route path="tests" element={<div>Gestion des tests</div>} />
            <Route path="candidats" element={<div>Liste des candidats</div>} />
            <Route path="resultats" element={<div>Résultats et comparaisons</div>} />
            <Route path="parametres" element={<div>Paramètres & Scoring</div>} />
            <Route path="exports" element={<div>Exports PDF/Excel</div>} />
          </Route>

          {/* Candidate front-office under CandidateLayout */}
          <Route element={<CandidateLayout />}>
            <Route path="/tests" element={<div>Tests disponibles</div>} />
            <Route path="/tests/:id" element={<div>Passage du test</div>} />
            <Route path="/mes-resultats" element={<div>Mes résultats</div>} />
          </Route>

          {/* Public/Main layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="/user/add" element={<AddUser />} />
            <Route path="/user/list" element={<UsersList />} />
          </Route>

          {/* Fallback when not authenticated */}
          {!token && <Route path="*" element={<Login />} />}
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
