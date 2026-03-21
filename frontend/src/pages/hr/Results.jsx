import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Space, Button, Spin, message, Modal, Input } from 'antd';
import { fetchAllSubmissions, fetchSubmissionDetails } from '../../api/submissions';
import { EyeOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;

function HRResults() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            const data = await fetchAllSubmissions();
            setSubmissions(data.submissions);
        } catch (error) {
            message.error(error.message || 'Impossible de charger les résultats');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const data = await fetchSubmissionDetails(id);
            setSelectedDetail({
                ...data.submission,
                // We'll also attach candidate details from the list view since GET /:id only populates testId by default (or we can update it later).
                candidate: submissions.find(s => s._id === id)?.candidateId
            });
            setModalVisible(true);
        } catch (error) {
            message.error(error.message);
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        const candidateName = `${sub.candidateId?.firstName || ''} ${sub.candidateId?.lastName || ''}`.toLowerCase();
        const testTitle = (sub.testId?.title || '').toLowerCase();
        const search = searchText.toLowerCase();
        return candidateName.includes(search) || testTitle.includes(search);
    });

    const exportToExcel = () => {
        const dataToExport = filteredSubmissions.map(sub => ({
            Candidat: `${sub.candidateId?.firstName || ''} ${sub.candidateId?.lastName || ''}`,
            Email: sub.candidateId?.email || '',
            Test: sub.testId?.title || '',
            Poste: sub.testId?.jobRole || '',
            Date: new Date(sub.createdAt).toLocaleDateString(),
            Statut: sub.status === 'GRADED' ? 'Évalué' : 'En attente',
            Score: sub.totalScore !== null ? `${sub.totalScore} / 100` : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Résultats");
        XLSX.writeFile(wb, "resultats_candidats.xlsx");
    };

    const columns = [
        {
            title: 'Candidat',
            key: 'candidate',
            render: (_, record) => `${record.candidateId?.firstName || ''} ${record.candidateId?.lastName || ''}`
        },
        {
            title: 'Test',
            dataIndex: ['testId', 'title'],
            key: 'testTitle',
        },
        {
            title: 'Poste',
            dataIndex: ['testId', 'jobRole'],
            key: 'jobRole',
        },
        {
            title: 'Date de passage',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val) => new Date(val).toLocaleDateString()
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'GRADED' ? 'success' : 'processing'}>
                    {status === 'GRADED' ? 'Évalué' : 'En attente'}
                </Tag>
            )
        },
        {
            title: 'Score',
            dataIndex: 'totalScore',
            key: 'score',
            render: (score) => score !== null ? <strong style={{ color: score >= 50 ? '#52c41a' : '#f5222d' }}>{score} / 100</strong> : '-'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    disabled={record.status !== 'GRADED'}
                    onClick={() => handleViewDetails(record._id)}
                >
                    Voir
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Résultats des Candidats</Title>
                <Input
                    placeholder="Chercher un candidat ou un test"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                />
                <Button type="primary" icon={<DownloadOutlined />} onClick={exportToExcel} style={{ marginLeft: 16 }}>
                    Exporter Excel
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={filteredSubmissions}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title="Détails de l'évaluation"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
                        Fermer
                    </Button>
                ]}
                width={800}
            >
                {selectedDetail ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <div>
                                <Title level={5} style={{ margin: 0 }}>Candidat : {selectedDetail.candidate?.firstName} {selectedDetail.candidate?.lastName}</Title>
                                <Text type="secondary">{selectedDetail.candidate?.email}</Text>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text strong>Score Global : </Text>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: selectedDetail.totalScore >= 50 ? '#52c41a' : '#f5222d' }}>
                                    {selectedDetail.totalScore} / 100
                                </Text>
                            </div>
                        </div>

                        <div>
                            <Title level={5}>Test: {selectedDetail.testId?.title} ({selectedDetail.testId?.jobRole})</Title>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <Title level={5}>Feedback IA et Analyse Détaillée</Title>
                            <div style={{ background: '#f0f5ff', padding: 20, borderRadius: 8, border: '1px solid #d6e4ff' }}>
                                <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>
                                    {selectedDetail.feedback}
                                </Paragraph>
                            </div>
                        </div>
                    </div>
                ) : <Spin />}
            </Modal>
        </div>
    );
}

export default HRResults;
