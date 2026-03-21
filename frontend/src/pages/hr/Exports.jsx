import { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Tag } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { fetchAllSubmissions } from '../../api/submissions';

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

    const handleExportCSV = () => {
        if (submissions.length === 0) {
            message.warning("Aucune donnée à exporter.");
            return;
        }

        const headers = ["ID", "Candidat", "Email", "Test", "Poste", "Score", "Date"];
        const rows = submissions.map(sub => [
            sub._id,
            sub.candidateId ? `${sub.candidateId.firstName} ${sub.candidateId.lastName}` : 'Inconnu',
            sub.candidateId ? sub.candidateId.email : '',
            sub.testId ? sub.testId.title : 'Test supprimé',
            sub.testId ? sub.testId.jobRole : '',
            sub.totalScore,
            new Date(sub.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `export_resultats_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        message.success("Export réussi!");
    };


    const columns = [
        {
            title: 'Candidat',
            key: 'candidate',
            render: (_, record) => record.candidateId ? `${record.candidateId.firstName} ${record.candidateId.lastName}` : 'Inconnu'
        },
        {
            title: 'Test',
            key: 'test',
            render: (_, record) => record.testId ? record.testId.title : 'Test Supprimé'
        },
        {
            title: 'Score',
            dataIndex: 'totalScore',
            key: 'score',
            render: (score) => {
                let color = score >= 50 ? 'green' : 'red';
                return <Tag color={color}>{score} %</Tag>;
            }
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleDateString()
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Exports PDF / Excel</Title>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV} disabled={submissions.length === 0}>
                    Exporter en CSV
                </Button>
            </div>

            <p style={{ marginBottom: 16 }}>Aperçu des données qui seront exportées:</p>

            <Table
                columns={columns}
                dataSource={submissions}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
}

export default Exports;
