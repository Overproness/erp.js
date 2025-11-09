import { Form, Input, DatePicker, Select, Button } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function TaskForm({ isUpdateForm = false }) {
  const translate = useLanguage();
  return (
    <>
      <Form.Item
        label={translate('Title')}
        name="title"
        rules={[
          {
            required: true,
            message: translate('Please input task title!'),
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Description')}
        name="description"
      >
        <Input.TextArea />
      </Form.Item>

      <Form.Item
        label={translate('Assigned To')}
        name="assignedTo"
        rules={[
          {
            required: true,
            message: translate('Please select assignee!'),
          },
        ]}
      >
        <Select />
      </Form.Item>

      <Form.Item
        label={translate('Deadline')}
        name="deadline"
        rules={[
          {
            required: true,
            message: translate('Please select deadline!'),
          },
        ]}
      >
        <DatePicker showTime />
      </Form.Item>

      <Form.Item
        label={translate('Priority')}
        name="priority"
      >
        <Select>
          <Select.Option value="low">{translate('Low')}</Select.Option>
          <Select.Option value="medium">{translate('Medium')}</Select.Option>
          <Select.Option value="high">{translate('High')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label={translate('Status')}
        name="status"
      >
        <Select>
          <Select.Option value="pending">{translate('Pending')}</Select.Option>
          <Select.Option value="in_progress">{translate('In Progress')}</Select.Option>
          <Select.Option value="completed">{translate('Completed')}</Select.Option>
          <Select.Option value="cancelled">{translate('Cancelled')}</Select.Option>
        </Select>
      </Form.Item>
    </>
  );
}