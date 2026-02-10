import { Layout } from 'antd';
import { Outlet, Link } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

function AuthLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 960, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>Recruit AI Screening</Link>
          <nav style={{ display: 'flex', gap: 16 }}>
            <Link to="/login">Connexion</Link>
            <Link to="/signup">Inscription</Link>
          </nav>
        </div>
      </Header>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 480, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        © {new Date().getFullYear()} Recruit AI Screening — Authentification
      </Footer>
    </Layout>
  );
}

export default AuthLayout;
