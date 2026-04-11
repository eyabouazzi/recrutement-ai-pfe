import React, { useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    Modal,
    Popconfirm,
    Progress,
    Select,
    Space,
    Spin,
    Table,
    Tabs,
    Tag,
    Typography,
    message
} from 'antd';
import {
    BarChartOutlined,
    BankOutlined,
    CalendarOutlined,
    FileTextOutlined,
    NotificationOutlined,
    TeamOutlined
} from '@ant-design/icons';
import {
    approveCompany,
    deleteUser,
    getAntiCheatAnalytics,
    getAdminCompanies,
    getAdminStats,
    getAdminUsers,
    updateAdminUser
} from '../../api/admin';
import { baseUrl } from '../../api/api';
import { getStoredToken } from '../../utils/authStorage';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingTable, setLoadingTable] = useState(false);

    const [companies, setCompanies] = useState([]);
    const [users, setUsers] = useState([]);

    const [companySearch, setCompanySearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState(undefined);

    const [activeTab, setActiveTab] = useState('1');
    const [editingUser, setEditingUser] = useState(null);
    const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
    const [antiCheatLoading, setAntiCheatLoading] = useState(false);
    const [antiCheatData, setAntiCheatData] = useState(null);
    const [antiCheatGranularity, setAntiCheatGranularity] = useState('day');
    const [antiCheatRange, setAntiCheatRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
    const [antiCheatTrustThreshold, setAntiCheatTrustThreshold] = useState(60);
    const [antiCheatLimit, setAntiCheatLimit] = useState(20);
    const [antiCheatRecruiterId, setAntiCheatRecruiterId] = useState('');
    const [antiCheatTestId, setAntiCheatTestId] = useState('');

    const [notifForm] = Form.useForm();
    const [editUserForm] = Form.useForm();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getAdminStats();
            if (res.status) {
                setStats(res);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingCompanies = async (searchValue = companySearch) => {
        try {
            setLoadingTable(true);
            const res = await getAdminCompanies({ status: 'pending', limit: 50, search: searchValue });
            if (res.status) {
                setCompanies(Array.isArray(res.companies) ? res.companies : []);
            }
        } finally {
            setLoadingTable(false);
        }
    };

    const fetchUsers = async (params = {}) => {
        try {
            setLoadingTable(true);
            const res = await getAdminUsers({
                limit: 50,
                search: params.search !== undefined ? params.search : userSearch,
                role: params.role !== undefined ? params.role : userRoleFilter,
            });
            if (res.status) {
                setUsers(Array.isArray(res.users) ? res.users : []);
            }
        } finally {
            setLoadingTable(false);
        }
    };

    const fetchAntiCheat = async () => {
        try {
            setAntiCheatLoading(true);
            const [start, end] = antiCheatRange || [];
            const res = await getAntiCheatAnalytics({
                startDate: start ? start.startOf('day').toISOString() : undefined,
                endDate: end ? end.endOf('day').toISOString() : undefined,
                granularity: antiCheatGranularity,
                trustThreshold: antiCheatTrustThreshold,
                limit: antiCheatLimit,
                recruiterId: antiCheatRecruiterId || undefined,
                testId: antiCheatTestId || undefined,
            });
            if (!res.status) {
                throw new Error(res.message || res.error || 'Analyse anti-triche indisponible');
            }
            setAntiCheatData(res);
        } catch (error) {
            message.error(error.message || 'Impossible de charger les analytics anti-triche');
        } finally {
            setAntiCheatLoading(false);
        }
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        if (key === '2') fetchPendingCompanies();
        if (key === '3') fetchUsers();
        if (key === '4' && !antiCheatData && !antiCheatLoading) fetchAntiCheat();
    };

    const handleApproveCompany = async (id, action) => {
        try {
            const note = window.prompt(
                action === 'reject' ? 'Motif de rejet (recommandé)' : 'Note d’approbation (optionnelle)',
                ''
            ) || '';

            const res = await approveCompany(id, action, note);
            if (!res.status) {
                throw new Error(res.message || 'Action impossible');
            }

            message.success(res.message);
            fetchPendingCompanies();
            fetchStats();
        } catch (error) {
            message.error(error.message || 'Impossible de traiter cette entreprise');
        }
    };

    const openEditUserModal = (record) => {
        setEditingUser(record);
        editUserForm.setFieldsValue({
            role: record.role,
            companyId: record.companyId?._id || '',
        });
    };

    const handleSaveUser = async (values) => {
        if (!editingUser?._id) return;

        try {
            const res = await updateAdminUser(editingUser._id, {
                role: values.role,
                companyId: values.companyId || null,
            });

            if (!res.status) {
                throw new Error(res.message || 'Mise à jour impossible');
            }

            message.success('Utilisateur mis à jour');
            setEditingUser(null);
            editUserForm.resetFields();
            fetchUsers();
            fetchStats();
        } catch (error) {
            message.error(error.message || 'Impossible de mettre à jour cet utilisateur');
        }
    };

    const handleDeleteUser = async (record) => {
        try {
            const res = await deleteUser(record._id);
            if (!res.status) {
                throw new Error(res.message || 'Suppression impossible');
            }

            message.success('Utilisateur supprimé');
            fetchUsers();
            fetchStats();
        } catch (error) {
            message.error(error.message || 'Impossible de supprimer cet utilisateur');
        }
    };

    const handleSendNotification = async (values) => {
        try {
            const response = await fetch(`${baseUrl}/admin/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getStoredToken()}`
                },
                body: JSON.stringify(values)
            });
            const data = await response.json();
            if (!data.status) {
                throw new Error(data.message || 'Erreur lors de l’envoi');
            }

            message.success('Notification envoyée avec succès');
            setIsNotifModalVisible(false);
            notifForm.resetFields();
        } catch (error) {
            message.error(error.message || 'Erreur lors de l’envoi');
        }
    };

    const statCards = [
        { title: 'Total Utilisateurs', value: stats?.stats?.totalUsers || 0, icon: <TeamOutlined />, color: '#2563eb' },
        { title: 'Total Entreprises', value: stats?.stats?.totalCompanies || 0, icon: <BankOutlined />, color: '#16a34a' },
        { title: 'Offres d’emploi', value: stats?.stats?.totalJobs || 0, icon: <FileTextOutlined />, color: '#f59e0b' },
        { title: 'Événements', value: stats?.stats?.totalEvents || 0, icon: <CalendarOutlined />, color: '#0ea5e9' },
        { title: 'En attente validation', value: stats?.stats?.pendingCompanies || 0, icon: <NotificationOutlined />, color: '#7c3aed' },
    ];

    const companyColumns = [
        { title: 'Nom', dataIndex: 'name', key: 'name', render: (text) => <strong>{text}</strong> },
        { title: 'Secteur', dataIndex: 'sector', key: 'sector' },
        { title: 'Email Contact', dataIndex: 'email', key: 'email' },
        { title: 'Ville', dataIndex: 'city', key: 'city' },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (value) => <Tag color={value === 'approved' ? 'green' : value === 'rejected' ? 'red' : 'orange'}>{value}</Tag>
        },
        {
            title: 'Date création',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('fr-FR')
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="primary" style={{ background: '#10b981' }} size="small" onClick={() => handleApproveCompany(record._id, 'approve')}>
                        Approuver
                    </Button>
                    <Button danger size="small" onClick={() => handleApproveCompany(record._id, 'reject')}>
                        Rejeter
                    </Button>
                </Space>
            ),
        },
    ];

    const userColumns = [
        { title: 'Nom', key: 'name', render: (_, r) => `${r.firstName} ${r.lastName}` },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Rôle',
            dataIndex: 'role',
            key: 'role',
            render: (role) => <Tag color={role === 'HR' ? 'blue' : role === 'candidat' ? 'green' : 'red'}>{String(role || '').toUpperCase()}</Tag>
        },
        { title: 'Entreprise', key: 'company', render: (_, r) => r.companyId?.name || '—' },
        {
            title: 'Inscription',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString('fr-FR')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openEditUserModal(record)}>
                        Modifier
                    </Button>
                    <Popconfirm
                        title="Supprimer cet utilisateur ?"
                        description="Cette action est définitive."
                        okText="Supprimer"
                        cancelText="Annuler"
                        onConfirm={() => handleDeleteUser(record)}
                    >
                        <Button size="small" danger>
                            Supprimer
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const antiCheatTimeColumns = [
        { title: 'Période', dataIndex: 'period', key: 'period', width: 140 },
        { title: 'Soumissions', dataIndex: 'totalSubmissions', key: 'totalSubmissions', width: 110 },
        { title: 'Flaggées', dataIndex: 'flaggedSubmissions', key: 'flaggedSubmissions', width: 100 },
        {
            title: 'Taux flag',
            dataIndex: 'flaggedRate',
            key: 'flaggedRate',
            width: 130,
            render: (v) => <Tag color={v >= 50 ? 'red' : v >= 30 ? 'orange' : 'gold'}>{Number(v || 0).toFixed(1)}%</Tag>,
        },
        {
            title: 'Trust moyen',
            dataIndex: 'avgTrustScore',
            key: 'avgTrustScore',
            width: 130,
            render: (v) => (
                <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>
                    {Number(v || 0).toFixed(1)}
                </Tag>
            ),
        },
    ];

    const antiCheatRecruiterColumns = [
        { title: 'Recruteur', dataIndex: 'recruiterName', key: 'recruiterName', render: (v) => v || 'Inconnu' },
        { title: 'Tests', dataIndex: 'testsCount', key: 'testsCount', width: 80 },
        { title: 'Soumissions', dataIndex: 'totalSubmissions', key: 'totalSubmissions', width: 110 },
        { title: 'Flaggées', dataIndex: 'flaggedSubmissions', key: 'flaggedSubmissions', width: 100 },
        {
            title: 'Taux flag',
            dataIndex: 'flaggedRate',
            key: 'flaggedRate',
            width: 120,
            render: (v) => <Tag color={v >= 50 ? 'red' : v >= 30 ? 'orange' : 'gold'}>{Number(v || 0).toFixed(1)}%</Tag>,
        },
        {
            title: 'Trust moyen',
            dataIndex: 'avgTrustScore',
            key: 'avgTrustScore',
            width: 120,
            render: (v) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{Number(v || 0).toFixed(1)}</Tag>,
        },
    ];

    const antiCheatTestColumns = [
        { title: 'Test', dataIndex: 'testTitle', key: 'testTitle', ellipsis: true },
        { title: 'Recruteur', dataIndex: 'recruiterName', key: 'recruiterName', render: (v) => v || 'Inconnu' },
        { title: 'Soumissions', dataIndex: 'totalSubmissions', key: 'totalSubmissions', width: 110 },
        { title: 'Flaggées', dataIndex: 'flaggedSubmissions', key: 'flaggedSubmissions', width: 100 },
        {
            title: 'Taux flag',
            dataIndex: 'flaggedRate',
            key: 'flaggedRate',
            width: 120,
            render: (v) => <Tag color={v >= 50 ? 'red' : v >= 30 ? 'orange' : 'gold'}>{Number(v || 0).toFixed(1)}%</Tag>,
        },
        {
            title: 'Trust moyen',
            dataIndex: 'avgTrustScore',
            key: 'avgTrustScore',
            width: 120,
            render: (v) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{Number(v || 0).toFixed(1)}</Tag>,
        },
    ];

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
    }

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 4 }}>Tableau de bord Administrateur</Title>
                    <Text type="secondary">Supervision globale, modération des entreprises et gestion des comptes.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<NotificationOutlined />}
                    size="large"
                    onClick={() => setIsNotifModalVisible(true)}
                >
                    Diffuser une notification
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {statCards.map((stat) => (
                    <Card key={stat.title} bordered={false} style={{ borderRadius: 18, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                display: 'grid',
                                placeItems: 'center',
                                background: `${stat.color}18`,
                                color: stat.color,
                                fontSize: 18,
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{stat.value}</div>
                                <div style={{ color: '#64748b', fontSize: 13 }}>{stat.title}</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card bordered={false} style={{ borderRadius: 22, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    items={[
                        {
                            key: '1',
                            label: 'Vue d’ensemble',
                            children: (
                                <>
                                    <Title level={4}>Dernières inscriptions</Title>
                                    <Table
                                        dataSource={stats?.recentUsers || []}
                                        columns={userColumns.filter((col) => col.key !== 'actions' && col.key !== 'company')}
                                        rowKey="_id"
                                        pagination={false}
                                        size="middle"
                                    />
                                </>
                            )
                        },
                        {
                            key: '2',
                            label: (
                                <span>
                                    Entreprises en attente
                                    {stats?.stats?.pendingCompanies > 0 && <Badge count={stats.stats.pendingCompanies} style={{ marginLeft: 8 }} />}
                                </span>
                            ),
                            children: (
                                <>
                                    <Alert
                                        message="Modération des entreprises"
                                        description="Les entreprises listées ici attendent votre approbation avant de publier des offres ou d’apparaître dans l’annuaire."
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                    />
                                    <Input.Search
                                        placeholder="Rechercher une entreprise, un email ou un secteur..."
                                        allowClear
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                        onSearch={(value) => fetchPendingCompanies(value)}
                                        style={{ marginBottom: 16, maxWidth: 420 }}
                                    />
                                    <Table
                                        dataSource={companies}
                                        columns={companyColumns}
                                        rowKey="_id"
                                        loading={loadingTable}
                                        size="middle"
                                    />
                                </>
                            )
                        },
                        {
                            key: '3',
                            label: 'Tous les utilisateurs',
                            children: (
                                <>
                                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                                        <Input.Search
                                            placeholder="Rechercher un utilisateur..."
                                            allowClear
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            onSearch={(value) => fetchUsers({ search: value })}
                                            style={{ maxWidth: 320 }}
                                        />
                                        <Select
                                            allowClear
                                            placeholder="Filtrer par rôle"
                                            value={userRoleFilter}
                                            onChange={(value) => {
                                                setUserRoleFilter(value);
                                                fetchUsers({ role: value });
                                            }}
                                            style={{ width: 220 }}
                                            options={[
                                                { value: 'candidat', label: 'Candidat' },
                                                { value: 'HR', label: 'Recruteur' },
                                                { value: 'admin', label: 'Administrateur' },
                                            ]}
                                        />
                                        <Button onClick={() => fetchUsers()}>
                                            Actualiser
                                        </Button>
                                    </div>

                                    <Table
                                        dataSource={users}
                                        columns={userColumns}
                                        rowKey="_id"
                                        loading={loadingTable}
                                        pagination={{ pageSize: 15 }}
                                        size="middle"
                                    />
                                </>
                            )
                        }
                    ]}
                />
            </Card>

            <Modal
                title="Envoyer une notification"
                open={isNotifModalVisible}
                onCancel={() => setIsNotifModalVisible(false)}
                footer={null}
            >
                <Form
                    form={notifForm}
                    layout="vertical"
                    onFinish={handleSendNotification}
                    initialValues={{ broadcast: true, type: 'general' }}
                >
                    <Form.Item name="broadcast" label="Destinataires">
                        <Select
                            options={[
                                { value: true, label: 'Tous les utilisateurs' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Champ requis' }]}>
                        <Select
                            options={[
                                { value: 'general', label: 'Information' },
                                { value: 'success', label: 'Succès' },
                                { value: 'warning', label: 'Avertissement' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="title" label="Titre" rules={[{ required: true, message: 'Champ requis' }]}>
                        <Input placeholder="Ex: Maintenance planifiée" />
                    </Form.Item>
                    <Form.Item name="message" label="Contenu" rules={[{ required: true, message: 'Champ requis' }]}>
                        <Input.TextArea rows={4} placeholder="Message diffusé aux utilisateurs..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Diffuser maintenant
                    </Button>
                </Form>
            </Modal>

            <Modal
                title="Modifier l’utilisateur"
                open={Boolean(editingUser)}
                onCancel={() => {
                    setEditingUser(null);
                    editUserForm.resetFields();
                }}
                footer={null}
            >
                <Form form={editUserForm} layout="vertical" onFinish={handleSaveUser}>
                    <Form.Item label="Nom">
                        <Input value={editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : ''} disabled />
                    </Form.Item>
                    <Form.Item label="Email">
                        <Input value={editingUser?.email || ''} disabled />
                    </Form.Item>
                    <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Champ requis' }]}>
                        <Select
                            options={[
                                { value: 'candidat', label: 'Candidat' },
                                { value: 'HR', label: 'Recruteur' },
                                { value: 'admin', label: 'Administrateur' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        name="companyId"
                        label="Entreprise liée (optionnel)"
                        extra="Conservez vide pour dissocier l’utilisateur d’une entreprise."
                    >
                        <Input placeholder="ObjectId entreprise" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Enregistrer
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
