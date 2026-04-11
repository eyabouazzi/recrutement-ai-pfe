import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Avatar, Typography, Tag, Divider, Spin, message, Input, List, Timeline, Tabs, DatePicker, Progress } from 'antd';
import { UserOutlined, ArrowLeftOutlined, MailOutlined, BankOutlined, ClockCircleOutlined, SendOutlined, CheckCircleOutlined, RobotOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { fetchSubmissionDetails, addCandidateNote, updateSubmissionStage, updateSubmissionPipeline } from '../../api/submissions';
import dayjs from 'dayjs';
import { getAvatarUrl } from '../../utils/avatar.js';
import { baseUrl } from '../../api/api.js';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ANOMALY_LABELS = {
    FAST_COMPLETION: 'Passage tres rapide',
    MANY_BLANK: 'Beaucoup de reponses vides',
    IDENTICAL_OPEN_ANSWERS: 'Reponses ouvertes identiques',
    LOW_ANSWER_COVERAGE: 'Faible couverture des questions',
    DUPLICATE_QUESTION_IDS: 'Questions dupliquees dans la soumission',
    HIGH_FOCUS_LOSS: 'Nombreux changements d\'onglet/focus',
    EXCESSIVE_PASTE: 'Collage excessif',
    HIGH_COPY_ACTIVITY: 'Copie frequente',
    FULLSCREEN_EXITS: 'Sorties du plein ecran',
    CLIENT_CLOCK_MISMATCH: 'Horodatage client incoherent',
    DEVICE_SWITCH: 'Changement d\'appareil/IP',
};

const STAGES = [
    { id: 'NEW', title: 'Nouveau', color: 'blue' },
    { id: 'SCREENING', title: 'Screening', color: 'purple' },
    { id: 'INTERVIEW', title: 'Entretien', color: 'orange' },
    { id: 'OFFER', title: 'Offre', color: 'green' },
    { id: 'HIRED', title: 'Embauché', color: 'cyan' },
    { id: 'REJECTED', title: 'Refusé', color: 'red' }
];

export default function CandidateProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [noteText, setNoteText] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [interviewAt, setInterviewAt] = useState(null);
    const [followUp, setFollowUp] = useState('');
    const [savingPipeline, setSavingPipeline] = useState(false);

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        try {
            setLoading(true);
            const data = await fetchSubmissionDetails(id);
            setSubmission(data.submission);
            const s = data.submission;
            setInterviewAt(s.interviewScheduledAt ? dayjs(s.interviewScheduledAt) : null);
            setFollowUp(s.followUpNotes || '');
        } catch (error) {
            message.error(error.message);
            navigate('/rh/pipeline');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            setSubmittingNote(true);
            const data = await addCandidateNote(id, noteText);
            setSubmission(prev => ({
                ...prev,
                notes: [...(prev.notes || []), data.note]
            }));
            setNoteText('');
            message.success('Note ajoutée');
        } catch (error) {
            message.error(error.message);
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleStageChange = async (newStage) => {
        try {
            await updateSubmissionStage(id, newStage);
            setSubmission(prev => ({ ...prev, stage: newStage }));
            message.success(`Candidat déplacé vers ${newStage}`);
        } catch (error) {
            message.error(error.message);
        }
    };

    const handleSavePipeline = async () => {
        try {
            setSavingPipeline(true);
            await updateSubmissionPipeline(id, {
                interviewScheduledAt: interviewAt ? interviewAt.toISOString() : null,
                followUpNotes: followUp,
            });
            message.success('Suivi enregistré');
        } catch (error) {
            message.error(error.message);
        } finally {
            setSavingPipeline(false);
        }
    };

    const exportDossierTxt = () => {
        const c = submission.candidateId || {};
        const t = submission.testId || {};
        const lines = [
            `DOSSIER CANDIDAT — ${c.firstName || ''} ${c.lastName || ''}`,
            `Email: ${c.email || ''}`,
            `Test: ${t.title || ''} (${t.jobRole || ''})`,
            `Score: ${submission.totalScore ?? '—'} / 100`,
            `Qualifié (seuil): ${submission.qualified ? 'oui' : 'non'}`,
            `Date: ${dayjs(submission.createdAt).format('DD/MM/YYYY HH:mm')}`,
            '',
            '--- Feedback ---',
            submission.feedback || '—',
            '',
            '--- Compétences ---',
            ...(submission.competencyBreakdown || []).map((x) => `${x.competency}: ${x.score} — ${x.comment}`),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier_${c.lastName || 'candidat'}_${id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;
    }

    const candidate = submission.candidateId || {};
    const test = submission.testId || {};
    const stageInfo = STAGES.find(s => s.id === submission.stage) || STAGES[0];
    const cvAnalysis = candidate.cvAnalysis || {};
    const detectedSkillItems = Array.isArray(cvAnalysis.detectedSkills) && cvAnalysis.detectedSkills.length > 0
        ? cvAnalysis.detectedSkills
        : (candidate.skills || []);
    const cvDownloadUrl = candidate.cvUrl
        ? (candidate.cvUrl.startsWith('http://') || candidate.cvUrl.startsWith('https://')
            ? candidate.cvUrl
            : `${baseUrl}${candidate.cvUrl}`)
        : '';

    return (
        <div style={styles.page}>
            {/* Header / Top Action Bar */}
                <div style={styles.actionBar}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rh/pipeline')}>Retour au Pipeline</Button>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Button icon={<DownloadOutlined />} onClick={exportDossierTxt}>Exporter dossier (.txt)</Button>
                    <Tag color={stageInfo.color} style={{ fontSize: 14, padding: '4px 12px', borderRadius: 99 }}>{stageInfo.title}</Tag>
                </div>
            </div>

            <div style={styles.mainLayout}>
                {/* Left Side: Profile Info */}
                <div style={styles.leftCol}>
                    <Card style={styles.profileCard}>
                        <div style={styles.avatarWrap}>
                            <Avatar size={100} icon={<UserOutlined />} src={getAvatarUrl(candidate.avatar)} style={{ backgroundColor: '#2563eb' }} />
                        </div>
                        <Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
                            {candidate.firstName} {candidate.lastName}
                        </Title>
                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
                            Candidat pour : {test.jobRole}
                        </Text>
                        
                        <Divider />
                        
                        <div style={styles.infoList}>
                            <div style={styles.infoItem}>
                                <MailOutlined style={styles.infoIcon} />
                                <Text>{candidate.email}</Text>
                            </div>
                            <div style={styles.infoItem}>
                                <BankOutlined style={styles.infoIcon} />
                                <Text>{test.title}</Text>
                            </div>
                            <div style={styles.infoItem}>
                                <ClockCircleOutlined style={styles.infoIcon} />
                                <Text>Appliqué le {dayjs(submission.createdAt).format('DD MMMM YYYY')}</Text>
                            </div>
                        </div>

                        <Divider />

                        <div style={{ padding: '0 8px' }}>
                            <Title level={5}>Changer d'étape</Title>
                            <div style={styles.stageGrid}>
                                {STAGES.map(s => (
                                    <Button 
                                        key={s.id} 
                                        size="small" 
                                        type={submission.stage === s.id ? 'primary' : 'default'}
                                        onClick={() => handleStageChange(s.id)}
                                        style={{ fontSize: 11 }}
                                    >
                                        {s.title}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card
                        title={<><CalendarOutlined /> Entretien & suivi RH</>}
                        style={{ marginTop: 24 }}
                        extra={
                            <Button type="primary" size="small" loading={savingPipeline} onClick={handleSavePipeline}>
                                Enregistrer
                            </Button>
                        }
                    >
                        <Text type="secondary" block style={{ marginBottom: 8 }}>
                            Planification et notes internes (non visibles du candidat).
                        </Text>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Date d&apos;entretien prévue</Text>
                            <DatePicker
                                showTime
                                style={{ width: '100%', marginTop: 8 }}
                                value={interviewAt}
                                onChange={setInterviewAt}
                                format="DD/MM/YYYY HH:mm"
                            />
                        </div>
                        <div>
                            <Text strong>Relance / notes de suivi</Text>
                            <TextArea
                                rows={4}
                                style={{ marginTop: 8 }}
                                value={followUp}
                                onChange={(e) => setFollowUp(e.target.value)}
                                placeholder="Ex: relance LinkedIn, points à creuser..."
                            />
                        </div>
                        {submission.testId?.calendlyUrl && (
                            <Button
                                type="link"
                                href={submission.testId.calendlyUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ paddingLeft: 0, marginTop: 8 }}
                            >
                                Ouvrir Calendly de l&apos;offre
                            </Button>
                        )}
                    </Card>

                    <Card
                        title={<><RobotOutlined /> Analyse sémantique du CV</>}
                        style={{ marginTop: 24 }}
                        extra={cvDownloadUrl ? (
                            <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                href={cvDownloadUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                CV
                            </Button>
                        ) : null}
                    >
                        <Text type="secondary" block style={{ marginBottom: 12 }}>
                            Lecture automatique du profil candidat à partir du CV et des informations renseignées.
                        </Text>

                        {candidate.bio && (
                            <Paragraph style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                {candidate.bio}
                            </Paragraph>
                        )}

                        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                            {candidate.education && (
                                <Text><strong>Formation :</strong> {candidate.education}</Text>
                            )}
                            {candidate.experienceYears !== undefined && candidate.experienceYears !== null && (
                                <Text><strong>Expérience :</strong> {candidate.experienceYears} an(s)</Text>
                            )}
                            {candidate.preferredSector && (
                                <Text><strong>Secteur visé :</strong> {candidate.preferredSector}</Text>
                            )}
                            {candidate.preferredLocation && (
                                <Text><strong>Localisation visée :</strong> {candidate.preferredLocation}</Text>
                            )}
                        </div>

                        {cvAnalysis.summary ? (
                            <Paragraph style={{ background: '#eff6ff', padding: 12, borderRadius: 8 }}>
                                {cvAnalysis.summary}
                            </Paragraph>
                        ) : (
                            <Text type="secondary">Aucune analyse CV disponible pour le moment.</Text>
                        )}

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Compétences détectées</Text>
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {detectedSkillItems.length > 0 ? (
                                    detectedSkillItems.map((skill) => (
                                        <Tag key={skill} color="green">{skill}</Tag>
                                    ))
                                ) : (
                                    <Text type="secondary">Aucune compétence détectée.</Text>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Rôles suggérés</Text>
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {(cvAnalysis.suggestedRoles || []).length > 0 ? (
                                    cvAnalysis.suggestedRoles.map((role) => (
                                        <Tag key={role} color="blue">{role}</Tag>
                                    ))
                                ) : (
                                    <Text type="secondary">Aucun rôle suggéré.</Text>
                                )}
                            </div>
                        </div>

                        {cvAnalysis.strengths?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>Points forts</Text>
                                <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
                                    {cvAnalysis.strengths.map((item) => (
                                        <li key={item} style={{ marginBottom: 6 }}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {cvAnalysis.recommendations?.length > 0 && (
                            <div>
                                <Text strong>Axes d’attention</Text>
                                <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
                                    {cvAnalysis.recommendations.map((item) => (
                                        <li key={item} style={{ marginBottom: 6 }}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>

                    <Card title={<><RobotOutlined /> Score AI & Feedback</>} style={{ marginTop: 24 }}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ ...styles.scoreBadge, color: submission.totalScore > 70 ? '#059669' : '#d97706' }}>
                                {submission.totalScore}%
                            </div>
                            <Text strong>Compatibilité Globale</Text>
                        </div>
                        {typeof submission.trustScore === 'number' && (
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>Score de confiance anti-triche</Text>
                                <Progress
                                    percent={submission.trustScore}
                                    status={submission.trustScore >= 80 ? 'success' : submission.trustScore >= 60 ? 'normal' : 'exception'}
                                    strokeColor={submission.trustScore >= 80 ? '#52c41a' : submission.trustScore >= 60 ? '#faad14' : '#ff4d4f'}
                                    style={{ marginTop: 8 }}
                                />
                            </div>
                        )}
                        {submission.behaviorData && (
                            <div style={{ marginBottom: 16, background: '#fafafa', padding: 12, borderRadius: 8 }}>
                                <Text strong>Données comportementales</Text>
                                <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                                    <Text>Onglets/focus: {submission.behaviorData.tabSwitches || 0} switch(es), {submission.behaviorData.focusLossCount || 0} perte(s) de focus</Text>
                                    <Text>Copier/coller: {submission.behaviorData.copyCount || 0} copie(s), {submission.behaviorData.pasteCount || 0} collage(s)</Text>
                                    <Text>Plein écran: {submission.behaviorData.fullscreenExits || 0} sortie(s)</Text>
                                    {submission.behaviorData.deviceFingerprint?.userAgent && (
                                        <Text type="secondary">Device: {submission.behaviorData.deviceFingerprint.userAgent.slice(0, 80)}</Text>
                                    )}
                                </div>
                            </div>
                        )}
                        {submission.anomalyFlags?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>Signaux automatiques</Text>
                                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {submission.anomalyFlags.map((f, i) => (
                                        <Tag key={i} color={f.severity === 'high' ? 'red' : f.severity === 'medium' ? 'orange' : 'gold'}>
                                            {ANOMALY_LABELS[f.code] || f.code}
                                            {f.detail ? ` — ${f.detail}` : ''}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Paragraph style={{ fontStyle: 'italic', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                            "{submission.feedback}"
                        </Paragraph>
                    </Card>
                </div>

                {/* Right Side: Notes and Test Results */}
                <div style={styles.rightCol}>
                    <Tabs defaultActiveKey="1" style={styles.tabs} items={[
                        {
                            key: '1',
                            label: 'Activité & Feed',
                            children: (
                                <div style={{ padding: '16px 0' }}>
                                    <div style={styles.noteInputWrap}>
                                        <TextArea 
                                            rows={3} 
                                            placeholder="Ajouter une note de recrutement ou un commentaire..." 
                                            value={noteText}
                                            onChange={e => setNoteText(e.target.value)}
                                            style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                                        />
                                        <Button 
                                            type="primary" 
                                            icon={<SendOutlined />} 
                                            onClick={handleAddNote}
                                            loading={submittingNote}
                                            style={{ marginTop: 12, borderRadius: 8 }}
                                        >
                                            Enregistrer la note
                                        </Button>
                                    </div>

                                    <Divider />

                                    {/* Unified Activity Timeline */}
                                    <Timeline
                                        mode="left"
                                        style={{ marginTop: 24 }}
                                        items={[
                                            {
                                                label: dayjs(submission.createdAt).format('DD MMM'),
                                                children: (
                                                    <div style={styles.timelineItem}>
                                                        <Text strong>Candidature reçue</Text>
                                                        <Text type="secondary" block>Le candidat a postulé pour le poste de {test.jobRole}</Text>
                                                    </div>
                                                ),
                                                color: 'blue'
                                            },
                                            {
                                                label: dayjs(submission.createdAt).add(2, 'minute').format('DD MMM'),
                                                children: (
                                                    <div style={styles.timelineItem}>
                                                        <Text strong>Évaluation AI terminée</Text>
                                                        <Tag color="success" style={{ marginLeft: 8 }}>{submission.totalScore}% Match</Tag>
                                                        <Text type="secondary" block>Analyse automatisée basée sur les réponses au test.</Text>
                                                    </div>
                                                ),
                                                color: 'green'
                                            },
                                            ... (submission.notes || []).map(note => ({
                                                label: dayjs(note.createdAt).format('DD MMM'),
                                                children: (
                                                    <div style={styles.timelineItem}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            <Avatar size="small" src={getAvatarUrl(note.author?.avatar)} icon={<UserOutlined />} />
                                                            <Text strong>{note.author?.firstName} {note.author?.lastName}</Text>
                                                        </div>
                                                        <Paragraph style={{ margin: 0, paddingLeft: 32 }}>{note.text}</Paragraph>
                                                    </div>
                                                ),
                                                color: 'gray'
                                            })),
                                            {
                                                label: 'Maintenant',
                                                children: (
                                                    <div style={styles.timelineItem}>
                                                        <Text strong>Étape actuelle : {stageInfo.title}</Text>
                                                    </div>
                                                ),
                                                color: stageInfo.color
                                            }
                                        ]}
                                    />
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: 'Réponses détaillées',
                            children: (
                                <div style={{ padding: '16px 0' }}>
                                    {submission.answers?.map((ans, idx) => (
                                        <div key={idx} style={styles.qItem}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <Text strong style={{ fontSize: 15 }}>Question {idx + 1}</Text>
                                                <Tag color="blue">Réponse Candidat</Tag>
                                            </div>
                                            <Paragraph style={styles.qResponse}>
                                                {ans.response}
                                            </Paragraph>
                                        </div>
                                    ))}
                                </div>
                            )
                        },
                        {
                            key: '3',
                            label: 'Analyse AI Match',
                            children: (
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 32 }}>
                                        <div style={{ width: 140, height: 140, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ 
                                                position: 'absolute', width: '100%', height: '100%', 
                                                borderRadius: '50%', border: '8px solid #f1f5f9',
                                                borderTopColor: submission.totalScore > 70 ? '#10b981' : '#f59e0b'
                                            }} />
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>{submission.totalScore}%</div>
                                                <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>Match</div>
                                            </div>
                                        </div>
                                        <div>
                                            <Title level={4}>Score de Compatibilité</Title>
                                            <Text type="secondary">Analyse calculée par notre moteur AI sur la base des compétences techniques et Soft Skills.</Text>
                                        </div>
                                    </div>
                                    <Divider />
                                    <Title level={5}>Points clés de l'évaluation</Title>
                                    <Paragraph style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', fontStyle: 'italic' }}>
                                        "{submission.feedback}"
                                    </Paragraph>
                                </div>
                            )
                        }
                    ]} />
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        background: 'var(--bg-light)',
        minHeight: '100%',
        padding: 40,
        fontFamily: "'Inter', sans-serif"
    },
    actionBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
    },
    mainLayout: {
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 2fr',
        gap: 24
    },
    leftCol: {},
    rightCol: {
        background: '#fff',
        borderRadius: 24,
        padding: '8px 32px 32px 32px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)'
    },
    profileCard: {
        borderRadius: 24,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
    },
    avatarWrap: {
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 0'
    },
    infoList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
    },
    infoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    infoIcon: {
        color: 'var(--text-light)',
        fontSize: 16
    },
    stageGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginTop: 16
    },
    scoreBadge: {
        fontSize: 40,
        fontWeight: 800,
        marginBottom: 8,
        letterSpacing: '-0.04em'
    },
    tabs: {
        marginTop: 16
    },
    noteItem: {
        display: 'flex',
        gap: 12,
        width: '100%',
        background: 'var(--bg-subtle)',
        padding: 16,
        borderRadius: 16
    },
    noteContent: {
        flex: 1
    },
    noteHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    qItem: {
        marginBottom: 24,
        padding: 24,
        background: 'var(--bg-subtle)',
        borderRadius: 20
    },
    qResponse: {
        marginTop: 12,
        padding: 18,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid var(--border)',
        fontSize: 14,
        lineHeight: 1.6
    }
};

