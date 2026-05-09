import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Badge, Button, Empty, Input, List, Spin, Typography, message } from 'antd';
import {
    CloseOutlined,
    MessageOutlined,
    RobotOutlined,
    SendOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/authContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import {
    getChatById,
    getMyChats,
    markChatAsRead,
    sendAssistantMessage,
    sendMessage as sendChatMessage
} from '../api/chat';
import { baseUrl } from '../api/api';

const { Text } = Typography;

function toId(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.id || '';
}

function resolveAvatarUrl(avatar) {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    return `${baseUrl}${avatar}`;
}

function formatRelativeTime(dateLike) {
    if (!dateLike) return '';
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return '';
    const delta = Date.now() - date.getTime();
    const minutes = Math.floor(delta / 60000);
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function ChatWidget() {
    const { user, token } = useAuth();
    const { socket } = useWebSocket();
    const currentUserId = toId(user);

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('conversations');
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    const [assistantMessages, setAssistantMessages] = useState([]);
    const [assistantInput, setAssistantInput] = useState('');
    const [assistantLoading, setAssistantLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const assistantEndRef = useRef(null);

    const unreadCount = chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);

    const getOtherParticipant = (chat) => {
        const participants = Array.isArray(chat?.participants) ? chat.participants : [];
        return participants.find((participant) => toId(participant) !== currentUserId) || participants[0] || null;
    };

    const fetchChats = async () => {
        if (!token) return;
        setLoadingChats(true);
        try {
            const response = await getMyChats({ limit: 30, status: 'active' });
            if (response.status) {
                setChats(Array.isArray(response.chats) ? response.chats : []);
            }
        } catch (error) {
            console.error('Unable to fetch chats:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    const openChat = async (chatId) => {
        if (!chatId) return;
        try {
            const response = await getChatById(chatId);
            if (!response.status || !response.chat) {
                throw new Error(response.message || 'Chat not found');
            }
            setSelectedChat(response.chat);
            setChats((prev) =>
                prev.map((chat) => (chat._id === chatId ? { ...chat, unreadCount: 0 } : chat))
            );
        } catch (error) {
            message.error(error.message || 'Impossible de charger la conversation');
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchChats();
        const interval = setInterval(fetchChats, 30000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (isOpen && token) {
            fetchChats();
        }
    }, [isOpen, token]);

    useEffect(() => {
        if (!token) return undefined;

        const handleExternalOpen = async (event) => {
            const chatId = event?.detail?.chatId;
            if (!chatId) return;

            setIsOpen(true);
            setActiveTab('conversations');
            await openChat(chatId);
            fetchChats();
        };

        window.addEventListener('recruitai:open-chat', handleExternalOpen);
        return () => window.removeEventListener('recruitai:open-chat', handleExternalOpen);
    }, [token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [selectedChat?.messages]);

    useEffect(() => {
        assistantEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [assistantMessages, assistantLoading]);

    useEffect(() => {
        if (!socket || !token) return undefined;

        const handleNewMessage = async (payload) => {
            const chatId = payload?.chatId;
            const incomingMessage = payload?.message;
            if (!chatId || !incomingMessage) return;

            setChats((prev) =>
                prev.map((chat) => {
                    if (chat._id !== chatId) return chat;
                    const senderId = toId(incomingMessage.senderId);
                    const isMine = senderId === currentUserId;
                    const previousUnread = Number(chat.unreadCount || 0);
                    return {
                        ...chat,
                        lastMessage: incomingMessage.content,
                        lastMessageAt: incomingMessage.createdAt || new Date().toISOString(),
                        unreadCount: isMine ? previousUnread : previousUnread + 1
                    };
                })
            );

            if (selectedChat?._id === chatId) {
                setSelectedChat((prev) => {
                    if (!prev) return prev;
                    const exists = (prev.messages || []).some(
                        (msg) => msg._id && incomingMessage._id && msg._id === incomingMessage._id
                    );
                    if (exists) return prev;
                    return {
                        ...prev,
                        messages: [...(prev.messages || []), incomingMessage]
                    };
                });
                await markChatAsRead(chatId).catch(() => {});
            }
            fetchChats();
        };

        const handleNewChat = () => {
            fetchChats();
        };

        socket.on('new_message', handleNewMessage);
        socket.on('new_chat', handleNewChat);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('new_chat', handleNewChat);
        };
    }, [socket, token, selectedChat?._id, currentUserId]);

    const handleSendMessage = async () => {
        if (!selectedChat?._id || !messageText.trim() || sendingMessage) return;
        const content = messageText.trim();
        const tempId = `temp-${Date.now()}`;
        setMessageText('');

        setSelectedChat((prev) => ({
            ...prev,
            messages: [
                ...(prev?.messages || []),
                {
                    _id: tempId,
                    senderId: currentUserId,
                    content,
                    createdAt: new Date().toISOString(),
                    read: false
                }
            ]
        }));

        setSendingMessage(true);
        try {
            const response = await sendChatMessage(selectedChat._id, content);
            if (!response.status || !response.message) {
                throw new Error(response.message || response.error || 'Message non envoye');
            }

            setSelectedChat((prev) => ({
                ...prev,
                messages: (prev?.messages || []).map((msg) =>
                    msg._id === tempId ? response.message : msg
                )
            }));
            setChats((prev) =>
                prev.map((chat) =>
                    chat._id === selectedChat._id
                        ? {
                            ...chat,
                            lastMessage: response.message.content,
                            lastMessageAt: response.message.createdAt || new Date().toISOString()
                        }
                        : chat
                )
            );
        } catch (error) {
            setSelectedChat((prev) => ({
                ...prev,
                messages: (prev?.messages || []).filter((msg) => msg._id !== tempId)
            }));
            message.error(error.message || 'Impossible d envoyer le message');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleSendAssistantMessage = async () => {
        const userText = assistantInput.trim();
        if (!userText || assistantLoading) return;

        const localHistory = assistantMessages.slice(-8).map((entry) => ({
            role: entry.role,
            content: entry.text
        }));

        setAssistantInput('');
        setAssistantMessages((prev) => [...prev, { role: 'user', text: userText }]);
        setAssistantLoading(true);

        try {
            const response = await sendAssistantMessage(
                userText,
                {
                    testTitle:
                        selectedChat?.jobId?.title ||
                        (user?.role === 'HR' ? 'Assistant RH' : 'Assistant candidat'),
                    jobRole: selectedChat?.jobId?.jobRole || user?.preferredSector || ''
                },
                localHistory
            );

            const reply = response.reply || 'Je n ai pas pu generer de reponse.';
            setAssistantMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
        } catch (error) {
            setAssistantMessages((prev) => [
                ...prev,
                { role: 'assistant', text: 'Assistant indisponible pour le moment.' }
            ]);
            console.error('Assistant chat error:', error);
        } finally {
            setAssistantLoading(false);
        }
    };

    const renderConversations = () => (
        <div style={styles.conversationsWrap}>
            <div style={styles.chatListPane}>
                {loadingChats ? (
                    <div style={styles.centerBox}>
                        <Spin size="small" />
                    </div>
                ) : chats.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Aucune conversation"
                        style={{ marginTop: 28 }}
                    />
                ) : (
                    <List
                        dataSource={chats}
                        rowKey={(chat) => chat._id}
                        renderItem={(chat) => {
                            const other = getOtherParticipant(chat);
                            const selected = selectedChat?._id === chat._id;
                            return (
                                <List.Item
                                    style={{
                                        ...styles.chatListItem,
                                        ...(selected ? styles.chatListItemActive : null)
                                    }}
                                    onClick={() => openChat(chat._id)}
                                >
                                    <Badge count={chat.unreadCount || 0} size="small" offset={[-3, 2]}>
                                        <Avatar
                                            size={34}
                                            src={resolveAvatarUrl(other?.avatar)}
                                            icon={<UserOutlined />}
                                        />
                                    </Badge>
                                    <div style={styles.chatListItemText}>
                                        <div style={styles.chatListNameRow}>
                                            <Text strong style={{ fontSize: 13 }}>
                                                {(other?.firstName || '').trim()} {(other?.lastName || '').trim()}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {formatRelativeTime(chat.lastMessageAt)}
                                            </Text>
                                        </div>
                                        <Text
                                            type="secondary"
                                            ellipsis
                                            style={{
                                                fontSize: 12,
                                                fontWeight: chat.unreadCount ? 600 : 400
                                            }}
                                        >
                                            {chat.lastMessage || 'Nouvelle conversation'}
                                        </Text>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </div>

            <div style={styles.threadPane}>
                {!selectedChat ? (
                    <div style={styles.centerBox}>
                        <Text type="secondary">Selectionnez une conversation</Text>
                    </div>
                ) : (
                    <>
                        <div style={styles.threadHeader}>
                            <Avatar
                                size={30}
                                src={resolveAvatarUrl(getOtherParticipant(selectedChat)?.avatar)}
                                icon={<UserOutlined />}
                            />
                            <Text strong>
                                {(getOtherParticipant(selectedChat)?.firstName || '').trim()} {(getOtherParticipant(selectedChat)?.lastName || '').trim()}
                            </Text>
                        </div>

                        <div style={styles.messagesPane}>
                            {(selectedChat.messages || []).map((msg) => {
                                const senderId = toId(msg.senderId);
                                const isMine = senderId === currentUserId;
                                return (
                                    <div
                                        key={msg._id || `${msg.createdAt}-${msg.content}`}
                                        style={{
                                            ...styles.messageRow,
                                            justifyContent: isMine ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...styles.messageBubble,
                                                ...(isMine ? styles.myMessageBubble : styles.theirMessageBubble)
                                            }}
                                        >
                                            <Text style={{ color: isMine ? '#ffffff' : '#0f172a', whiteSpace: 'pre-wrap' }}>
                                                {msg.content}
                                            </Text>
                                            <div
                                                style={{
                                                    ...styles.messageMeta,
                                                    color: isMine ? 'rgba(255,255,255,0.72)' : '#64748b'
                                                }}
                                            >
                                                {formatRelativeTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={styles.composerRow}>
                            <Input
                                value={messageText}
                                onChange={(event) => setMessageText(event.target.value)}
                                onPressEnter={handleSendMessage}
                                placeholder="Ecrire un message..."
                                disabled={sendingMessage}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSendMessage}
                                loading={sendingMessage}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderAssistant = () => (
        <div style={styles.assistantWrap}>
            <div style={styles.assistantMessages}>
                {assistantMessages.length === 0 && (
                    <div style={styles.assistantHint}>
                        <RobotOutlined style={{ fontSize: 22, marginBottom: 8 }} />
                        <Text type="secondary">
                            Posez une question sur le recrutement, le screening, ou votre preparation.
                        </Text>
                    </div>
                )}

                {assistantMessages.map((entry, index) => (
                    <div
                        key={`${entry.role}-${index}`}
                        style={{
                            ...styles.assistantRow,
                            justifyContent: entry.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div
                            style={{
                                ...styles.assistantBubble,
                                ...(entry.role === 'user' ? styles.myMessageBubble : styles.theirMessageBubble)
                            }}
                        >
                            <Text style={{ color: entry.role === 'user' ? '#ffffff' : '#0f172a', whiteSpace: 'pre-wrap' }}>
                                {entry.text}
                            </Text>
                        </div>
                    </div>
                ))}

                {assistantLoading && (
                    <div style={styles.assistantLoading}>
                        <Spin size="small" />
                        <Text type="secondary">Assistant en cours...</Text>
                    </div>
                )}
                <div ref={assistantEndRef} />
            </div>

            <div style={styles.composerRow}>
                <Input
                    value={assistantInput}
                    onChange={(event) => setAssistantInput(event.target.value)}
                    onPressEnter={handleSendAssistantMessage}
                    placeholder="Demandez un conseil IA..."
                    disabled={assistantLoading}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendAssistantMessage}
                    loading={assistantLoading}
                />
            </div>
        </div>
    );

    if (!token || !user || !['HR', 'candidat'].includes(user.role)) {
        return null;
    }

    return (
        <>
            {!isOpen ? (
                <div style={styles.fabWrap}>
                    <Badge count={unreadCount} size="small">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<MessageOutlined />}
                            size="large"
                            onClick={() => setIsOpen(true)}
                            style={styles.fabButton}
                        />
                    </Badge>
                </div>
            ) : (
                <div style={styles.widget}>
                    <div style={styles.widgetHeader}>
                        <Text strong style={{ fontSize: 15 }}>Messagerie</Text>
                        <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => setIsOpen(false)}
                        />
                    </div>

                    <div style={styles.tabRow}>
                        <button
                            type="button"
                            style={{
                                ...styles.tabButton,
                                ...(activeTab === 'conversations' ? styles.tabButtonActive : null)
                            }}
                            onClick={() => setActiveTab('conversations')}
                        >
                            <MessageOutlined /> Conversations
                        </button>
                        <button
                            type="button"
                            style={{
                                ...styles.tabButton,
                                ...(activeTab === 'assistant' ? styles.tabButtonActive : null)
                            }}
                            onClick={() => setActiveTab('assistant')}
                        >
                            <RobotOutlined /> Assistant IA
                        </button>
                    </div>

                    <div style={styles.widgetBody}>
                        {activeTab === 'conversations' ? renderConversations() : renderAssistant()}
                    </div>
                </div>
            )}
        </>
    );
}

const styles = {
    fabWrap: {
        position: 'fixed',
        right: 18,
        bottom: 20,
        zIndex: 1100
    },
    fabButton: {
        width: 54,
        height: 54,
        boxShadow: '0 10px 24px rgba(37, 99, 235, 0.35)'
    },
    widget: {
        position: 'fixed',
        right: 14,
        bottom: 14,
        zIndex: 1100,
        width: 'min(430px, calc(100vw - 20px))',
        height: 'min(620px, calc(100vh - 28px))',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 22px 46px rgba(2, 6, 23, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    },
    widgetHeader: {
        height: 52,
        padding: '0 12px 0 14px',
        borderBottom: '1px solid #eef2f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    tabRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        padding: 10,
        borderBottom: '1px solid #eef2f7'
    },
    tabButton: {
        border: '1px solid #dbe4ef',
        background: '#f8fbff',
        color: '#334155',
        borderRadius: 10,
        padding: '8px 10px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },
    tabButtonActive: {
        background: '#e8f3ff',
        borderColor: '#93c5fd',
        color: '#1d4ed8'
    },
    widgetBody: {
        flex: 1,
        minHeight: 0
    },
    conversationsWrap: {
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '44% 56%',
        minHeight: 0
    },
    chatListPane: {
        borderRight: '1px solid #eef2f7',
        overflowY: 'auto',
        minHeight: 0
    },
    threadPane: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
    },
    chatListItem: {
        cursor: 'pointer',
        padding: '10px 10px',
        alignItems: 'center',
        gap: 10,
        display: 'flex'
    },
    chatListItemActive: {
        background: '#f1f7ff'
    },
    chatListItemText: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minWidth: 0,
        flex: 1
    },
    chatListNameRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
    },
    threadHeader: {
        borderBottom: '1px solid #eef2f7',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },
    messagesPane: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '10px 10px 8px',
        background: '#f8fbff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    messageRow: {
        display: 'flex'
    },
    messageBubble: {
        borderRadius: 12,
        maxWidth: '90%',
        padding: '8px 10px'
    },
    myMessageBubble: {
        background: '#2563eb'
    },
    theirMessageBubble: {
        background: '#e9eef5'
    },
    messageMeta: {
        marginTop: 4,
        fontSize: 10
    },
    composerRow: {
        borderTop: '1px solid #eef2f7',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 8
    },
    centerBox: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12
    },
    assistantWrap: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
    },
    assistantMessages: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 12,
        background: '#f8fbff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    assistantHint: {
        border: '1px dashed #cbd5e1',
        borderRadius: 12,
        padding: 14,
        textAlign: 'center',
        color: '#64748b'
    },
    assistantRow: {
        display: 'flex'
    },
    assistantBubble: {
        borderRadius: 12,
        maxWidth: '92%',
        padding: '9px 11px'
    },
    assistantLoading: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        color: '#64748b',
        fontSize: 12
    }
};
