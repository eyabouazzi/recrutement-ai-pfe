import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, Typography, Button, Tag, Spin, Result, Space } from 'antd';
import { fetchSubmissionDetails } from '../../api/submissions';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function TestComplete() {
    const location = useLocation();
    const navigate = useNavigate();
    const submissionId = location.state?.submissionId;
    const [loading, setLoading] = useState(!!submissionId);
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        if (!submissionId) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const data = await fetchSubmissionDetails(submissionId);
                setDetail(data.submission);
            } catch {
                navigate('/mes-resultats', { replace: true });
            } finally {
                setLoading(false);
            }
        })();
    }, [submissionId, navigate]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 80 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!submissionId || !detail) {
        return (
            <div style={{ maxWidth: 560, margin: '48px auto' }}>
                <Result
                    status="info"
                    title="Résumé non disponible"
                    subTitle="Ouvrez cette page depuis la fin d’un test ou consultez vos résultats."
                    extra={
                        <Link to="/mes-resultats">
                            <Button type="primary">Mes résultats</Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    const qual = detail.qualified;
    const thr = detail.testId?.passThreshold ?? 50;

    return (
        <div style={{ maxWidth: 640, margin: '32px auto', padding: 16 }}>
            <Result
                icon={qual ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : <CloseCircleOutlined style={{ color: '#f59e0b' }} />}
                title={qual ? 'Test terminé — seuil atteint' : 'Test terminé'}
                subTitle={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text>{detail.testId?.title}</Text>
                        <Text type="secondary">{detail.testId?.jobRole}</Text>
                    </Space>
                }
            />
            <Card style={{ marginTop: 24 }}>
                <Title level={4}>Votre score</Title>
                <Paragraph>
                    <Tag color={detail.totalScore >= thr ? 'success' : 'warning'} style={{ fontSize: 18, padding: '6px 12px' }}>
                        {detail.totalScore} / 100
                    </Tag>
                    <Text type="secondary" style={{ marginLeft: 12 }}>
                        Seuil de référence : {thr}%
                    </Text>
                </Paragraph>
                {detail.feedback && (
                    <>
                        <Title level={5}>Commentaire</Title>
                        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{detail.feedback}</Paragraph>
                    </>
                )}
                {typeof detail.trustScore === 'number' && (
                    <Paragraph>
                        <Text strong>Score de confiance anti-triche:</Text> {detail.trustScore}/100
                    </Paragraph>
                )}
                {detail.anomalyFlags?.length > 0 && (
                    <Paragraph type="warning">
                        Votre copie présente des signaux automatiques (rythme, réponses vides, etc.). Le recruteur pourra en tenir compte.
                    </Paragraph>
                )}
                <Space style={{ marginTop: 24 }}>
                    <Link to="/mes-resultats">
                        <Button type="primary">Voir tous mes résultats</Button>
                    </Link>
                    <Link to="/tests">
                        <Button>Autres offres</Button>
                    </Link>
                </Space>
            </Card>
        </div>
    );
}

