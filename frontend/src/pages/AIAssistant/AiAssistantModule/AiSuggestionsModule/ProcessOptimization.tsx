import useLanguage from '@/locale/useLanguage';
import { selectSuggestions, selectSuggestionsLoading } from '@/redux/ai/aiSelectors';
import { fetchSuggestions } from '@/redux/ai/aiThunks';
import { CheckCircleOutlined, RiseOutlined, SettingOutlined } from '@/components/icons';
import { Button, Card, Empty, List, Progress, Space, Spin, Tag, Typography } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;

const ProcessOptimization = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [selectedProcess, setSelectedProcess] = useState('workflow');

  const suggestions = useSelector(selectSuggestions);
  const loading = useSelector(selectSuggestionsLoading);
  const prevProcessRef = useRef('');

  useEffect(() => {
    if (prevProcessRef.current === selectedProcess) return;
    prevProcessRef.current = selectedProcess;
    dispatch(
      fetchSuggestions({
        module: selectedProcess,
        type: 'optimization',
        data: {},
      })
    );
  }, [dispatch, selectedProcess]);

  const processes = [
    { key: 'workflow', label: 'Workflows' },
    { key: 'approval', label: 'Approval Processes' },
    { key: 'communication', label: 'Communication' },
    { key: 'reporting', label: 'Reporting' },
    { key: 'data', label: 'Data Management' },
  ];

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getImpactValue = (impact) => {
    switch (impact) {
      case 'high':
        return 80;
      case 'medium':
        return 50;
      case 'low':
        return 20;
      default:
        return 0;
    }
  };

  return (
    <div>
      <Card
        title={
          <>
            <SettingOutlined /> {translate('Process Optimization Recommendations')}
          </>
        }
        extra={
          <Space>
            {processes.map((process) => (
              <Button
                key={process.key}
                type={selectedProcess === process.key ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedProcess(process.key)}
              >
                {translate(process.label)}
              </Button>
            ))}
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: '16px' }}>
              {translate('Analyzing process optimization opportunities...')}
            </Paragraph>
          </div>
        ) : suggestions?.optimization?.length > 0 ? (
          <List
            dataSource={suggestions.optimization}
            renderItem={(optimization) => (
              <List.Item>
                <Card
                  size="small"
                  style={{ width: '100%' }}
                  actions={[
                    <Button key="apply" type="primary" icon={<CheckCircleOutlined />} size="small">
                      {translate('Apply Optimization')}
                    </Button>,
                    <Button key="analyze" icon={<RiseOutlined />} size="small">
                      {translate('Detailed Analysis')}
                    </Button>,
                  ]}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <Title level={5} style={{ margin: 0 }}>
                          {optimization.title}
                        </Title>
                        <Space style={{ marginTop: '8px' }}>
                          <Tag color={optimization.type === 'bottleneck' ? 'red' : 'blue'}>
                            {translate(optimization.type)}
                          </Tag>
                          <Tag color="purple">{optimization.category}</Tag>
                        </Space>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                        <Text type="secondary">{translate('Impact')}</Text>
                        <Progress
                          type="circle"
                          size={60}
                          percent={getImpactValue(optimization.impact)}
                          status={getImpactColor(optimization.impact)}
                          format={() => optimization.impact}
                        />
                      </div>
                    </div>
                  </div>

                  <Paragraph>{optimization.description}</Paragraph>

                  {optimization.currentState && (
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>{translate('Current State')}:</Text>
                      <Paragraph style={{ marginLeft: '16px', marginTop: '4px' }}>
                        {optimization.currentState}
                      </Paragraph>
                    </div>
                  )}

                  {optimization.proposedSolution && (
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong>{translate('Proposed Solution')}:</Text>
                      <Paragraph style={{ marginLeft: '16px', marginTop: '4px' }}>
                        {optimization.proposedSolution}
                      </Paragraph>
                    </div>
                  )}

                  {optimization.expectedOutcomes && (
                    <div>
                      <Text strong>{translate('Expected Outcomes')}:</Text>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {optimization.expectedOutcomes.map((outcome, index) => (
                          <li key={index}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {optimization.metrics && (
                    <div style={{ marginTop: '12px' }}>
                      <Text strong>{translate('Key Metrics')}:</Text>
                      <div style={{ marginTop: '8px' }}>
                        {Object.entries(optimization.metrics).map(([key, value]) => (
                          <Tag key={key} style={{ margin: '2px' }}>
                            {key}: {value}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={translate('No optimization recommendations available for this process')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};

export default ProcessOptimization;
