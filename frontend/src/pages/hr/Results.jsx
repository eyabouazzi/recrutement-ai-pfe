import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Space, Button, Spin, message, Modal, Input, Progress, Row, Col, Card, Statistic, Select, DatePicker, Slider, Tooltip, Avatar } from 'antd';
import { fetchAllSubmissions, fetchSubmissionDetails } from '../../api/submissions';
import { EyeOutlined, SearchOutlined, DownloadOutlined, UsergroupAddOutlined, FilePdfOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

function hasPasteAlert(submission) {
    if (!submission) return false;
    const pasteCount = Number(submission?.behaviorData?.pasteCount || 0);
    const anomalyFlags = Array.isArray(submission?.anomalyFlags) ? submission.anomalyFlags : [];
    const hasPasteFlag = anomalyFlags.some((flag) =>
        ['EXCESSIVE_PASTE', 'LOW_TYPING_ACTIVITY_LONG_ANSWERS'].includes(String(flag?.code || ''))
    );
    return pasteCount >= 4 || hasPasteFlag;
}

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
    const pasteAlertCount = filteredSubmissions.filter((s) => hasPasteAlert(s)).length;

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
            title: 'Alerte collage',
            key: 'pasteAlert',
            render: (_, record) => {
                const alert = hasPasteAlert(record);
                const pasteCount = Number(record?.behaviorData?.pasteCount || 0);
                return alert ? (
                    <Tag color="volcano">
                        Alerte ({pasteCount} collage{pasteCount > 1 ? 's' : ''})
                    </Tag>
                ) : (
                    <Tag color="default">RAS</Tag>
                );
            },
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
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Alertes collage" value={pasteAlertCount} />
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
                title={null}
                open={compareOpen}
                onCancel={() => setCompareOpen(false)}
                width={1100}
                styles={{ body: { padding: 0, background: '#f8fafc', borderRadius: 20 } }}
                footer={null}
                style={{ top: 20 }}
            >
                <CandidateComparePanel
                    rows={compareRows}
                    onClose={() => setCompareOpen(false)}
                    onExportPdf={exportComparePdf}
                />
            </Modal>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   ADVANCED CANDIDATE COMPARISON PANEL
   ═══════════════════════════════════════════════════ */
function ScoreRing({ score, size = 80, color }) {
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    const fill = (score / 100) * circ;
    const c = color || (score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444');
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={8}
                strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                style={{ fill: c, fontSize: size * 0.22, fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: 'center', fontFamily: 'Inter, sans-serif' }}>
                {score}%
            </text>
        </svg>
    );
}

function CompetencyBar({ label, scores, maxScore, winner }) {
    const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</Text>
                <Tag color="geekblue" style={{ fontSize: 10, margin: 0 }}>Max: {maxScore}</Tag>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
                {scores.map((s, i) => (
                    <Tooltip key={i} title={`${s.name}: ${s.score}`}>
                        <div style={{ flex: 1, height: 28, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden', position: 'relative', border: winner === i ? `2px solid ${COLORS[i]}` : '2px solid transparent' }}>
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: `${Math.min(100, (s.score / Math.max(maxScore, 1)) * 100)}%`,
                                background: COLORS[i], opacity: 0.85,
                                borderRadius: 4, transition: 'width 0.7s ease',
                            }} />
                            <span style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 700, color: '#fff', padding: '0 8px', lineHeight: '28px', mixBlendMode: 'difference' }}>
                                {s.score}
                            </span>
                        </div>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
}

function CandidateComparePanel({ rows, onClose, onExportPdf }) {
    if (!rows || rows.length === 0) return null;
    const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
    const MEDALS = ['🥇', '🥈', '🥉'];

    // Sort by total score descending to get ranking
    const ranked = [...rows].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    const rankMap = {};
    ranked.forEach((r, i) => { rankMap[r._id] = i; });

    // Gather all unique competency names
    const allCompetencies = [...new Set(
        rows.flatMap(r => (r.competencyBreakdown || []).map(c => c.competency))
    )];

    // Gather all dimension keys from matchEngine
    const allDimensions = [...new Set(
        rows.flatMap(r => Object.keys(r.jobMatchAnalysis?.matchEngine?.dimensions || {}))
    )].slice(0, 8);

    const getName = (r) => `${r.candidateId?.firstName || ''} ${r.candidateId?.lastName || ''}`.trim() || 'Candidat';
    const getInitials = (r) => {
        const n = getName(r);
        return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div style={{ background: '#f8fafc', borderRadius: 20, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                padding: '24px 32px', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>⚡ Comparaison IA avancée</div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                        {rows.length} candidats · {rows[0]?.testId?.jobRole || rows[0]?.testId?.title || 'Poste'}
                    </div>
                </div>
                <Space>
                    <Button icon={<FilePdfOutlined />} onClick={onExportPdf} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>PDF</Button>
                    <Button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>✕ Fermer</Button>
                </Space>
            </div>

            <div style={{ padding: '28px 32px', display: 'grid', gap: 24, maxHeight: '78vh', overflowY: 'auto' }}>

                {/* Podium / Score Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${rows.length}, 1fr)`, gap: 14 }}>
                    {ranked.map((r, idx) => {
                        const score = r.totalScore || 0;
                        const matchScore = r.jobMatchAnalysis?.score || 0;
                        const trust = r.trustScore ?? 100;
                        const color = COLORS[idx % COLORS.length];
                        return (
                            <div key={r._id} style={{
                                background: '#fff', borderRadius: 18, padding: '22px 18px',
                                border: `2px solid ${idx === 0 ? '#f59e0b' : '#e2e8f0'}`,
                                boxShadow: idx === 0 ? '0 8px 28px rgba(245,158,11,0.14)' : '0 2px 12px rgba(15,23,42,0.06)',
                                textAlign: 'center', position: 'relative',
                            }}>
                                {idx < 3 && (
                                    <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 20 }}>{MEDALS[idx]}</div>
                                )}
                                <Avatar size={52} style={{ background: color, fontWeight: 800, fontSize: 18, marginBottom: 10 }}>
                                    {getInitials(r)}
                                </Avatar>
                                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{getName(r)}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>{r.candidateId?.email}</div>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                                    <ScoreRing score={score} size={88} color={color} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 6px' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: matchScore >= 70 ? '#10b981' : matchScore >= 50 ? '#f59e0b' : '#ef4444' }}>{matchScore}%</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Match CV</div>
                                    </div>
                                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '8px 6px' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: trust >= 80 ? '#10b981' : trust >= 60 ? '#f59e0b' : '#ef4444' }}>{trust}</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Confiance</div>
                                    </div>
                                </div>
                                {r.qualified && (
                                    <Tag color="success" style={{ marginTop: 10, borderRadius: 20, fontWeight: 700 }}>✓ Qualifié</Tag>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Competency Heatmap */}
                {allCompetencies.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                            <div style={{ fontSize: 16 }}>🧠</div>
                            <Title level={5} style={{ margin: 0 }}>Compétences comparées</Title>
                            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                                {ranked.map((r, i) => (
                                    <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i] }} />
                                        <Text style={{ fontSize: 11 }}>{getName(r).split(' ')[0]}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {allCompetencies.map((comp) => {
                            const scores = ranked.map(r => ({
                                name: getName(r),
                                score: (r.competencyBreakdown || []).find(c => c.competency === comp)?.score ?? 0,
                            }));
                            const maxScore = Math.max(...scores.map(s => s.score));
                            const winner = scores.findIndex(s => s.score === maxScore);
                            return <CompetencyBar key={comp} label={comp} scores={scores} maxScore={maxScore} winner={winner} />;
                        })}
                    </div>
                )}

                {/* AI Match Dimensions */}
                {allDimensions.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                            <div style={{ fontSize: 16 }}>🎯</div>
                            <Title level={5} style={{ margin: 0 }}>Dimensions de matching IA</Title>
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {allDimensions.map((dim) => {
                                const scores = ranked.map(r => ({
                                    name: getName(r),
                                    score: Math.round((r.jobMatchAnalysis?.matchEngine?.dimensions?.[dim] || 0) * 100),
                                }));
                                const maxScore = Math.max(...scores.map(s => s.score));
                                const winner = scores.findIndex(s => s.score === maxScore);
                                const label = dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                return <CompetencyBar key={dim} label={label} scores={scores} maxScore={maxScore} winner={winner} />;
                            })}
                        </div>
                    </div>
                )}

                {/* Enriched CV Signals grid */}
                <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <div style={{ fontSize: 16 }}>🔍</div>
                        <Title level={5} style={{ margin: 0 }}>Signaux CV enrichis</Title>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ranked.length}, 1fr)`, gap: 12 }}>
                        {ranked.map((r, idx) => {
                            const sig = r.jobMatchAnalysis?.enrichedCvSignals || {};
                            const color = COLORS[idx % COLORS.length];
                            return (
                                <div key={r._id} style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 14px', borderTop: `3px solid ${color}` }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#0f172a' }}>{getName(r).split(' ')[0]}</div>
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {sig.educationLevel && <div style={{ fontSize: 12 }}>🎓 <Tag color="blue" style={{ fontSize: 10 }}>{sig.educationLevel}</Tag></div>}
                                        {sig.certifications?.length > 0 && (
                                            <div style={{ fontSize: 12 }}>🏅 {sig.certifications.slice(0, 3).map(c => <Tag key={c} color="gold" style={{ fontSize: 10, marginBottom: 2 }}>{c}</Tag>)}</div>
                                        )}
                                        {sig.languages?.length > 0 && (
                                            <div style={{ fontSize: 12 }}>🌐 {sig.languages.map(l => <Tag key={l} color="cyan" style={{ fontSize: 10, marginBottom: 2 }}>{l}</Tag>)}</div>
                                        )}
                                        {sig.industryDomains?.length > 0 && (
                                            <div style={{ fontSize: 12 }}>🏢 {sig.industryDomains.slice(0, 2).map(d => <Tag key={d} color="purple" style={{ fontSize: 10, marginBottom: 2 }}>{d}</Tag>)}</div>
                                        )}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                            {sig.hasOpenSourceContributions && <Tag color="green" style={{ fontSize: 10 }}>Open Source ✓</Tag>}
                                            {sig.hasLiveProjects && <Tag color="geekblue" style={{ fontSize: 10 }}>Projets live ✓</Tag>}
                                            {sig.quantifiedAchievements > 0 && <Tag color="orange" style={{ fontSize: 10 }}>{sig.quantifiedAchievements} réalisations</Tag>}
                                            {sig.leadershipSignals > 0 && <Tag color="red" style={{ fontSize: 10 }}>Leadership ×{sig.leadershipSignals}</Tag>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Integrity & Trust */}
                <div style={{ background: '#fff', borderRadius: 18, padding: '22px 24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <div style={{ fontSize: 16 }}>🛡️</div>
                        <Title level={5} style={{ margin: 0 }}>Intégrité & Comportement</Title>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ranked.length}, 1fr)`, gap: 12 }}>
                        {ranked.map((r, idx) => {
                            const trust = r.trustScore ?? 100;
                            const flags = (r.anomalyFlags || []).length;
                            const paste = r.behaviorData?.pasteCount || 0;
                            const tabSwitch = r.behaviorData?.tabSwitches || 0;
                            const color = COLORS[idx % COLORS.length];
                            return (
                                <div key={r._id} style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 14px', borderTop: `3px solid ${color}` }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#0f172a' }}>{getName(r).split(' ')[0]}</div>
                                    <div style={{ display: 'grid', gap: 8 }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={{ fontSize: 11, color: '#64748b' }}>Score de confiance</Text>
                                                <Text style={{ fontSize: 11, fontWeight: 700, color: trust >= 80 ? '#10b981' : trust >= 60 ? '#f59e0b' : '#ef4444' }}>{trust}/100</Text>
                                            </div>
                                            <Progress percent={trust} showInfo={false} strokeColor={trust >= 80 ? '#10b981' : trust >= 60 ? '#f59e0b' : '#ef4444'} size="small" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: flags > 0 ? '#ef4444' : '#10b981' }}>{flags}</div>
                                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Anomalies</div>
                                            </div>
                                            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: paste >= 4 ? '#ef4444' : '#10b981' }}>{paste}</div>
                                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Collages</div>
                                            </div>
                                            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: tabSwitch > 5 ? '#f59e0b' : '#10b981' }}>{tabSwitch}</div>
                                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Changem. onglet</div>
                                            </div>
                                            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                                                <Tag color={r.qualified ? 'success' : 'default'} style={{ margin: 0, fontSize: 11, fontWeight: 700 }}>
                                                    {r.qualified ? '✓ Qualifié' : 'Non qualifié'}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI Verdict */}
                <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 18, padding: '22px 24px', border: '1px solid #c4b5fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ fontSize: 16 }}>🤖</div>
                        <Title level={5} style={{ margin: 0, color: '#6366f1' }}>Verdict IA — Candidat recommandé</Title>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(ranked.length, 3)}, 1fr)`, gap: 12 }}>
                        {ranked.slice(0, 3).map((r, idx) => {
                            const score = r.totalScore || 0;
                            const matchScore = r.jobMatchAnalysis?.score || 0;
                            const composite = Math.round(score * 0.5 + matchScore * 0.3 + (r.trustScore || 100) * 0.2);
                            return (
                                <div key={r._id} style={{ background: '#fff', borderRadius: 14, padding: '16px', borderLeft: `4px solid ${COLORS[idx]}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 20 }}>{MEDALS[idx] || '🏅'}</span>
                                        <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{getName(r)}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 8 }}>
                                        Score composite: <strong style={{ color: COLORS[idx] }}>{composite}/100</strong>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>
                                        {r.jobMatchAnalysis?.summary ? r.jobMatchAnalysis.summary.slice(0, 100) + '…' : 'Analyse disponible sur la fiche candidat.'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default HRResults;
