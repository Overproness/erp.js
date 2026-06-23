import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from '@/components/icons';
import { Button, Card, Descriptions, List, Modal, Space, Tag, message } from '@/components/ui';
import { useState } from 'react';

const { confirm } = Modal;

export default function RecurringBillingCard({ invoice, onUpdate }) {
  const translate = useLanguage();
  const money = useMoney();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  const config = invoice.recurringConfig || {};

  const handleGenerateInvoice = () => {
    confirm({
      title: translate('Generate Next Invoice'),
      content: translate('Are you sure you want to generate the next recurring invoice?'),
      onOk: async () => {
        setLoading(true);
        try {
          const { request } = await import('@/request');
          const response = await request.post(`invoice/recurring/generate/${invoice._id}`, {});
          if (response.success) {
            message.success(translate('Invoice generated successfully'));
            onUpdate && onUpdate();
          }
        } catch (error) {
          message.error(translate('Failed to generate invoice'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePauseResume = () => {
    const isPaused = config.pausedUntil && new Date(config.pausedUntil) > new Date();
    const pausedUntil = isPaused ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Pause for 30 days

    confirm({
      title: isPaused
        ? translate('Resume Recurring Billing')
        : translate('Pause Recurring Billing'),
      content: isPaused
        ? translate('Resume automatic invoice generation?')
        : translate('Pause recurring billing for 30 days?'),
      onOk: async () => {
        setLoading(true);
        try {
          const { request } = await import('@/request');
          const response = await request.patch(`invoice/recurring/pause/${invoice._id}`, {
            pausedUntil,
          });
          if (response.success) {
            message.success(
              isPaused
                ? translate('Recurring billing resumed')
                : translate('Recurring billing paused')
            );
            onUpdate && onUpdate();
          }
        } catch (error) {
          message.error(translate('Operation failed'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleStop = () => {
    confirm({
      title: translate('Stop Recurring Billing'),
      content: translate(
        'Are you sure you want to permanently stop recurring billing? This cannot be undone.'
      ),
      okText: translate('Yes, Stop'),
      okType: 'danger',
      onOk: async () => {
        setLoading(true);
        try {
          const { request } = await import('@/request');
          const response = await request.patch(`invoice/recurring/stop/${invoice._id}`, {});
          if (response.success) {
            message.success(translate('Recurring billing stopped'));
            onUpdate && onUpdate();
          }
        } catch (error) {
          message.error(translate('Failed to stop recurring billing'));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleViewHistory = async () => {
    setLoading(true);
    try {
      const { request } = await import('@/request');
      const response = await request.get(`invoice/recurring/history/${invoice._id}`);
      if (response.success) {
        setHistory(response.result || []);
        setHistoryVisible(true);
      }
    } catch (error) {
      message.error(translate('Failed to load history'));
    } finally {
      setLoading(false);
    }
  };

  const isPaused = config.pausedUntil && new Date(config.pausedUntil) > new Date();
  const isEnded = config.endDate && new Date(config.endDate) < new Date();
  const maxOccurrencesReached =
    config.occurrences && config.occurrencesCompleted >= config.occurrences;

  return (
    <>
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: '#8b45ff' }} />
            {translate('Recurring Billing Settings')}
            {isPaused && <Tag color="orange">{translate('Paused')}</Tag>}
            {isEnded && <Tag color="red">{translate('Ended')}</Tag>}
            {maxOccurrencesReached && <Tag color="red">{translate('Completed')}</Tag>}
          </Space>
        }
        extra={
          <Space>
            {!isEnded && !maxOccurrencesReached && (
              <>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={handleGenerateInvoice}
                  loading={loading}
                  size="small"
                >
                  {translate('Generate Now')}
                </Button>
                <Button
                  icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={handlePauseResume}
                  loading={loading}
                  size="small"
                >
                  {isPaused ? translate('Resume') : translate('Pause')}
                </Button>
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStop}
                  loading={loading}
                  size="small"
                >
                  {translate('Stop')}
                </Button>
              </>
            )}
            <Button onClick={handleViewHistory} loading={loading} size="small">
              {translate('View History')}
            </Button>
          </Space>
        }
        size="medium"
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label={translate('Frequency')}>
            {translate(config.frequency || 'N/A')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Next Billing Date')}>
            {config.nextBillingDate
              ? new Date(config.nextBillingDate).toLocaleDateString()
              : translate('N/A')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Start Date')}>
            {config.startDate ? new Date(config.startDate).toLocaleDateString() : translate('N/A')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('End Date')}>
            {config.endDate
              ? new Date(config.endDate).toLocaleDateString()
              : translate('Indefinite')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Occurrences')}>
            {config.occurrencesCompleted || 0} / {config.occurrences || translate('Unlimited')}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Auto Send')}>
            {config.autoSend ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                {translate('Enabled')}
              </Tag>
            ) : (
              <Tag>{translate('Disabled')}</Tag>
            )}
          </Descriptions.Item>
          {config.lastBillingDate && (
            <Descriptions.Item label={translate('Last Generated')}>
              {new Date(config.lastBillingDate).toLocaleDateString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* History Modal */}
      <Modal
        title={translate('Recurring Invoice History')}
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={history}
          renderItem={(item) => (
            <List.Item
              key={item._id}
              actions={[
                <Tag key="status" color={item.paymentStatus === 'paid' ? 'green' : 'orange'}>
                  {translate(item.paymentStatus)}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                title={`Invoice #${item.number}/${item.year}`}
                description={
                  <Space direction="vertical" size="small">
                    <span>
                      {translate('Date')}: {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span>
                      {translate('Amount')}:{' '}
                      {money.moneyFormatter({ amount: item.total, currency_code: item.currency })}
                    </span>
                    <span>
                      {translate('Client')}: {item.client?.name}
                    </span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}
