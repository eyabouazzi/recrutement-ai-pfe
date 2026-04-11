import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getAvatarUrl, getInitials } from '../utils/avatar.js';

export default function UserAvatar({ user, size = 32, style, className }) {
  const initials = getInitials(user?.firstName, user?.lastName);
  const src = getAvatarUrl(user?.avatar);

  return (
    <Avatar
      size={size}
      src={src || undefined}
      style={{
        background: src
          ? undefined
          : 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(6,182,212,0.85))',
        color: '#fff',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        ...style,
      }}
      className={className}
    >
      {!src ? initials : <UserOutlined />}
    </Avatar>
  );
}
