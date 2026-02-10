import { Layout, Menu } from 'antd';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileTextOutlined, TrophyOutlined, HomeOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

function CandidateLayout() {
  const location = useLocation();
  const selectedKeys = [
    location.pathname.startsWith('/tests') ? '/tests' :
    location.pathname.startsWith('/mes-resultats') ? '/mes-resultats' : '/'
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>Recruit AI Screening</Link>
          <Menu
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={[
              { key: '/', icon: <HomeOutlined />, label: <Link to="/">Accueil</Link> },
              { key: '/tests', icon: <FileTextOutlined />, label: <Link to="/tests">Tests</Link> },
              { key: '/mes-resultats', icon: <TrophyOutlined />, label: <Link to="/mes-resultats">Mes résultats</Link> },
            ]}
            style={{ flex: 1, minWidth: 0 }}
          />
          <div style={{ marginLeft: 'auto' }}>
            {/* Espace pour avatar / statut session */}
          </div>
        </div>
      </Header>
      <Content style={{ margin: '16px' }}>
        <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: 12 }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        © {new Date().getFullYear()} Recruit AI Screening — Candidat
      </Footer>
    </Layout>
  );
}

export default CandidateLayout;
