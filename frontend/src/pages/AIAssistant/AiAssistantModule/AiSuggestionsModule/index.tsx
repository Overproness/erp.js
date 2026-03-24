import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import { selectCurrentSuggestions, selectSuggestionsLoading } from '@/redux/ai/aiSelectors';
import { fetchSuggestions } from '@/redux/ai/aiThunks';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  BulbOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Tabs, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AutomationSuggestions from './AutomationSuggestions';
import BusinessInsights from './BusinessInsights';
import ProcessOptimization from './ProcessOptimization';

const { Title } = Typography;

const AiSuggestionsModule = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();

  const suggestions = useSelector(selectCurrentSuggestions);
  const loading = useSelector(selectSuggestionsLoading);
  const [activeTab, setActiveTab] = useState('automation');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    // Fetch suggestions for all modules
    const modules = ['client', 'invoice', 'quote', 'workflow'];
    modules.forEach((module) => {
      dispatch(
        fetchSuggestions({
          module,
          data: {},
          assistantId: 'default',
        })
      );
    });
  }, [dispatch]);

  const tabItems = [
    {
      key: 'automation',
      label: (
        <Space>
          <SettingOutlined />
          {translate('Automation')}
        </Space>
      ),
      children: <AutomationSuggestions suggestions={suggestions} loading={loading} />,
    },
    {
      key: 'optimization',
      label: (
        <Space>
          <BulbOutlined />
          {translate('Process Optimization')}
        </Space>
      ),
      children: <ProcessOptimization suggestions={suggestions} loading={loading} />,
    },
    {
      key: 'insights',
      label: (
        <Space>
          <BarChartOutlined />
          {translate('Business Insights')}
        </Space>
      ),
      children: <BusinessInsights suggestions={suggestions} loading={loading} />,
    },
  ];

  return (
    <ErpLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ai-assistant')}>
              {translate('Back')}
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {translate('AI Suggestions')}
            </Title>
          </Space>
        </div>

        {/* Main Content */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
    </ErpLayout>
  );
};

export default AiSuggestionsModule;
