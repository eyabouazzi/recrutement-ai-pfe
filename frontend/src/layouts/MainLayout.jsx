import {
  UserOutlined,
  HomeOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  ExportOutlined,
  TrophyOutlined,
  PlusSquareOutlined,
  BookOutlined,
  SlidersOutlined,
  FileSearchOutlined,
  BellOutlined,
  InfoCircleOutlined,
  ProfileOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

function getItem(label, key, icon, path, children) {
  return {
    key,
    icon,
    children,
    // When path is provided, render as a Link
    label: path ? <Link to={path}>{label}</Link> : label,
    // Custom field for computing selected state by pathname
    itemPath: path || null,
  };
}

function MainLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const items = useMemo(
    () => [
      // Accueil / Public
      getItem('Home', 'home', <HomeOutlined />, '/'),

      // Gestion utilisateurs (existant)
      getItem('Users', 'user', <UserOutlined />, null, [
        getItem('Add', 'user1', null, '/user/add'),
        getItem('List', 'user2', null, '/user/list'),
      ]),

      // RH Back-office
      getItem('RH', 'rh', <DashboardOutlined />, null, [
        getItem('Dashboard', 'rh-dashboard', null, '/rh/dashboard'),
        getItem('Créer un test', 'rh-tests-new', <PlusSquareOutlined />, '/rh/tests/new'),
        getItem('Candidats', 'rh-candidats', <TeamOutlined />, '/rh/candidats'),
        getItem('Résultats', 'rh-resultats', <BarChartOutlined />, '/rh/resultats'),
        getItem('Paramètres', 'rh-parametres', <SettingOutlined />, '/rh/parametres'),
        getItem('Critères de scoring', 'rh-parametres-scoring', <SlidersOutlined />, '/rh/parametres/scoring'),
        getItem('Rapports', 'rh-rapports', <FileSearchOutlined />, '/rh/rapports'),
      ]),

      // Candidat Front-office
      getItem('Candidat', 'candidate', <TrophyOutlined />, null, [
        getItem('Tests disponibles', 'candidate-tests', <FileTextOutlined />, '/tests'),
        getItem('Mes invitations', 'candidate-invitations', <ProfileOutlined />, '/mes-invitations'),
        getItem('Mes résultats', 'candidate-results', <BarChartOutlined />, '/mes-resultats'),
      ]),

      // Global utilities
      getItem('Notifications', 'notifications', <BellOutlined />, '/notifications'),
      getItem('Compte', 'compte', <UserOutlined />, '/compte'),
    ],
    []
  );

  const flattenItems = (arr) =>
    arr.flatMap((item) => (item.children ? flattenItems(item.children) : [item]));

  const selectedKey = useMemo(() => {
    const leaves = flattenItems(items);
    let match = null;
    for (const it of leaves) {
      if (it.itemPath && location.pathname.startsWith(it.itemPath)) {
        if (!match || it.itemPath.length > match.itemPath.length) {
          match = it;
        }
      }
    }
    // Default to home if nothing matches
    return match ? match.key : 'home';
  }, [items, location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(v) => setCollapsed(v)}>
        <Menu theme="dark" mode="inline" items={items} selectedKeys={[selectedKey]} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, backgroundColor: '#ffffff' }} />
        <Content style={{ margin: '0 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              borderRadius: 14,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );

}

export default MainLayout;
