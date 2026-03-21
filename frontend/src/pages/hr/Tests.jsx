import { useState, useEffect } from 'react';
import { Button, Space, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getTests } from '../../api/tests';
import { EnhancedTable, tableActions } from '../../components/EnhancedTable';
import { PageLoader } from '../../components/LoadingSkeletons';
import { useNotifications } from '../../contexts/NotificationContext';

const { Title, Text } = Typography;

function Tests() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { success, error } = useNotifications();

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const data = await getTests();
            setTests(data.tests || []);
            success('Tests chargés avec succès');
        } catch (err) {
            error('Erreur', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        navigate(`/rh/tests/edit/${record._id}`);
    };

    const columns = [
        {
            title: 'Titre de l\'offre',
            dataIndex: 'title',
            key: 'title',
            searchable: true,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Poste',
            dataIndex: 'jobRole',
            key: 'jobRole',
            searchable: true
        },
        {
            title: 'Localisation',
            dataIndex: 'location',
            key: 'location',
            render: (text) => text || 'Remote'
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Brouillon', value: 'DRAFT' },
                { text: 'Publiée', value: 'PUBLISHED' },
                { text: 'Fermée', value: 'CLOSED' }
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => (
                <Tag color={status === 'PUBLISHED' ? 'green' : status === 'CLOSED' ? 'red' : 'orange'}>
                    {status === 'PUBLISHED' ? 'Publiée' : status === 'CLOSED' ? 'Fermée' : 'Brouillon'}
                </Tag>
            )
        },
        {
            title: 'Créé le',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => new Date(date).toLocaleDateString('fr-FR')
        }
    ];

    const actions = [
        {
            ...tableActions.edit,
            onClick: handleEdit
        }
    ];

    const filters = [
        {
            key: 'status',
            label: 'Statut',
            type: 'select',
            options: [
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'PUBLISHED', label: 'Publiée' },
                { value: 'CLOSED', label: 'Fermée' }
            ]
        },
        {
            key: 'jobRole',
            label: 'Poste',
            type: 'select',
            multiple: true,
            options: [...new Set(tests.map(t => t.jobRole))].filter(Boolean).map(role => ({
                value: role,
                label: role
            }))
        }
    ];

    if (loading) {
        return <PageLoader />;
    }

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Gestion des Offres d'emploi</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/rh/tests/create')}>
                    Nouvelle Offre
                </Button>
            </div>

            <EnhancedTable
                data={tests}
                columns={columns}
                loading={loading}
                actions={actions}
                filters={filters}
                onRowClick={handleEdit}
                searchable
                filterable
                exportable
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                }}
            />
        </div>
    );
}

export default Tests;
