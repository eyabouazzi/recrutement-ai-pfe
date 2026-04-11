import { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Tag, Space } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { fetchAllSubmissions } from '../../api/submissions';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title } = Typography;

function Exports() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            setLoading(true);
            const data = await fetchAllSubmissions();
            setSubmissions(data.submissions || []);
        } catch (error) {
            message.error(error.message || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const rowsForExport = () =>
        submissions.map((sub) => ({
            Candidat: sub.candidateId ? `${sub.candidateId.firstName} ${sub.candidateId.lastName}` : 'Inconnu',
            Email: sub.candidateId ? sub.candidateId.email : '',
            Test: sub.testId ? sub.testId.title : 'Test supprimé',
            Poste: sub.testId ? sub.testId.jobRole : '',
            Score: sub.totalScore != null ? sub.totalScore : '',
            Date: new Date(sub.createdAt).toLocaleDateString('fr-FR'),
        }));

    const handleExportCSV = () => {
        if (submissions.length === 0) {
            message.warning('Aucune donnée à exporter.');
            return;
        }

        const headers = ['ID', 'Candidat', 'Email', 'Test', 'Poste', 'Score', 'Date'];
        const rows = submissions.map((sub) => [
            sub._id,
            sub.candidateId ? `${sub.candidateId.firstName} ${sub.candidateId.lastName}` : 'Inconnu',
            sub.candidateId ? sub.candidateId.email : '',
            sub.testId ? sub.testId.title : 'Test supprimé',
            sub.testId ? sub.testId.jobRole : '',
            sub.totalScore,
            new Date(sub.createdAt).toLocaleDateString(),
        ]);

        const csvContent = [headers.join(','), ...rows.map((e) => e.map((cell) => `"${cell}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `export_resultats_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        message.success('Export CSV réussi.');
    };

    const handleExportExcel = () => {
        if (submissions.length === 0) {
            message.warning('Aucune donnée à exporter.');
            return;
        }
        const data = rowsForExport();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
        XLSX.writeFile(wb, `export_resultats_${new Date().toISOString().slice(0, 10)}.xlsx`);
        message.success('Export Excel réussi.');
    };

    const handleExportPDF = () => {
        if (submissions.length === 0) {
            message.warning('Aucune donnée à exporter.');
            return;
        }
        const doc = new jsPDF({ orientation: 'landscape' });
        const head = [['Candidat', 'Email', 'Test', 'Poste', 'Score', 'Date']];
        const body = submissions.map((sub) => [
            sub.candidateId ? `${sub.candidateId.firstName} ${sub.candidateId.lastName}` : 'Inconnu',
            sub.candidateId ? sub.candidateId.email : '',
            sub.testId ? sub.testId.title : '',
            sub.testId ? sub.testId.jobRole : '',
            sub.totalScore != null ? String(sub.totalScore) : '—',
            new Date(sub.createdAt).toLocaleDateString('fr-FR'),
        ]);
        autoTable(doc, {
            head,
            body,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [19, 194, 194] },
        });
        doc.save(`export_resultats_${new Date().toISOString().slice(0, 10)}.pdf`);
        message.success('Export PDF réussi.');
    };

    const columns = [
        {
            title: 'Candidat',
            key: 'candidate',
            render: (_, record) =>
                record.candidateId ? `${record.candidateId.firstName} ${record.candidateId.lastName}` : 'Inconnu',
        },
        {
            title: 'Test',
            key: 'test',
            render: (_, record) => (record.testId ? record.testId.title : 'Test Supprimé'),
        },
        {
            title: 'Score',
            dataIndex: 'totalScore',
            key: 'score',
            render: (score) => {
                const color = score >= 50 ? 'green' : 'red';
                return <Tag color={color}>{score} %</Tag>;
            },
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleDateString(),
        },
    ];

    const disabled = submissions.length === 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <Title level={3} style={{ margin: 0 }}>
                    Exports PDF / Excel
                </Title>
                <Space wrap>
                    <Button icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={disabled}>
                        CSV
                    </Button>
                    <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportExcel} disabled={disabled}>
                        Excel (.xlsx)
                    </Button>
                    <Button icon={<FilePdfOutlined />} onClick={handleExportPDF} disabled={disabled}>
                        PDF
                    </Button>
                </Space>
            </div>

            <p style={{ marginBottom: 16 }}>Aperçu des données qui seront exportées :</p>

            <Table columns={columns} dataSource={submissions} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
        </div>
    );
}

export default Exports;
