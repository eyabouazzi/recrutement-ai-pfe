import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { fetchHrActivity } from '../../api/submissions';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const { Title, Text } = Typography;

export default function HRAudit() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await fetchHrActivity();
                setItems(data.items || []);
            } catch (e) {
                message.error(e.message || 'Chargement impossible');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div style={{ padding: '8px 0' }}>
            <Title level={3}>Journal des soumissions</Title>
            <Text type="secondary">
                Dernières copies reçues sur vos offres (même périmètre que votre espace RH).
            </Text>
            <Table
                style={{ marginTop: 24 }}
                loading={loading}
                size="small"
                rowKey="_id"
                dataSource={items}
                pagination={{ pageSize: 15 }}
                columns={[
                    {
                        title: 'Date',
                        key: 'd',
                        width: 140,
                        render: (_, r) =>
                            formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: fr }),
                    },
                    {
                        title: 'Candidat',
                        key: 'c',
                        render: (_, r) => {
                            const u = r.candidateId || {};
                            return `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—';
                        },
                    },
                    {
                        title: 'Offre / test',
                        key: 't',
                        ellipsis: true,
                        render: (_, r) => r.testId?.title || r.testId?.jobRole || '—',
                    },
                    {
                        title: 'Score',
                        dataIndex: 'totalScore',
                        width: 80,
                        render: (s) => (s != null ? `${s}` : '—'),
                    },
                    {
                        title: 'Seuil',
                        dataIndex: 'qualified',
                        width: 90,
                        render: (q) => <Tag color={q ? 'success' : 'default'}>{q ? 'OK' : '—'}</Tag>,
                    },
                    {
                        title: 'Signaux',
                        key: 'a',
                        width: 100,
                        render: (_, r) =>
                            r.anomalyFlags?.length ? (
                                <Tag color="warning">{r.anomalyFlags.length}</Tag>
                            ) : (
                                <Text type="secondary">—</Text>
                            ),
                    },
                    {
                        title: 'Trust',
                        key: 'trust',
                        width: 90,
                        render: (_, r) =>
                            r.trustScore != null ? (
                                <Tag color={r.trustScore >= 80 ? 'success' : r.trustScore >= 60 ? 'warning' : 'error'}>
                                    {r.trustScore}
                                </Tag>
                            ) : (
                                <Text type="secondary">—</Text>
                            ),
                    },
                    {
                        title: '',
                        key: 'act',
                        width: 120,
                        render: (_, r) => (
                            <Button type="link" size="small" onClick={() => navigate(`/rh/candidate/${r._id}`)}>
                                Dossier
                            </Button>
                        ),
                    },
                ]}
            />
        </div>
    );
}

