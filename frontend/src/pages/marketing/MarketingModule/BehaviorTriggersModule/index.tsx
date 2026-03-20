import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Switch, 
  Card, 
  Divider, 
  Row, 
  Col, 
  Typography, 
  Tabs, 
  Space,
  Collapse,
  Tag,
  message,
  DatePicker,
  Radio,
  Tooltip,
  InputNumber,
  TimePicker
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  BellOutlined,
  MailOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ScheduleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import moment from 'moment';

// Components
import TriggerConditionBuilder from './components/TriggerConditionBuilder';
import TriggerActionBuilder from './components/TriggerActionBuilder';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;

const BehaviorTriggersModule = ({ trigger, onSave, onCancel }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [conditions, setConditions] = useState(trigger?.conditions || []);
  const [actions, setActions] = useState(trigger?.actions || []);
  const [activeTab, setActiveTab] = useState('conditions');
  const [testResult, setTestResult] = useState(null);
  const [advancedSettingsVisible, setAdvancedSettingsVisible] = useState(!!trigger?.settings);
  const [scheduleType, setScheduleType] = useState(trigger?.settings?.scheduleType || 'immediate');

  // Initialize form with existing trigger data
  useEffect(() => {
    if (trigger) {
      form.setFieldsValue({
        name: trigger.name,
        description: trigger.description,
        eventType: trigger.eventType,
        priority: trigger.priority || 'medium',
        active: trigger.active !== undefined ? trigger.active : true,
        cooldownPeriod: trigger.cooldownPeriod || 0,
        settings: {
          executionLimit: trigger.settings?.executionLimit,
          timeWindow: trigger.settings?.timeWindow,
          userSegment: trigger.settings?.userSegment,
          userPercentage: trigger.settings?.userPercentage,
          scheduleType: trigger.settings?.scheduleType || 'immediate',
          delayTime: trigger.settings?.delayTime,
          delayUnit: trigger.settings?.delayUnit || 'minutes',
          scheduleTime: trigger.settings?.scheduleTime && moment(trigger.settings.scheduleTime),
          scheduleRecurring: trigger.settings?.recurringFrequency === 'daily' || trigger.settings?.recurringFrequency === 'weekly' || trigger.settings?.recurringFrequency === 'monthly',
          recurringFrequency: trigger.settings?.recurringFrequency || 'daily',
          activeHours: trigger.settings?.activeHours && {
            start: trigger.settings.activeHours.start && moment(trigger.settings.activeHours.start, 'HH:mm'),
            end: trigger.settings.activeHours.end && moment(trigger.settings.activeHours.end, 'HH:mm'),
          }
        }
      });
      
      setConditions(trigger.conditions || []);
      setActions(trigger.actions || []);
      setAdvancedSettingsVisible(!!trigger.settings);
      setScheduleType(trigger.settings?.scheduleType || 'immediate');
    }
  }, [trigger, form]);

  // Event types available for triggers
  const eventTypes = [
    { value: 'page_view', label: translate('Page View') },
    { value: 'form_submission', label: translate('Form Submission') },
    { value: 'button_click', label: translate('Button Click') },
    { value: 'cart_abandonment', label: translate('Cart Abandonment') },
    { value: 'purchase', label: translate('Purchase Completed') },
    { value: 'email_open', label: translate('Email Opened') },
    { value: 'email_click', label: translate('Email Link Clicked') },
    { value: 'login', label: translate('User Login') },
    { value: 'signup', label: translate('User Signup') },
    { value: 'custom_event', label: translate('Custom Event') },
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Process form values
      const settings = values.settings || {};
      
      // Process schedule times if they exist
      if (settings.scheduleTime) {
        settings.scheduleTime = settings.scheduleTime.format();
      }
      
      // Process active hours if they exist
      if (settings.activeHours) {
        settings.activeHours = {
          start: settings.activeHours.start ? settings.activeHours.start.format('HH:mm') : null,
          end: settings.activeHours.end ? settings.activeHours.end.format('HH:mm') : null,
        };
      }
      
      const triggerData = {
        ...values,
        conditions,
        actions,
        settings: advancedSettingsVisible ? settings : null
      };

      // Here you would dispatch to your Redux actions
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 800));
      
      message.success(translate(trigger ? 'Trigger updated successfully' : 'Trigger created successfully'));
      onSave(triggerData);
    } catch (error) {
      console.error('Error saving trigger:', error);
      message.error(translate('Failed to save trigger'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCondition = (condition) => {
    setConditions([...conditions, condition]);
  };

  const handleUpdateCondition = (index, condition) => {
    const newConditions = [...conditions];
    newConditions[index] = condition;
    setConditions(newConditions);
  };

  const handleRemoveCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const handleAddAction = (action) => {
    setActions([...actions, action]);
  };

  const handleUpdateAction = (index, action) => {
    const newActions = [...actions];
    newActions[index] = action;
    setActions(newActions);
  };

  const handleRemoveAction = (index) => {
    const newActions = actions.filter((_, i) => i !== index);
    setActions(newActions);
  };

  const handleTestTrigger = () => {
    // Simulate testing the trigger
    setLoading(true);
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResult({
        success,
        message: success ? 'Trigger conditions match test data' : 'Trigger conditions do not match test data',
      });
      setLoading(false);
    }, 1000);
  };

  const handleScheduleTypeChange = (e) => {
    const newScheduleType = e.target.value;
    setScheduleType(newScheduleType);
    
    // Clear conditional fields when schedule type changes
    const currentSettings = form.getFieldValue('settings') || {};
    const updatedSettings = {
      ...currentSettings,
      scheduleType: newScheduleType,
    };
    
    // Clear schedule-specific fields
    if (newScheduleType !== 'delayed') {
      delete updatedSettings.delayTime;
      delete updatedSettings.delayUnit;
    }
    if (newScheduleType !== 'scheduled') {
      delete updatedSettings.scheduleTime;
      delete updatedSettings.scheduleRecurring;
      delete updatedSettings.recurringFrequency;
    }
    
    form.setFieldsValue({ settings: updatedSettings });
  };

  const handleAdvancedToggle = (checked) => {
    setAdvancedSettingsVisible(checked);
    if (!checked) {
      // Clear all advanced settings when disabled
      form.setFieldsValue({
        settings: {
          scheduleType: 'immediate'
        }
      });
      setScheduleType('immediate');
    }
  };

  // Watch for recurring toggle changes
  const handleRecurringToggle = (checked) => {
    const currentSettings = form.getFieldValue('settings') || {};
    form.setFieldsValue({
      settings: {
        ...currentSettings,
        scheduleRecurring: checked
      }
    });
  };

  // Renderer for condition tags
  const renderConditionTag = (condition) => {
    let text = '';
    switch (condition.type) {
      case 'page_url':
        text = `URL ${condition.operator} ${condition.value}`;
        break;
      case 'user_property':
        text = `User ${condition.property} ${condition.operator} ${condition.value}`;
        break;
      case 'event_property':
        text = `Event ${condition.property} ${condition.operator} ${condition.value}`;
        break;
      case 'device':
        text = `Device is ${condition.value}`;
        break;
      case 'time':
        text = `Time ${condition.operator} ${condition.value}`;
        break;
      default:
        text = `${condition.type}: ${condition.value}`;
    }
    return text; // return plain text, not a Tag to avoid nested Tags
  };

  // Renderer for action tags
  const renderActionTag = (action) => {
    let text = '';
    switch (action.type) {
      case 'send_email':
        text = `Send email template: ${action.template}`;
        break;
      case 'send_notification':
        text = `Send notification: ${action.message}`;
        break;
      case 'update_property':
        text = `Set ${action.property} to ${action.value}`;
        break;
      case 'add_tag':
        text = `Add tag: ${action.tag}`;
        break;
      case 'webhook':
        text = `Call webhook: ${action.url}`;
        break;
      default:
        text = `${action.type}: ${action.value || ''}`;
    }
    return text; // return plain text, not a Tag to avoid nested Tags
  };

  const isFormValid = () => {
    return conditions.length > 0 && actions.length > 0;
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          active: true,
          priority: 'medium',
          cooldownPeriod: 0,
          settings: {
            scheduleType: 'immediate',
            delayUnit: 'minutes',
            scheduleRecurring: false,
            recurringFrequency: 'daily'
          }
        }}
      >
        <Row gutter={24}>
          <Col span={16}>
            {/* Basic Information */}
            <Card style={{ marginBottom: '24px' }}>
              <Form.Item
                name="name"
                label={translate('Trigger Name')}
                rules={[
                  {
                    required: true,
                    message: translate('Please enter a trigger name'),
                  },
                ]}
              >
                <Input placeholder={translate('Enter trigger name')} />
              </Form.Item>

              <Form.Item
                name="description"
                label={translate('Description')}
              >
                <TextArea
                  placeholder={translate('Briefly describe what this trigger does')}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="eventType"
                    label={translate('Event Type')}
                    rules={[
                      {
                        required: true,
                        message: translate('Please select an event type'),
                      },
                    ]}
                  >
                    <Select placeholder={translate('Select event type')}>
                      {eventTypes.map(event => (
                        <Option key={event.value} value={event.value}>{event.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label={translate('Priority')}
                  >
                    <Select>
                      <Option value="high">{translate('High')}</Option>
                      <Option value="medium">{translate('Medium')}</Option>
                      <Option value="low">{translate('Low')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="cooldownPeriod"
                    label={translate('Cooldown Period (hours)')}
                    tooltip={translate('Minimum time between trigger activations for the same user')}
                  >
                    <Input type="number" min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="active"
                    label={translate('Status')}
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={translate('Active')}
                      unCheckedChildren={translate('Inactive')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Conditions and Actions Builder */}
            <Card>
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane 
                  tab={
                    <span>
                      <FilterOutlined /> {translate('Conditions')} ({conditions.length})
                    </span>
                  }
                  key="conditions"
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Text>{translate('Add conditions that must be met to trigger the actions')}</Text>
                  </div>

                  <TriggerConditionBuilder
                    conditions={conditions}
                    onAdd={handleAddCondition}
                    onUpdate={handleUpdateCondition}
                    onRemove={handleRemoveCondition}
                    eventType={form.getFieldValue('eventType')}
                  />

                  {conditions.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>{translate('Current Conditions:')}</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Space wrap>
                          {conditions.map((condition, index) => (
                            <Tag 
                              key={index} 
                              color="blue" 
                              closable 
                              onClose={() => handleRemoveCondition(index)}
                            >
                              {renderConditionTag(condition)}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  )}
                </TabPane>

                <TabPane 
                  tab={
                    <span>
                      <ThunderboltOutlined /> {translate('Actions')} ({actions.length})
                    </span>
                  }
                  key="actions"
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Text>{translate('Define actions to perform when conditions are met')}</Text>
                  </div>
                  
                  <TriggerActionBuilder
                    actions={actions}
                    onAdd={handleAddAction}
                    onUpdate={handleUpdateAction}
                    onRemove={handleRemoveAction}
                  />

                  {actions.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Text strong>{translate('Current Actions:')}</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Space wrap>
                          {actions.map((action, index) => (
                            <Tag 
                              key={index} 
                              color="green" 
                              closable 
                              onClose={() => handleRemoveAction(index)}
                            >
                              {renderActionTag(action)}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          <Col span={8}>
            {/* Summary and Testing */}
            <Card title={translate('Trigger Overview')} style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('When:')}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Tag icon={<BellOutlined />} color="purple">
                    {eventTypes.find(e => e.value === form.getFieldValue('eventType'))?.label || translate('Event occurs')}
                  </Tag>
                </div>
              </div>

              {conditions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>{translate('If:')}</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Space wrap>
                      {conditions.map((condition, index) => (
                        <Tag key={index} color="blue">{renderConditionTag(condition)}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              )}

              {actions.length > 0 && (
                <div>
                  <Text strong>{translate('Then:')}</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Space wrap>
                      {actions.map((action, index) => (
                        <Tag key={index} color="green">{renderActionTag(action)}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              )}

              {(!conditions.length || !actions.length) && (
                <div style={{ marginTop: '16px', textAlign: 'center', color: '#6b7280' }}>
                  {translate('Add conditions and actions to build your trigger')}
                </div>
              )}

              <Divider />

              <Button 
                type="primary" 
                ghost
                icon={<ThunderboltOutlined />}
                onClick={handleTestTrigger}
                loading={loading}
                disabled={!isFormValid()}
                block
              >
                {translate('Test Trigger')}
              </Button>

              {testResult && (
                <div 
                  style={{ 
                    marginTop: '16px', 
                    padding: '12px',
                    backgroundColor: testResult.success ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${testResult.success ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <Text style={{ color: testResult.success ? '#10b981' : '#ef4444' }}>
                    {testResult.message}
                  </Text>
                </div>
              )}
            </Card>

            {/* Enhanced Settings */}
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {translate('Trigger Settings')}
                  <Switch 
                    checkedChildren={translate('Advanced')} 
                    unCheckedChildren={translate('Basic')}
                    checked={advancedSettingsVisible}
                    onChange={handleAdvancedToggle}
                  />
                </div>
              }
            >
              {!advancedSettingsVisible ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280' }}>
                  <InfoCircleOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#d1d5db' }} />
                  <div>
                    <Text>{translate('Enable advanced settings to configure:')}</Text>
                    <ul style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px' }}>
                      <li>{translate('Execution limits')}</li>
                      <li>{translate('Scheduling options')}</li>
                      <li>{translate('User segmentation')}</li>
                      <li>{translate('Active hours')}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <Collapse defaultActiveKey={['execution']} ghost>
                  <Panel 
                    header={
                      <span>
                        <ClockCircleOutlined /> {translate('Execution Settings')}
                      </span>
                    } 
                    key="execution"
                  >
                    <Form.Item
                      name={['settings', 'executionLimit']}
                      label={
                        <span>
                          {translate('Max Executions')} 
                          <Tooltip title={translate('Maximum number of times this trigger can run per user')}>
                            <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        placeholder={translate('Unlimited')}
                        addonAfter={translate('times')}
                      />
                    </Form.Item>

                    <Form.Item
                      name={['settings', 'timeWindow']}
                      label={
                        <span>
                          {translate('Time Window')} 
                          <Tooltip title={translate('Period in which execution limit applies')}>
                            <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        placeholder={translate('No limit')}
                        addonAfter={translate('days')}
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label={
                        <span>
                          {translate('Active Hours')} 
                          <Tooltip title={translate('Only execute trigger during these hours')}>
                            <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <Input.Group compact>
                        <Form.Item noStyle name={['settings', 'activeHours', 'start']}>
                          <TimePicker 
                            format="HH:mm" 
                            style={{ width: '50%' }} 
                            placeholder={translate('Start')}
                            allowClear 
                          />
                        </Form.Item>
                        <Form.Item noStyle name={['settings', 'activeHours', 'end']}>
                          <TimePicker 
                            format="HH:mm" 
                            style={{ width: '50%' }} 
                            placeholder={translate('End')}
                            allowClear 
                          />
                        </Form.Item>
                      </Input.Group>
                    </Form.Item>
                  </Panel>

                  <Panel 
                    header={
                      <span>
                        <TeamOutlined /> {translate('User Targeting')}
                      </span>
                    } 
                    key="targeting"
                  >
                    <Form.Item
                      name={['settings', 'userSegment']}
                      label={
                        <span>
                          {translate('User Segment')}
                          <Tooltip title={translate('Limit trigger to specific user segments')}>
                            <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <Select placeholder={translate('All users')} allowClear>
                        <Option value="new">{translate('New Users')}</Option>
                        <Option value="returning">{translate('Returning Users')}</Option>
                        <Option value="vip">{translate('VIP Users')}</Option>
                        <Option value="inactive">{translate('Inactive Users')}</Option>
                        <Option value="high_value">{translate('High Value Customers')}</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name={['settings', 'userPercentage']}
                      label={
                        <span>
                          {translate('Target Percentage')}
                          <Tooltip title={translate('Percentage of qualifying users to target (A/B testing)')}>
                            <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                          </Tooltip>
                        </span>
                      }
                    >
                      <InputNumber 
                        min={1}
                        max={100} 
                        style={{ width: '100%' }} 
                        placeholder="100"
                        formatter={value => (value !== undefined && value !== null ? `${value}%` : '')}
                        parser={value => (value ? value.replace('%', '') : '')}
                      />
                    </Form.Item>
                  </Panel>

                  <Panel 
                    header={
                      <span>
                        <ScheduleOutlined /> {translate('Scheduling')}
                      </span>
                    } 
                    key="scheduling"
                  >
                    <Form.Item
                      name={['settings', 'scheduleType']}
                      label={translate('Execution Type')}
                    >
                      <Radio.Group onChange={handleScheduleTypeChange}>
                        <Space direction="vertical">
                          <Radio value="immediate">
                            <Space>
                              <ThunderboltOutlined />
                              <span>
                                <strong>{translate('Immediate')}</strong>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {translate('Execute as soon as conditions are met')}
                                </Text>
                              </span>
                            </Space>
                          </Radio>
                          <Radio value="delayed">
                            <Space>
                              <ClockCircleOutlined />
                              <span>
                                <strong>{translate('Delayed')}</strong>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {translate('Wait for a specified time before executing')}
                                </Text>
                              </span>
                            </Space>
                          </Radio>
                          <Radio value="scheduled">
                            <Space>
                              <ScheduleOutlined />
                              <span>
                                <strong>{translate('Scheduled')}</strong>
                                <br />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {translate('Execute at a specific date and time')}
                                </Text>
                              </span>
                            </Space>
                          </Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>
                    
                    {scheduleType === 'delayed' && (
                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item
                            name={['settings', 'delayTime']}
                            label={translate('Delay Time')}
                            rules={[{ required: true, message: translate('Required') }]}
                          >
                            <InputNumber 
                              min={1} 
                              style={{ width: '100%' }} 
                              placeholder="30" 
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name={['settings', 'delayUnit']}
                            label={translate('Unit')}
                            rules={[{ required: true, message: translate('Required') }]}
                          >
                            <Select>
                              <Option value="seconds">{translate('Seconds')}</Option>
                              <Option value="minutes">{translate('Minutes')}</Option>
                              <Option value="hours">{translate('Hours')}</Option>
                              <Option value="days">{translate('Days')}</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    {scheduleType === 'scheduled' && (
                      <>
                        <Form.Item
                          name={['settings', 'scheduleTime']}
                          label={translate('Schedule Date & Time')}
                          rules={[{ required: true, message: translate('Required') }]}
                        >
                          <DatePicker 
                            showTime 
                            format="YYYY-MM-DD HH:mm" 
                            placeholder={translate('Select date and time')} 
                            style={{ width: '100%' }}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                          />
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'scheduleRecurring']}
                          label={translate('Recurring Schedule')}
                          valuePropName="checked"
                        >
                          <Switch 
                            checkedChildren={translate('Yes')} 
                            unCheckedChildren={translate('No')}
                            onChange={handleRecurringToggle}
                          />
                        </Form.Item>

                        {form.getFieldValue(['settings', 'scheduleRecurring']) && (
                          <Form.Item
                            name={['settings', 'recurringFrequency']}
                            label={translate('Frequency')}
                            rules={[{ required: true, message: translate('Required') }]}
                          >
                            <Select>
                              <Option value="hourly">{translate('Every hour')}</Option>
                              <Option value="daily">{translate('Daily')}</Option>
                              <Option value="weekly">{translate('Weekly')}</Option>
                              <Option value="monthly">{translate('Monthly')}</Option>
                            </Select>
                          </Form.Item>
                        )}
                      </>
                    )}
                  </Panel>
                </Collapse>
              )}
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              {translate('Cancel')}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              disabled={!isFormValid()}
              icon={<CheckCircleOutlined />}
            >
              {trigger ? translate('Update Trigger') : translate('Create Trigger')}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default BehaviorTriggersModule;
