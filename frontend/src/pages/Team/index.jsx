import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Row, Col, Statistic, Card, Spin } from 'antd';
import { PlusOutlined, TeamOutlined, UserOutlined, CrownOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { TeamDataTableModule } from './TeamModule/TeamDataTableModule';
import { TEAM_ENTITY } from './TeamModule/TeamDataTableModule/config';
import useLanguage from '@/locale/useLanguage';
import { useTeamStats } from '@/hooks/useStatistics';

const { Title, Text } = Typography;

const Team = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  
  // Use dynamic statistics from API
  const { data: teamStats, loading: statsLoading, error: statsError } = useTeamStats({ 
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutes
  });

  const handleCreateNew = () => {
    navigate('/team/create');
  };
  
  const config = {
    entity: TEAM_ENTITY,
    DATATABLE_TITLE: translate('team_list'),
    ADD_NEW_ENTITY: translate('add_team'),
    ENTITY_NAME: translate('team')
  };
  
  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('Team Management')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Organize and manage your team members and collaboration
            </Text>
          </div>
          {/* Removed duplicate create button - will be handled by TeamDataTableModule */}
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Total Members')}
                  value={teamStats?.totalMembers || 0}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<UserOutlined style={{ color: '#8b45ff' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Active Teams')}
                  value={teamStats?.activeTeams || 0}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<TeamOutlined style={{ color: '#10b981' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Completed Tasks')}
                  value={teamStats?.tasks?.completed || 0}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#6366f1' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('New This Month')}
                  value={teamStats?.newThisMonth || 0}
                  valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                  prefix={<CalendarOutlined style={{ color: '#a855f7' }} />}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
        }}
      >
        <TeamDataTableModule config={config} />
      </Card>
    </div>
  );
};

export default Team;