import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Empty, List, Segmented, Space, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext.jsx';
import { getNotifications, markAllAsRead, markAsRead } from '../api/appNotification.js';
import { useAuth } from '../contexts/authContext.jsx';

const { Text } = Typography;

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function NotificationBell() {
  const { notifications: liveNotifications, unreadCount } = useWebSocket();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('unread');
  const lastUnreadRef = useRef(0);

  const merged = useMemo(() => {
    const seen = new Set();
    const all = [...liveNotifications, ...items];
    const out = [];
    for (const n of all) {
      const key = n?._id || n?.id || `${n?.title || ''}-${n?.message || ''}-${n?.timestamp || ''}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
    return out.slice(0, 15);
  }, [liveNotifications, items]);

  const roleFiltered = useMemo(() => {
    const role = String(user?.role || '').trim();
    if (!role) return merged;
    const allowedByRole = {
      HR: new Set(['CANDIDATE_SUBMITTED', 'SUBMISSION_CREATED', 'SUSPICIOUS_PASTE_ACTIVITY', 'CHEATING_ALERT', 'general']),
      candidat: new Set(['APPLICATION_STATUS_CHANGED', 'INTERVIEW_SCHEDULED', 'NEW_MATCH_RECOMMENDATION', 'general']),
    };
    return merged.filter((n) => {
      const targetRole = String(n?.targetRole || n?.data?.targetRole || '').trim();
      if (targetRole && targetRole !== 'all' && targetRole !== role) return false;
      if (targetRole === role || targetRole === 'all') return true;
      const allowed = allowedByRole[role];
      if (!allowed) return true;
      return allowed.has(String(n?.type || 'general'));
    });
  }, [merged, user?.role]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ page: 1, limit: 20 });
      if (res?.status && Array.isArray(res.notifications)) {
        setItems(res.notifications);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
  }, [open]);

  useEffect(() => {
    // subtle sound cue for newly arrived notifications
    if (unreadCount > lastUnreadRef.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 880;
          gain.gain.value = 0.02;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
        }
      } catch {
        // no-op if sound asset missing
      }
    }
    lastUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const visibleItems = useMemo(() => {
    if (mode === 'all') return roleFiltered;
    return roleFiltered.filter((n) => !n.read);
  }, [roleFiltered, mode]);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkOne = async (id) => {
    if (!id) return;
    await markAsRead(id);
    setItems((prev) => prev.map((n) => ((n._id || n.id) === id ? { ...n, read: true } : n)));
  };

  return (
    <div style={{ position: 'relative' }}>
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          aria-label="Notifications"
          icon={<BellOutlined />}
          onClick={() => setOpen((v) => !v)}
          className={unreadCount > 0 ? 'notif-pulse' : ''}
        />
      </Badge>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 360,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            boxShadow: '0 18px 45px rgba(15,23,42,0.15)',
            zIndex: 1300,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text strong>Notifications</Text>
            <Button size="small" icon={<CheckOutlined />} onClick={handleMarkAll} disabled={unreadCount === 0}>
              Tout lire
            </Button>
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <Segmented
              block
              options={[
                { label: `Non lues (${unreadCount})`, value: 'unread' },
                { label: 'Toutes', value: 'all' },
              ]}
              value={mode}
              onChange={(value) => setMode(value)}
            />
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
            {visibleItems.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune notification" />
            ) : (
              <List
                loading={loading}
                dataSource={visibleItems}
                renderItem={(n) => {
                  const id = n._id || n.id;
                  return (
                    <List.Item
                      key={id || `${n.title}-${n.timestamp}`}
                      style={{
                        borderRadius: 8,
                        marginBottom: 6,
                        background: n.read ? '#fff' : '#f8fafc',
                        border: `1px solid ${n.read ? '#f1f5f9' : '#dbeafe'}`,
                      }}
                      actions={[
                        !n.read && id ? (
                          <Button size="small" type="link" onClick={() => handleMarkOne(id)}>
                            Marquer lu
                          </Button>
                        ) : null,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space size={8}>
                            <Text strong={!n.read}>{n.title || 'Notification'}</Text>
                            {!n.read && <Badge color="#3b82f6" />}
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary">{n.message || ''}</Text>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                              {formatTime(n.timestamp || n.createdAt)}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </div>
        </div>
      )}
      <style>{`
        .notif-pulse {
          animation: notifPulse 1.8s ease-in-out infinite;
          box-shadow: 0 0 0 rgba(59,130,246,0);
        }
        @keyframes notifPulse {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.35); }
          70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
}
