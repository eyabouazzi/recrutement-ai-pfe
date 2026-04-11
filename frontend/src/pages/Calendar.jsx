import { useEffect, useMemo, useState } from 'react';
import {
    Card,
    Calendar,
    Modal,
    Form,
    DatePicker,
    TimePicker,
    Select,
    Button,
    Typography,
    Tag,
    List,
    Avatar,
    Space,
    Row,
    Col,
    Input,
    message,
    Popconfirm,
} from 'antd';
import {
    PlusOutlined,
    ScheduleOutlined,
    VideoCameraOutlined,
    PhoneOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

import { listUsers } from '../api/users';
import { getTests } from '../api/tests';
import { listInterviews, createInterview, updateInterview, cancelInterview } from '../api/interviews';

const { Title, Text } = Typography;

function InterviewCalendar() {
    const [form] = Form.useForm();

    const [events, setEvents] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [candidates, setCandidates] = useState([]);
    const [tests, setTests] = useState([]);

    const eventTypes = useMemo(
        () => [
            { value: 'video', label: 'Visioconférence', icon: <VideoCameraOutlined /> },
            { value: 'phone', label: 'Appel téléphonique', icon: <PhoneOutlined /> },
            { value: 'onsite', label: 'Sur place', icon: <TeamOutlined /> },
        ],
        []
    );

    const statusColors = {
        scheduled: 'blue',
        completed: 'green',
        cancelled: 'red',
    };

    const getTypeIcon = (type) => eventTypes.find((t) => t.value === type)?.icon;

    const transformInterview = (it) => {
        const candidateName = it.candidateId
            ? `${it.candidateId.firstName || ''} ${it.candidateId.lastName || ''}`.trim()
            : 'Candidat';
        const testTitle = it.testId?.title || it.testId?.jobRole || 'Entretien';
        const d = dayjs(it.scheduledAt);
        const status =
            it.status === 'CANCELLED' ? 'cancelled' : it.status === 'COMPLETED' ? 'completed' : 'scheduled';

        return {
            id: it._id,
            title: testTitle,
            candidate: candidateName || 'Candidat',
            date: d,
            time: d.format('HH:mm'),
            duration: it.durationMinutes || 60,
            type: it.type || 'video',
            status,
            // payload
            candidateId: it.candidateId?._id || it.candidateId,
            testId: it.testId?._id || it.testId,
            notes: it.notes || '',
        };
    };

    const load = async () => {
        try {
            setLoading(true);
            const now = dayjs();
            const start = now.subtract(1, 'month').toISOString();
            const end = now.add(6, 'month').toISOString();

            const [usersRes, testsRes, interviewsRes] = await Promise.all([
                listUsers(),
                getTests(),
                listInterviews({ startDate: start, endDate: end }),
            ]);

            const allUsers = usersRes.users || [];
            setCandidates(allUsers.filter((u) => u.role === 'candidat'));
            setTests(testsRes.tests || testsRes || []);

            const raw = interviewsRes.items || [];
            setEvents(raw.map(transformInterview));
        } catch (e) {
            message.error(e.message || 'Impossible de charger le calendrier');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getListData = (value) => events.filter((event) => event.date.isSame(value, 'day'));

    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul className="events">
                {listData.map((item) => (
                    <li key={item.id} style={{ marginBottom: 4 }}>
                        <Tag color={statusColors[item.status]} style={{ fontSize: 10, padding: '0 4px' }}>
                            {item.time}
                        </Tag>
                        <Text ellipsis style={{ fontSize: 12, marginLeft: 4 }}>
                            {item.title}
                        </Text>
                    </li>
                ))}
            </ul>
        );
    };

    const handleDateSelect = (date) => {
        setSelectedEvent({
            mode: 'create',
            date,
            time: '09:00',
            type: 'video',
            durationMinutes: 60,
            candidateId: candidates[0]?._id,
            testId: tests[0]?._id,
            notes: '',
        });
        setModalVisible(true);
        form.resetFields();
        // Keep date pre-filled quickly.
        form.setFieldsValue({
            date,
            time: dayjs(`${date.format('YYYY-MM-DD')} 09:00`),
            durationMinutes: 60,
            type: 'video',
            candidateId: candidates[0]?._id,
            testId: tests[0]?._id,
            notes: '',
        });
    };

    const handleEventClick = (event) => {
        setSelectedEvent({ ...event, mode: 'update' });
        setModalVisible(true);
        form.resetFields();

        const combined = event.date
            .hour(parseInt(event.time.split(':')[0] || '9', 10))
            .minute(parseInt(event.time.split(':')[1] || '0', 10));
        form.setFieldsValue({
            candidateId: event.candidateId,
            testId: event.testId,
            date: event.date,
            time: combined,
            durationMinutes: event.duration,
            type: event.type,
            notes: event.notes,
        });
    };

    const handleCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setSelectedEvent(null);
    };

    const buildScheduledAt = (date, time) => {
        const d = date ? dayjs(date) : null;
        const t = time ? dayjs(time) : null;
        if (!d || !t) return null;
        const combined = d.hour(t.hour()).minute(t.minute()).second(0).millisecond(0);
        return combined.toISOString();
    };

    const handleOk = async () => {
        try {
            setSaving(true);
            const values = await form.validateFields();

            const scheduledAtIso = buildScheduledAt(values.date, values.time);
            if (!scheduledAtIso) {
                message.warning('Date/heure invalide');
                return;
            }

            const payload = {
                scheduledAt: scheduledAtIso,
                durationMinutes: values.durationMinutes,
                type: values.type,
                notes: values.notes || '',
                candidateId: values.candidateId,
                testId: values.testId || undefined,
            };

            if (selectedEvent?.mode === 'update' && selectedEvent?.id) {
                await updateInterview(selectedEvent.id, {
                    scheduledAt: payload.scheduledAt,
                    durationMinutes: payload.durationMinutes,
                    type: payload.type,
                    notes: payload.notes,
                });
            } else {
                await createInterview(payload);
            }

            message.success(selectedEvent?.mode === 'update' ? 'Entretien mis à jour' : 'Entretien créé');
            handleCancel();
            await load();
        } catch (e) {
            if (e?.errorFields) return;
            message.error(e.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelInterview = async () => {
        if (!selectedEvent?.id) return;
        try {
            setSaving(true);
            await cancelInterview(selectedEvent.id);
            message.success('Entretien annulé');
            handleCancel();
            await load();
        } catch (e) {
            message.error(e.message || 'Erreur annulation');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={styles.container}
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={styles.header}
            >
                <div>
                    <Title level={2} style={styles.title}>
                        <ScheduleOutlined style={{ marginRight: 12 }} />
                        Calendrier des Entretiens
                    </Title>
                    <Text type="secondary">Gérez vos entretiens et rendez-vous de recrutement</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setSelectedEvent({
                            mode: 'create',
                            date: dayjs(),
                            time: '09:00',
                            type: 'video',
                            durationMinutes: 60,
                            candidateId: candidates[0]?._id,
                            testId: tests[0]?._id,
                            notes: '',
                        });
                        setModalVisible(true);
                        form.resetFields();
                        form.setFieldsValue({
                            date: dayjs(),
                            time: dayjs().hour(9).minute(0),
                            durationMinutes: 60,
                            type: 'video',
                            candidateId: candidates[0]?._id,
                            testId: tests[0]?._id,
                            notes: '',
                        });
                    }}
                >
                    Nouvel Entretien
                </Button>
            </motion.div>

            <div style={styles.content}>
                <Row gutter={24}>
                    {/* Calendar */}
                    <Col xs={24} lg={16}>
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <Card style={styles.calendarCard}>
                                <Calendar dateCellRender={dateCellRender} onSelect={handleDateSelect} style={{ border: 'none' }} />
                            </Card>
                        </motion.div>
                    </Col>

                    {/* Upcoming Events */}
                    <Col xs={24} lg={8}>
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <Card
                                title={
                                    <div style={styles.sidebarTitle}>
                                        <ScheduleOutlined style={{ marginRight: 8 }} />
                                        À Venir
                                    </div>
                                }
                                style={styles.sidebarCard}
                            >
                                {loading ? null : (
                                    <List
                                        dataSource={events
                                            .filter(
                                                (event) =>
                                                    event.date.isAfter(dayjs()) ||
                                                    (event.date.isSame(dayjs(), 'day') && event.status === 'scheduled')
                                            )
                                            .sort((a, b) => a.date.unix() - b.date.unix())
                                            .slice(0, 5)}
                                        renderItem={(event) => (
                                            <List.Item style={styles.eventItem} onClick={() => handleEventClick(event)}>
                                                <List.Item.Meta
                                                    avatar={
                                                        <Avatar icon={getTypeIcon(event.type)} style={{ backgroundColor: '#3b82f6' }} />
                                                    }
                                                    title={
                                                        <div>
                                                            <Text strong>{event.title}</Text>
                                                            <Tag color={statusColors[event.status]} style={{ marginLeft: 8, fontSize: 10 }}>
                                                                {event.status === 'scheduled' ? 'À venir' : event.status === 'cancelled' ? 'Annulé' : 'Terminé'}
                                                            </Tag>
                                                        </div>
                                                    }
                                                    description={
                                                        <div>
                                                            <Text type="secondary">{event.candidate}</Text>
                                                            <br />
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {event.date.format('DD MMM YYYY')} à {event.time}
                                                            </Text>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                )}

                                {!loading && events.filter((e) => e.date.isAfter(dayjs())).length === 0 && (
                                    <div style={styles.emptyState}>
                                        <ScheduleOutlined style={styles.emptyIcon} />
                                        <Text type="secondary">Aucun entretien prévu</Text>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </div>

            {/* Event Modal */}
            <Modal
                title={selectedEvent?.mode === 'update' ? "Modifier l'Entretien" : 'Nouvel Entretien'}
                open={modalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={660}
                confirmLoading={saving}
                okText={selectedEvent?.mode === 'update' ? 'Enregistrer' : 'Créer'}
                okButtonProps={{ disabled: !selectedEvent, loading: saving }}
                cancelButtonProps={{ disabled: saving }}
                footer={[
                    selectedEvent?.mode === 'update' ? (
                        <Popconfirm
                            key="cancelInvite"
                            title="Annuler cet entretien ?"
                            okText="Annuler"
                            cancelText="Retour"
                            onConfirm={handleCancelInterview}
                            disabled={!selectedEvent?.id || saving}
                        >
                            <Button danger loading={saving} disabled={!selectedEvent?.id}>
                                Annuler l’entretien
                            </Button>
                        </Popconfirm>
                    ) : null,
                    <Button key="submit" type="primary" onClick={handleOk} disabled={!selectedEvent} loading={saving}>
                        {selectedEvent?.mode === 'update' ? 'Enregistrer' : 'Créer'}
                    </Button>,
                ].filter(Boolean)}
            >
                <Form form={form} layout="vertical" initialValues={selectedEvent || {}} preserve={false}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="candidateId"
                                label="Candidat"
                                rules={[{ required: true, message: 'Candidat requis' }]}
                            >
                                <Select
                                    placeholder="Choisir un candidat"
                                    showSearch
                                    optionFilterProp="children"
                                >
                                    {candidates.map((c) => (
                                        <Select.Option key={c._id} value={c._id}>
                                            {`${c.firstName || ''} ${c.lastName || ''}`.trim()}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="testId" label="Offre/Test (optionnel)">
                                <Select placeholder="Aucun (optionnel)" allowClear>
                                    {tests.map((t) => (
                                        <Select.Option key={t._id} value={t._id}>
                                            {t.title || t.jobRole}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="date"
                                label="Date"
                                rules={[{ required: true, message: 'Date requise' }]}
                            >
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="time"
                                label="Heure"
                                rules={[{ required: true, message: 'Heure requise' }]}
                            >
                                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="durationMinutes"
                                label="Durée (minutes)"
                                rules={[{ required: true, message: 'Durée requise' }]}
                            >
                                <Select>
                                    <Select.Option value={30}>30 minutes</Select.Option>
                                    <Select.Option value={45}>45 minutes</Select.Option>
                                    <Select.Option value={60}>1 heure</Select.Option>
                                    <Select.Option value={90}>1h30</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Type d'entretien"
                                rules={[{ required: true, message: 'Type requis' }]}
                            >
                                <Select>
                                    {eventTypes.map((t) => (
                                        <Select.Option key={t.value} value={t.value}>
                                            <Space>
                                                {t.icon}
                                                {t.label}
                                            </Space>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea placeholder="Notes supplémentaires..." rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </motion.div>
    );
}

const styles = {
    container: {
        padding: 24,
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 20
    },
    title: {
        margin: 0,
        color: '#1e293b'
    },
    content: {
        marginTop: 24
    },
    calendarCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
    },
    sidebarCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        height: '100%'
    },
    sidebarTitle: {
        fontSize: 16,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center'
    },
    eventItem: {
        padding: '12px 0',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    emptyState: {
        textAlign: 'center',
        padding: 20
    },
    emptyIcon: {
        fontSize: 24,
        color: '#d1d5db',
        marginBottom: 8
    }
};

export default InterviewCalendar;