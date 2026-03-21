import { useState } from 'react';
import { Card, Calendar, Modal, Form, Input, DatePicker, TimePicker, Select, Button, Typography, Tag, List, Avatar, Space } from 'antd';
import { PlusOutlined, ScheduleOutlined, VideoCameraOutlined, PhoneOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function InterviewCalendar() {
    const [events, setEvents] = useState([
        {
            id: 1,
            title: 'Entretien Développeur Full Stack',
            candidate: 'Marie Dubois',
            date: dayjs().add(1, 'day'),
            time: '14:00',
            duration: 60,
            type: 'video',
            status: 'scheduled'
        },
        {
            id: 2,
            title: 'Entretien Data Scientist',
            candidate: 'Thomas Martin',
            date: dayjs().add(3, 'day'),
            time: '10:30',
            duration: 45,
            type: 'phone',
            status: 'scheduled'
        },
        {
            id: 3,
            title: 'Entretien Product Manager',
            candidate: 'Sophie Laurent',
            date: dayjs().subtract(2, 'day'),
            time: '16:00',
            duration: 90,
            type: 'onsite',
            status: 'completed'
        }
    ]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [form] = Form.useForm();

    const eventTypes = [
        { value: 'video', label: 'Visioconférence', icon: <VideoCameraOutlined /> },
        { value: 'phone', label: 'Appel téléphonique', icon: <PhoneOutlined /> },
        { value: 'onsite', label: 'Sur place', icon: <TeamOutlined /> }
    ];

    const statusColors = {
        scheduled: 'blue',
        completed: 'green',
        cancelled: 'red',
        rescheduled: 'orange'
    };

    const getListData = (value) => {
        const dayEvents = events.filter(event => 
            event.date.isSame(value, 'day')
        );
        return dayEvents;
    };

    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul className="events">
                {listData.map(item => (
                    <li key={item.id} style={{ marginBottom: 4 }}>
                        <Tag 
                            color={statusColors[item.status]}
                            style={{ fontSize: 10, padding: '0 4px' }}
                        >
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
            date,
            time: '09:00'
        });
        setModalVisible(true);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setModalVisible(true);
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            if (selectedEvent.id) {
                // Update existing event
                setEvents(events.map(event => 
                    event.id === selectedEvent.id 
                        ? { ...event, ...values }
                        : event
                ));
            } else {
                // Create new event
                const newEvent = {
                    id: Date.now(),
                    ...values,
                    date: selectedEvent.date,
                    status: 'scheduled'
                };
                setEvents([...events, newEvent]);
            }
            setModalVisible(false);
            form.resetFields();
            setSelectedEvent(null);
        });
    };

    const handleCancel = () => {
        setModalVisible(false);
        form.resetFields();
        setSelectedEvent(null);
    };

    const getTypeIcon = (type) => {
        return eventTypes.find(t => t.value === type)?.icon;
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
                    <Text type="secondary">
                        Gérez vos entretiens et rendez-vous de recrutement
                    </Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                        setSelectedEvent({ date: dayjs() });
                        setModalVisible(true);
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
                                <Calendar
                                    dateCellRender={dateCellRender}
                                    onSelect={handleDateSelect}
                                    style={{ border: 'none' }}
                                />
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
                                <List
                                    dataSource={events
                                        .filter(event => event.date.isAfter(dayjs()) || 
                                               (event.date.isSame(dayjs(), 'day') && event.status === 'scheduled'))
                                        .sort((a, b) => a.date.unix() - b.date.unix())
                                        .slice(0, 5)
                                    }
                                    renderItem={event => (
                                        <List.Item 
                                            style={styles.eventItem}
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar 
                                                        icon={getTypeIcon(event.type)} 
                                                        style={{ backgroundColor: '#3b82f6' }}
                                                    />
                                                }
                                                title={
                                                    <div>
                                                        <Text strong>{event.title}</Text>
                                                        <Tag 
                                                            color={statusColors[event.status]} 
                                                            style={{ marginLeft: 8, fontSize: 10 }}
                                                        >
                                                            {event.status === 'scheduled' ? 'À venir' : 'Terminé'}
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
                                
                                {events.filter(e => e.date.isAfter(dayjs())).length === 0 && (
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
                title={selectedEvent?.id ? "Modifier l'Entretien" : "Nouvel Entretien"}
                open={modalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={selectedEvent || {}}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="title"
                                label="Titre de l'entretien"
                                rules={[{ required: true, message: 'Titre requis' }]}
                            >
                                <Input placeholder="Entretien pour le poste de..." />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="candidate"
                                label="Candidat"
                                rules={[{ required: true, message: 'Nom du candidat requis' }]}
                            >
                                <Input placeholder="Nom du candidat" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="date"
                                label="Date"
                                rules={[{ required: true, message: 'Date requise' }]}
                                initialValue={selectedEvent?.date}
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
                                <TimePicker 
                                    format="HH:mm" 
                                    style={{ width: '100%' }}
                                    minuteStep={15}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="duration"
                                label="Durée (minutes)"
                                rules={[{ required: true, message: 'Durée requise' }]}
                                initialValue={60}
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
                                initialValue="video"
                            >
                                <Select>
                                    {eventTypes.map(type => (
                                        <Select.Option key={type.value} value={type.value}>
                                            <Space>
                                                {type.icon}
                                                {type.label}
                                            </Space>
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea 
                            placeholder="Notes supplémentaires..." 
                            rows={3}
                        />
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