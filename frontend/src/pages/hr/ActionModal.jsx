import { useState } from 'react';
import {
    Modal, Form, Input, Select, DatePicker, Button, Tabs, message,
    Typography, Space, Tag, Alert, Divider, Progress
} from 'antd';
import {
    CalendarOutlined, SendOutlined, CloseCircleOutlined,
    FileTextOutlined, CheckCircleOutlined, MailOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createInterview } from '../../api/interviews';
import { updateSubmissionStage, addCandidateNote } from '../../api/submissions';

const { Text, Title } = Typography;
const { TextArea } = Input;

const STAGE_LABELS = {
    NEW: 'Nouveau',
    SCREENING: 'Screening RH',
    INTERVIEW: 'Entretien',
    OFFER: 'Offre',
    HIRED: 'Embauché',
    REJECTED: 'Refusé',
};

const REJECTION_TEMPLATES = [
    { key: 'score', label: 'Score insuffisant', text: 'Après évaluation, votre score au test technique n\'a pas atteint le niveau requis pour ce poste. Nous vous encourageons à continuer à développer vos compétences.' },
    { key: 'profile', label: 'Profil non adapté', text: 'Votre profil, bien que solide, ne correspond pas aux besoins spécifiques de ce poste à ce stade. Nous conservons votre candidature pour de futures opportunités.' },
    { key: 'competition', label: 'Candidature non retenue', text: 'Nous avons reçu de nombreuses candidatures de haute qualité. Après délibération, nous n\'avons pas pu retenir la vôtre cette fois. Merci pour l\'intérêt porté à notre entreprise.' },
];

export default function HRActionModal({ open, onClose, submission, onSuccess }) {
    const [activeTab, setActiveTab] = useState('interview');
    const [loading, setLoading] = useState(false);
    const [interviewForm] = Form.useForm();
    const [offerForm] = Form.useForm();
    const [rejectForm] = Form.useForm();
    const [noteForm] = Form.useForm();

    if (!submission) return null;

    const candidateName = `${submission.candidateId?.firstName || ''} ${submission.candidateId?.lastName || ''}`.trim();
    const score = submission.totalScore ?? null;
    const currentStage = submission.stage || 'NEW';

    /* ── Schedule Interview ── */
    const handleScheduleInterview = async (values) => {
        setLoading(true);
        try {
            await createInterview({
                candidateId: submission.candidateId?._id || submission.candidateId,
                testId: submission.testId?._id || submission.testId,
                submissionId: submission._id,
                scheduledAt: values.scheduledAt.toISOString(),
                type: values.type,
                location: values.location || '',
                messageToCandidate: values.notes || '',
            });
            await updateSubmissionStage(submission._id, 'INTERVIEW');
            message.success(`Entretien planifié avec ${candidateName} ✓`);
            interviewForm.resetFields();
            onSuccess?.('INTERVIEW');
            onClose();
        } catch (e) {
            message.error(e.message || 'Erreur lors de la planification');
        } finally {
            setLoading(false);
        }
    };

    /* ── Send Offer ── */
    const handleSendOffer = async (values) => {
        setLoading(true);
        try {
            await updateSubmissionStage(submission._id, 'OFFER');
            await addCandidateNote(submission._id, `📋 Offre envoyée — Poste: ${values.position || 'N/A'} | Salaire: ${values.salary || 'N/A'} | Message: ${values.message || ''}`);
            message.success(`Offre envoyée à ${candidateName} ✓`);
            offerForm.resetFields();
            onSuccess?.('OFFER');
            onClose();
        } catch (e) {
            message.error(e.message || 'Erreur lors de l\'envoi de l\'offre');
        } finally {
            setLoading(false);
        }
    };

    /* ── Reject with Feedback ── */
    const handleReject = async (values) => {
        setLoading(true);
        try {
            await updateSubmissionStage(submission._id, 'REJECTED');
            await addCandidateNote(submission._id, `❌ Candidature refusée — Motif: ${values.reason || 'Non spécifié'} | Message: ${values.feedback || ''}`);
            message.success(`Candidature de ${candidateName} refusée avec feedback ✓`);
            rejectForm.resetFields();
            onSuccess?.('REJECTED');
            onClose();
        } catch (e) {
            message.error(e.message || 'Erreur lors du rejet');
        } finally {
            setLoading(false);
        }
    };

    /* ── Add Note ── */
    const handleAddNote = async (values) => {
        setLoading(true);
        try {
            await addCandidateNote(submission._id, values.note);
            message.success('Note ajoutée ✓');
            noteForm.resetFields();
            onSuccess?.(currentStage);
        } catch (e) {
            message.error(e.message || 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    const scoreColor = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={680}
            title={null}
            styles={{ body: { padding: 0, borderRadius: 20, overflow: 'hidden' } }}
        >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '20px 28px', color: '#fff' }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Actions recruteur
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                    {candidateName} · {submission.testId?.jobRole || submission.testId?.title || 'Poste'}
                </div>
                {/* Candidate summary */}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                    <Tag style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontWeight: 700 }}>
                        Étape: {STAGE_LABELS[currentStage] || currentStage}
                    </Tag>
                    {score !== null && (
                        <Tag style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontWeight: 700 }}>
                            Score: {score}/100
                        </Tag>
                    )}
                    {submission.jobMatchAnalysis?.score != null && (
                        <Tag style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontWeight: 700 }}>
                            CV Match: {submission.jobMatchAnalysis.score}%
                        </Tag>
                    )}
                </div>
                {score !== null && (
                    <div style={{ marginTop: 10 }}>
                        <Progress
                            percent={score}
                            showInfo={false}
                            strokeColor={scoreColor}
                            trailColor="rgba(255,255,255,0.2)"
                            size="small"
                        />
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 28px 28px' }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    style={{ marginTop: 16 }}
                    items={[
                        {
                            key: 'interview',
                            label: <span><CalendarOutlined style={{ marginRight: 6 }} />Entretien</span>,
                            children: (
                                <Form form={interviewForm} layout="vertical" onFinish={handleScheduleInterview}>
                                    <Alert
                                        type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
                                        message="Le candidat sera notifié automatiquement avec les détails de l'entretien."
                                    />
                                    <Form.Item name="scheduledAt" label="Date et heure" rules={[{ required: true, message: 'Choisissez une date' }]}>
                                        <DatePicker
                                            showTime format="DD/MM/YYYY HH:mm"
                                            style={{ width: '100%' }}
                                            disabledDate={d => d && d < dayjs().startOf('day')}
                                            placeholder="Sélectionner date & heure"
                                        />
                                    </Form.Item>
                                    <Form.Item name="type" label="Type d'entretien" rules={[{ required: true }]} initialValue="video">
                                        <Select options={[
                                            { value: 'video', label: '🎥 Visio-conférence' },
                                            { value: 'phone', label: '📞 Téléphone' },
                                            { value: 'onsite', label: '🏢 Sur site' },
                                        ]} />
                                    </Form.Item>
                                    <Form.Item name="location" label="Lien / Adresse (optionnel)">
                                        <Input placeholder="https://meet.google.com/... ou adresse physique" />
                                    </Form.Item>
                                    <Form.Item name="notes" label="Message au candidat (optionnel)">
                                        <TextArea rows={3} placeholder="Préparez-vous à discuter de votre expérience en React..." />
                                    </Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading} block icon={<CalendarOutlined />}
                                        style={{ background: '#6366f1', borderColor: '#6366f1', height: 42 }}>
                                        Planifier et notifier le candidat
                                    </Button>
                                </Form>
                            ),
                        },
                        {
                            key: 'offer',
                            label: <span><CheckCircleOutlined style={{ marginRight: 6 }} />Offre</span>,
                            children: (
                                <Form form={offerForm} layout="vertical" onFinish={handleSendOffer}>
                                    <Alert
                                        type="success" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
                                        message="Une notification sera envoyée au candidat l'informant qu'il passe à l'étape Offre."
                                    />
                                    <Form.Item name="position" label="Intitulé du poste" rules={[{ required: true }]}>
                                        <Input placeholder="Ex: Développeur Full Stack Senior" defaultValue={submission.testId?.jobRole} />
                                    </Form.Item>
                                    <Form.Item name="salary" label="Rémunération proposée">
                                        <Input placeholder="Ex: 45 000 – 55 000 € / an" />
                                    </Form.Item>
                                    <Form.Item name="startDate" label="Date de début souhaitée">
                                        <DatePicker style={{ width: '100%' }} placeholder="Date de prise de poste" />
                                    </Form.Item>
                                    <Form.Item name="message" label="Message personnalisé">
                                        <TextArea rows={4} placeholder="Nous avons le plaisir de vous proposer..." />
                                    </Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading} block icon={<SendOutlined />}
                                        style={{ background: '#10b981', borderColor: '#10b981', height: 42 }}>
                                        Envoyer l'offre et notifier le candidat
                                    </Button>
                                </Form>
                            ),
                        },
                        {
                            key: 'reject',
                            label: <span><CloseCircleOutlined style={{ marginRight: 6 }} />Refus</span>,
                            children: (
                                <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
                                    <Alert
                                        type="warning" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
                                        message="Le candidat recevra un message de refus. Cette action est irréversible depuis le pipeline."
                                    />
                                    <Form.Item name="reason" label="Motif principal" rules={[{ required: true }]}>
                                        <Select
                                            placeholder="Sélectionnez un motif"
                                            options={REJECTION_TEMPLATES.map(t => ({ value: t.key, label: t.label }))}
                                            onChange={(val) => {
                                                const tpl = REJECTION_TEMPLATES.find(t => t.key === val);
                                                if (tpl) rejectForm.setFieldValue('feedback', tpl.text);
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item name="feedback" label="Message de feedback au candidat" rules={[{ required: true }]}>
                                        <TextArea rows={5} placeholder="Rédigez un message constructif..." />
                                    </Form.Item>
                                    <Button danger htmlType="submit" loading={loading} block icon={<MailOutlined />} style={{ height: 42 }}>
                                        Envoyer le refus avec feedback
                                    </Button>
                                </Form>
                            ),
                        },
                        {
                            key: 'note',
                            label: <span><FileTextOutlined style={{ marginRight: 6 }} />Note</span>,
                            children: (
                                <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
                                    <Form.Item name="note" label="Note interne (visible par l'équipe RH uniquement)" rules={[{ required: true }]}>
                                        <TextArea rows={5} placeholder="Points forts relevés lors de l'entretien, éléments à creuser..." />
                                    </Form.Item>
                                    <Button type="default" htmlType="submit" loading={loading} block icon={<FileTextOutlined />} style={{ height: 42 }}>
                                        Enregistrer la note
                                    </Button>
                                </Form>
                            ),
                        },
                    ]}
                />
            </div>
        </Modal>
    );
}
