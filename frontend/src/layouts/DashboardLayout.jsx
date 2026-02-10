import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  ExportOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';

const { Header, Sider, Content } = Layout;

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const items = useMemo(
    () => [
      { key: '/rh/dashboard', icon: <DashboardOutlined />, label: <Link to="/rh/dashboard">Tableau de bord</Link> },
      { key: '/rh/tests', icon: <FileTextOutlined />, label: <Link to="/rh/tests">Tests</Link> },
      { key: '/rh/candidats', icon: <TeamOutlined />, label: <Link to="/rh/candidats">Candidats</Link> },
      { key: '/rh/resultats', icon: <BarChartOutlined />, label: <Link to="/rh/resultats">Résultats</Link> },
      { key: '/rh/parametres', icon: <SettingOutlined />, label: <Link to="/rh/parametres">Paramètres / Scoring</Link> },
      { key: '/rh/exports', icon: <ExportOutlined />, label: <Link to="/rh/exports">Exports</Link> },
    ],
    []
  );

  const selectedKeys = useMemo(() => {
    const match = items.find((i) => location.pathname.startsWith(i.key));
    return match ? [match.key] : [];
  }, [location.pathname, items]);

  const userMenu = (
    <Menu
      items={[
        { key: 'profile', label: <Link to="/rh/parametres">Profil</Link> },
        { type: 'divider' },
        { key: 'logout', label: <span>Déconnexion</span> },
      ]}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 56, margin: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
          {collapsed ? 'RH' : 'RH Back-Office'}
        </div>
        <Menu theme="dark" mode="inline" items={items} selectedKeys={selectedKeys} />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <Dropdown overlay={userMenu} trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} icon={<UserOutlined />} />
              <span style={{ fontWeight: 600 }}>RH</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default DashboardLayout;
