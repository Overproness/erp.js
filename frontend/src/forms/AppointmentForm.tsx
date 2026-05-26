import SelectAsync from '@/components/SelectAsync';
import apolloClient from '@/graphql/client';
import { CREATE_APPOINTMENT, UPDATE_APPOINTMENT } from '@/graphql/operations/appointment';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Switch,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function AppointmentForm({ current = null, onSuccess }) {
  const [form] = Form.useForm();
  const [locationType, setLocationType] = useState('virtual');
  const [generateBookingUrl, setGenerateBookingUrl] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (current) {
      const formData = {
        ...current,
        timeRange:
          current.startTime && current.endTime
            ? [dayjs(current.startTime), dayjs(current.endTime)]
            : null,
        location: current.location,
      };

      form.setFieldsValue(formData);
      setLocationType(current.location?.type || 'virtual');
      setGenerateBookingUrl(!!current.bookingUrl?.shortCode);
    }
  }, [current, form]);

  const handleLocationTypeChange = (value) => {
    setLocationType(value);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Transform timeRange to startTime and endTime
      const [startTime, endTime] = values.timeRange || [];
      const formData = {
        ...values,
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        generateBookingUrl,
      };
      delete formData.timeRange;

      let response;
      if (current) {
        const { data } = await apolloClient.mutate({
          mutation: UPDATE_APPOINTMENT,
          variables: { id: current._id, input: formData },
        });
        response = data.appointmentUpdate;
      } else {
        const { data } = await apolloClient.mutate({
          mutation: CREATE_APPOINTMENT,
          variables: { input: formData },
        });
        response = data.appointmentCreate;
      }

      if (response.success) {
        message.success(
          current ? 'Appointment updated successfully' : 'Appointment created successfully'
        );
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      message.error(error.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        type: 'meeting',
        status: 'scheduled',
        duration: 60,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: {
          type: 'virtual',
        },
        automationSettings: {
          sendConfirmation: true,
          sendReminders: true,
          sendFollowup: false,
          autoCompleteOnEndTime: false,
          triggerWorkflow: false,
        },
        attendees: [],
      }}
    >
      <Row gutter={16}>
        {/* Basic Information */}
        <Col span={24}>
          <h3>
            <ClockCircleOutlined /> Basic Information
          </h3>
        </Col>

        <Col span={16}>
          <Form.Item
            label="Appointment Title"
            name="title"
            rules={[{ required: true, message: 'Please enter appointment title' }]}
          >
            <Input placeholder="e.g., Client Meeting, Product Demo" />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Type" name="type" rules={[{ required: true }]}>
            <Select>
              <Option value="consultation">Consultation</Option>
              <Option value="meeting">Meeting</Option>
              <Option value="demo">Demo</Option>
              <Option value="support">Support</Option>
              <Option value="training">Training</Option>
              <Option value="interview">Interview</Option>
              <Option value="followup">Follow-up</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Meeting agenda, discussion points, etc." />
          </Form.Item>
        </Col>

        {/* Date and Time */}
        <Col span={24}>
          <Divider />
          <h3>
            <ClockCircleOutlined /> Schedule
          </h3>
        </Col>

        <Col span={16}>
          <Form.Item
            label="Date & Time"
            name="timeRange"
            rules={[{ required: true, message: 'Please select date and time' }]}
          >
            <RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Duration (minutes)" name="duration" rules={[{ required: true }]}>
            <InputNumber min={15} max={480} step={15} style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Timezone" name="timezone">
            <Input placeholder="UTC" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Status" name="status">
            <Select>
              <Option value="scheduled">Scheduled</Option>
              <Option value="confirmed">Confirmed</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="no-show">No Show</Option>
              <Option value="rescheduled">Rescheduled</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Location */}
        <Col span={24}>
          <Divider />
          <h3>
            <EnvironmentOutlined /> Location
          </h3>
        </Col>

        <Col span={8}>
          <Form.Item label="Location Type" name={['location', 'type']} rules={[{ required: true }]}>
            <Select onChange={handleLocationTypeChange}>
              <Option value="virtual">Virtual (Online)</Option>
              <Option value="physical">Physical Location</Option>
              <Option value="phone">Phone Call</Option>
              <Option value="hybrid">Hybrid</Option>
            </Select>
          </Form.Item>
        </Col>

        {locationType === 'virtual' && (
          <Col span={16}>
            <Form.Item label="Meeting URL" name={['location', 'meetingUrl']}>
              <Input placeholder="https://zoom.us/j/..." prefix={<LinkOutlined />} />
            </Form.Item>
          </Col>
        )}

        {locationType === 'physical' && (
          <Col span={16}>
            <Form.Item label="Address" name={['location', 'address']}>
              <Input placeholder="123 Main Street, City, State, ZIP" />
            </Form.Item>
          </Col>
        )}

        {locationType === 'phone' && (
          <Col span={16}>
            <Form.Item label="Phone Number" name={['location', 'phone']}>
              <Input placeholder="+1 (555) 123-4567" />
            </Form.Item>
          </Col>
        )}

        <Col span={24}>
          <Form.Item label="Location Instructions" name={['location', 'instructions']}>
            <TextArea rows={2} placeholder="Additional directions or instructions" />
          </Form.Item>
        </Col>

        {/* Attendees */}
        <Col span={24}>
          <Divider />
          <h3>
            <UserOutlined /> Attendees
          </h3>
        </Col>

        <Col span={24}>
          <Form.List name="attendees">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={8} key={key} align="middle">
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'Name required' }]}
                      >
                        <Input placeholder="Name" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'email']}
                        rules={[
                          { required: true, message: 'Email required' },
                          { type: 'email', message: 'Invalid email' },
                        ]}
                      >
                        <Input placeholder="Email" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item {...restField} name={[name, 'phone']}>
                        <Input placeholder="Phone (optional)" />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: 'red', cursor: 'pointer' }}
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Attendee
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Col>

        {/* Related Records */}
        <Col span={24}>
          <Divider />
          <h3>Related Records</h3>
        </Col>

        <Col span={12}>
          <Form.Item label="Related Client" name="relatedClient">
            <SelectAsync
              entity="client"
              displayLabels={['name', 'company']}
              placeholder="Select a client"
              allowClear
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Related Lead" name="relatedLead">
            <SelectAsync
              entity="client"
              displayLabels={['name', 'email']}
              placeholder="Select a client/lead"
              allowClear
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Related Task" name="relatedTask">
            <SelectAsync
              entity="task"
              displayLabels={['title']}
              placeholder="Select a task"
              allowClear
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Business Process" name="businessProcess">
            <SelectAsync
              entity="business-processes"
              displayLabels={['name']}
              placeholder="Select a business process"
              allowClear
            />
          </Form.Item>
        </Col>

        {/* Booking URL */}
        <Col span={24}>
          <Divider />
          <h3>
            <LinkOutlined /> Booking URL
          </h3>
        </Col>

        <Col span={24}>
          <Form.Item label="Generate Public Booking URL" valuePropName="checked">
            <Switch checked={generateBookingUrl} onChange={setGenerateBookingUrl} />
            <span style={{ marginLeft: 8, color: '#666' }}>
              Allow attendees to book via a shareable link
            </span>
          </Form.Item>
        </Col>

        {generateBookingUrl && (
          <>
            <Col span={12}>
              <Form.Item label="URL Expiration" name={['bookingUrl', 'expiresAt']}>
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Leave blank for no expiration"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Allow Reschedule"
                name={['bookingUrl', 'allowReschedule']}
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Allow Cancel"
                name={['bookingUrl', 'allowCancel']}
                valuePropName="checked"
              >
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Automation Settings */}
        <Col span={24}>
          <Divider />
          <h3>Automation Settings</h3>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Send Confirmation"
            name={['automationSettings', 'sendConfirmation']}
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Send Reminders"
            name={['automationSettings', 'sendReminders']}
            valuePropName="checked"
          >
            <Switch defaultChecked />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Send Follow-up"
            name={['automationSettings', 'sendFollowup']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Trigger Workflow"
            name={['automationSettings', 'triggerWorkflow']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        {/* Notes */}
        <Col span={24}>
          <Divider />
        </Col>

        <Col span={12}>
          <Form.Item label="Public Notes" name="notes">
            <TextArea rows={3} placeholder="Visible to attendees" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Private Notes" name="privateNotes">
            <TextArea rows={3} placeholder="Only visible to organizer" />
          </Form.Item>
        </Col>

        {/* Tags */}
        <Col span={24}>
          <Form.Item label="Tags" name="tags">
            <Select mode="tags" placeholder="Add tags (press enter)" style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        {/* Submit Button */}
        <Col span={24}>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              block
            >
              {current ? 'Update Appointment' : 'Create Appointment'}
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
