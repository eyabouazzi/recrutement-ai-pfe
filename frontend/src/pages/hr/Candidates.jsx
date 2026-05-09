import { useEffect, useState } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import { listUsers } from '../../api/users';

const { Title } = Typography;

function Candidates() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            setLoading(true);
            const data = await listUsers();
            if (data && data.users) {
                // Filter to only show candidates
                const filteredCandidates = data.users.filter(user => user.role === 'candidat');
                setCandidates(filteredCandidates);
            }
        } catch (error) {
            message.error(error.message || 'Échec de la récupération des candidats');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Nom',
            key: 'name',
            render: (_, record) => `${record.firstName} ${record.lastName}`,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Date de naissance',
            dataIndex: 'dob',
            key: 'dob',
            render: (text) => text ? new Date(text).toLocaleDateString() : 'Non renseigné'
        },
        {
            title: 'Rôle',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag color={role === 'HR' ? 'blue' : 'green'}>
                    {role.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Date de création',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleDateString()
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Liste des Candidats</Title>
                <p style={{ color: '#666' }}>Alerte: Cette page affiche uniquement les utilisateurs avec le rôle 'candidat'.</p>
            </div>

            <Table
                columns={columns}
                dataSource={candidates}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}

export default Candidates;
