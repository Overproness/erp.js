import { Form, Input, DatePicker, Select, InputNumber, Upload, Progress, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import SelectAsync from '@/components/SelectAsync';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';
import { useEffect } from 'react';

const { TextArea } = Input;

export default function TaskForm({ isUpdateForm = false, current = null, form }) {
  const translate = useLanguage();

  useEffect(() => {
    if (isUpdateForm && current) {
      const formData = {
        ...current,
        // Convert date strings to dayjs objects
        deadline: current.deadline ? dayjs(current.deadline) : null,
        startDate: current.startDate ? dayjs(current.startDate) : null,
        completedDate: current.completedDate ? dayjs(current.completedDate) : null,
        assignedTo: current.assignedTo?._id || current.assignedTo,
        watchers: current.watchers?.map(w => w._id || w),
        tags: current.tags || [],
        attachments: current.attachments || []
      };
      form.setFieldsValue(formData);
    }
  }, [current, isUpdateForm, form]);

  return (
    <>
      <Form.Item
        label={translate('Title')}
        name="title"
        rules={[{ required: true, message: translate('Please input title!') }]}
      >
        <Input />
      </Form.Item>

      <Form.Item 
        label={translate('Description')} 
        name="description"
      >
        <TextArea rows={4} />
      </Form.Item>

      {/* Basic Task Information */}
      <Form.Item
        label={translate('Assigned To')}
        name="assignedTo"
        rules={[{ required: true, message: translate('Please select assignee!') }]}
      >
        <SelectAsync 
          entity="companyOwner"
          displayLabels={['name']}
          outputValue="_id"
          searchFields="name"
        />
      </Form.Item>

      {/* Progress Monitoring */}
      <Form.Item
        label={translate('Progress')}
        name="progress"
        initialValue={0}
      >
        <InputNumber 
          min={0} 
          max={100}
          formatter={value => `${value}%`}
          parser={value => value.replace('%', '')}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        label={translate('Time Spent (minutes)')}
        name="timeSpent"
        initialValue={0}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label={translate('Start Date')}
        name="startDate"
        getValueProps={(value) => ({
          value: value ? dayjs(value) : null
        })}
      >
        <DatePicker 
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        label={translate('Completion Date')}
        name="completedDate"
        getValueProps={(value) => ({
          value: value ? dayjs(value) : null
        })}
      >
        <DatePicker 
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: '100%' }}
        />
      </Form.Item>

      {/* Team Collaboration */}
      <Form.Item
        label={translate('Watchers')}
        name="watchers"
      >
        <SelectAsync 
          entity="companyOwner"
          displayLabels={['name']}
          outputValue="_id"
          searchFields="name"
          mode="multiple"
        />
      </Form.Item>

      {/* Module Integration */}
      <Form.Item
        label={translate('Tags')}
        name="tags"
      >
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder={translate('Add tags')}
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item
        label={translate('Attachments')}
        name="attachments"
        valuePropName="fileList"
        getValueFromEvent={(e) => e.fileList}
      >
        <Upload
          beforeUpload={() => false}
          listType="text"
        >
          <Button icon={<UploadOutlined />}>{translate('Upload File')}</Button>
        </Upload>
      </Form.Item>

      {/* Task Status and Priority */}
      <Form.Item
        label={translate('Priority')}
        name="priority"
        initialValue="medium"
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
        initialValue="pending"
      >
        <Select>
          <Select.Option value="pending">{translate('Pending')}</Select.Option>
          <Select.Option value="in_progress">{translate('In Progress')}</Select.Option>
          <Select.Option value="completed">{translate('Completed')}</Select.Option>
          <Select.Option value="cancelled">{translate('Cancelled')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label={translate('Deadline')}
        name="deadline"
        rules={[{ required: true, message: translate('Please select deadline!') }]}
        getValueProps={(value) => ({
          value: value ? dayjs(value) : null
        })}
      >
        <DatePicker 
          showTime
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: '100%' }}
        />
      </Form.Item>
    </>
  );
}