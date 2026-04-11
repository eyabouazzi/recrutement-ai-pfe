import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Space, Button, Spin, message, Modal, Input, Progress, Row, Col, Card, Statistic, Select, DatePicker, Slider } from 'antd';
import { fetchAllSubmissions, fetchSubmissionDetails } from '../../api/submissions';
import { EyeOutlined, SearchOutlined, DownloadOutlined, UsergroupAddOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

function HRResults() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [tableFilters, setTableFilters] = useState({});
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [compareOpen, setCompareOpen] = useState(false);
    const [compareRows, setCompareRows] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [selectedJobRole, setSelectedJobRole] = useState('all');
    const [scoreRange, setScoreRange] = useState([0, 100]);
    const [dateRange, setDateRange] = useState([null, null]);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            const data = await fetchAllSubmissions();
            setSubmissions(data.submissions || []);
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
                candidate: submissions.find(s => s._id === id)?.candidateId
            });
            setModalVisible(true);
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleTableChange = (pagination, filters) => {
        setTableFilters(filters);
    };

    const onSelectChange = (keys) => {
        setSelectedRowKeys(keys);
    };

    const filteredSubmissions = submissions.filter(sub => {
        const candidateName = `${sub.candidateId?.firstName || ''} ${sub.candidateId?.lastName || ''}`.toLowerCase();
        const testTitle = (sub.testId?.title || '').toLowerCase();
        const search = searchText.toLowerCase();

        const matchesSearch = candidateName.includes(search) || testTitle.includes(search);

        const matchesFilters = Object.keys(tableFilters).every(key => {
            const value = tableFilters[key];
            if (!value || value.length === 0) return true;
            if (key === 'status') return value.includes(sub.status);
            if (key === 'jobRole') return value.includes(sub.testId?.jobRole);
            return true;
        });

        const roleMatch = selectedJobRole === 'all' || sub.testId?.jobRole === selectedJobRole;
        const scoreMatch = sub.totalScore == null || (sub.totalScore >= scoreRange[0] && sub.totalScore <= scoreRange[1]);
        const createdAt = dayjs(sub.createdAt);
        const start = dateRange[0];
        const end = dateRange[1];
        const afterStart = start ? (createdAt.isAfter(start.startOf('day')) || createdAt.isSame(start.startOf('day'))) : true;
        const beforeEnd = end ? (createdAt.isBefore(end.endOf('day')) || createdAt.isSame(end.endOf('day'))) : true;
        const dateMatch = afterStart && beforeEnd;

        return matchesSearch && matchesFilters && roleMatch && scoreMatch && dateMatch;
    });

    const graded = filteredSubmissions.filter((s) => s.status === 'GRADED' && s.totalScore != null);
    const avgScore = graded.length ? Math.round(graded.reduce((acc, s) => acc + (s.totalScore || 0), 0) / graded.length) : 0;
    const passedCount = graded.filter((s) => (s.qualified || (s.totalScore || 0) >= 50)).length;
    const pendingCount = filteredSubmissions.filter((s) => s.status !== 'GRADED').length;

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
    
    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const handleCompare = async () => {
        if (selectedRowKeys.length < 2) {
            message.warning('Veuillez sélectionner au moins 2 candidats pour comparer.');
            return;
        }
        
        // Filter selected submissions from current filtered list
        const picked = filteredSubmissions.filter((s) => selectedRowKeys.includes(s._id));
        
        if (picked.length < 2) {
            message.warning('Les candidats sélectionnés ne sont pas dans la liste filtrée actuelle.');
            return;
        }
        
        // Check if all selected candidates took the same test
        const firstTestId = picked[0]?.testId?._id || picked[0]?.testId;
        const sameTest = picked.every((s) => {
            const currentTestId = s.testId?._id || s.testId;
            return currentTestId && currentTestId.toString() === firstTestId.toString();
        });
        
        if (!sameTest) {
            message.warning('Tous les candidats sélectionnés doivent avoir passé le même test pour pouvoir les comparer.');
            return;
        }
        
        try {
            setCompareLoading(true);
            message.loading({ content: 'Chargement des détails...', key: 'compare' });
            
            const rows = await Promise.all(
                selectedRowKeys.map(async (key) => {
                    try {
                        const { submission } = await fetchSubmissionDetails(key);
                        return submission;
                    } catch (err) {
                        console.error(`Failed to fetch submission ${key}:`, err);
                        return null;
                    }
                })
            );
            
            // Filter out any failed fetches
            const validRows = rows.filter(r => r !== null);
            
            if (validRows.length < 2) {
                message.error({ content: 'Impossible de charger les détails de certains candidats.', key: 'compare' });
                return;
            }
            
            setCompareRows(validRows);
            setCompareOpen(true);
            message.success({ content: `${validRows.length} candidats chargés pour comparaison`, key: 'compare', duration: 2 });
        } catch (e) {
            console.error('Comparison error:', e);
            message.error({ content: e.message || 'Impossible de charger la comparaison', key: 'compare' });
        } finally {
            setCompareLoading(false);
        }
    };

    const exportComparePdf = () => {
        try {
            if (!Array.isArray(compareRows) || compareRows.length === 0) {
                message.warning('Aucune comparaison à exporter.');
                return;
            }

            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('Comparaison des candidats', 14, 16);
            doc.setFontSize(10);
            doc.text(`Nombre de candidats: ${compareRows.length}`, 14, 24);

            const body = compareRows.map((r) => {
                const candidate = `${r.candidateId?.firstName || ''} ${r.candidateId?.lastName || ''}`.trim();
                const email = r.candidateId?.email || '—';
                const score = r.totalScore !== null && r.totalScore !== undefined ? `${r.totalScore} / 100` : 'N/A';
                const seuil = r.qualified ? 'OK' : '—';
                const skills = (r.competencyBreakdown || [])
                    .slice(0, 3)
                    .map((c) => `${c.competency}: ${c.score}`)
                    .join(' · ') || '—';
                return [candidate, email, score, seuil, skills];
            });

            autoTable(doc, {
                startY: 32,
                head: [['Candidat', 'Email', 'Score', 'Seuil', 'Compétences (aperçu)']],
                body,
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 45 },
                    4: { cellWidth: 'auto' },
                },
            });

            doc.save('comparaison_candidats.pdf');
        } catch (e) {
            message.error(e.message || 'Erreur lors de l’export PDF');
        }
    };

    const uniqueJobRoles = [...new Set(submissions.map(s => s.testId?.jobRole).filter(Boolean))]
        .map(role => ({ text: role, value: role }));
    const selectJobOptions = ['all', ...new Set(submissions.map((s) => s.testId?.jobRole).filter(Boolean))];

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
            filters: uniqueJobRoles,
        },
        {
            title: 'Date de passage',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val) => new Date(val).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'GRADED' ? 'success' : 'processing'}>
                    {status === 'GRADED' ? 'Évalué' : 'En attente'}
                </Tag>
            ),
            filters: [
                { text: 'Évalué', value: 'GRADED' },
                { text: 'En attente', value: 'PENDING' }
            ],
        },
        {
            title: 'Score',
            dataIndex: 'totalScore',
            key: 'score',
            render: (score) => score !== null ? <strong style={{ color: score >= 50 ? '#52c41a' : '#f5222d' }}>{score} / 100</strong> : '-',
            sorter: (a, b) => (a.totalScore || 0) - (b.totalScore || 0),
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
                <Space>
                    <Input
                        placeholder="Chercher un candidat ou un test"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 250 }}
                    />
                    <Button 
                        type="primary" 
                        icon={<UsergroupAddOutlined />} 
                        disabled={selectedRowKeys.length < 2}
                        loading={compareLoading}
                        onClick={handleCompare}
                    >
                        Comparer ({selectedRowKeys.length})
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
                        Exporter Excel
                    </Button>
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={8} lg={6}>
                    <Select
                        value={selectedJobRole}
                        onChange={setSelectedJobRole}
                        style={{ width: '100%' }}
                        options={selectJobOptions.map((role) => ({
                            value: role,
                            label: role === 'all' ? 'Tous les postes' : role,
                        }))}
                    />
                </Col>
                <Col xs={24} md={8} lg={6}>
                    <DatePicker.RangePicker
                        value={dateRange}
                        onChange={(vals) => setDateRange(vals || [null, null])}
                        style={{ width: '100%' }}
                        placeholder={['Date debut', 'Date fin']}
                    />
                </Col>
                <Col xs={24} md={8} lg={8}>
                    <div style={{ padding: '4px 12px' }}>
                        <Text type="secondary">Plage de score: {scoreRange[0]} - {scoreRange[1]}</Text>
                        <Slider range min={0} max={100} value={scoreRange} onChange={setScoreRange} />
                    </div>
                </Col>
                <Col xs={24} lg={4}>
                    <Button
                        block
                        onClick={() => {
                            setSelectedJobRole('all');
                            setDateRange([null, null]);
                            setScoreRange([0, 100]);
                            setSearchText('');
                        }}
                    >
                        Reinitialiser
                    </Button>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Candidatures filtrees" value={filteredSubmissions.length} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Score moyen" value={avgScore} suffix="/ 100" />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Au seuil / qualifies" value={passedCount} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="En attente de correction" value={pendingCount} />
                    </Card>
                </Col>
            </Row>

            <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={filteredSubmissions}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                onChange={handleTableChange}
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

                        {Array.isArray(selectedDetail.competencyBreakdown) && selectedDetail.competencyBreakdown.length > 0 && (
                            <div style={{ marginTop: 24 }}>
                                <Title level={5}>Synthèse par compétence</Title>
                                <Table
                                    size="small"
                                    pagination={false}
                                    rowKey={(r, i) => `${r.competency}-${i}`}
                                    dataSource={selectedDetail.competencyBreakdown}
                                    columns={[
                                        { title: 'Compétence', dataIndex: 'competency', key: 'c' },
                                        {
                                            title: 'Score',
                                            dataIndex: 'score',
                                            key: 's',
                                            width: 200,
                                            render: (s) => <Progress percent={s} size="small" status={s >= 60 ? 'success' : s >= 40 ? 'normal' : 'exception'} />,
                                        },
                                        { title: 'Commentaire', dataIndex: 'comment', key: 'm', ellipsis: true },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                ) : <Spin />}
            </Modal>

            <Modal
                title="Comparaison des candidats"
                open={compareOpen}
                onCancel={() => setCompareOpen(false)}
                width={960}
                footer={[
                    <Button key="pdf" icon={<FilePdfOutlined />} onClick={exportComparePdf}>
                        Exporter PDF
                    </Button>,
                    <Button key="x" onClick={() => setCompareOpen(false)}>Fermer</Button>,
                ]}
            >
                <Table
                    size="small"
                    pagination={false}
                    rowKey="_id"
                    dataSource={compareRows}
                    columns={[
                        {
                            title: 'Candidat',
                            key: 'n',
                            render: (_, r) =>
                                `${r.candidateId?.firstName || ''} ${r.candidateId?.lastName || ''}`,
                        },
                        { title: 'Email', key: 'e', render: (_, r) => r.candidateId?.email || '—' },
                        {
                            title: 'Score',
                            dataIndex: 'totalScore',
                            sorter: (a, b) => (a.totalScore || 0) - (b.totalScore || 0),
                        },
                        {
                            title: 'Seuil',
                            dataIndex: 'qualified',
                            render: (q) => <Tag color={q ? 'success' : 'default'}>{q ? 'OK' : '—'}</Tag>,
                        },
                        {
                            title: 'Compétences (aperçu)',
                            key: 'c',
                            render: (_, r) =>
                                (r.competencyBreakdown || [])
                                    .slice(0, 3)
                                    .map((c) => `${c.competency}: ${c.score}`)
                                    .join(' · ') || '—',
                        },
                    ]}
                />
            </Modal>
        </div>
    );
}

export default HRResults;
