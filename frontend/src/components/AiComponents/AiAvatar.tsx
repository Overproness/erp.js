import React from 'react';
import { Avatar, Badge } from '@/components/ui';
import { RobotOutlined } from '@/components/icons';

export default function AiAvatar({
  size = 40,
  type = 'general',
  name,
  style = {},
  showStatus = false,
  status = 'offline', // 'online' | 'busy' | 'offline'
  ...props
}) {
  const getTypeColor = (type) => {
    const colors = {
      general: '#1890ff',
      document: '#52c41a',
      workflow: '#fa8c16',
      analytics: '#722ed1',
      customer: '#13c2c2',
      financial: '#faad14',
    };
    return colors[type] || '#1890ff';
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarStyle = {
    backgroundColor: getTypeColor(type),
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    ...style,
  };

  const avatar = (
    <Avatar
      size={size}
      style={avatarStyle}
      icon={name ? undefined : <RobotOutlined />}
      {...props}
    >
      {name ? getInitials(name) : null}
    </Avatar>
  );

  if (showStatus) {
    const statusMap = {
      online: 'success',
      busy: 'processing',
      offline: 'default',
    };

    return (
      <Badge
        dot
        status={statusMap[status] || 'default'}
        offset={[-8, 8]}
      >
        {avatar}
      </Badge>
    );
  }

  return avatar;
}
