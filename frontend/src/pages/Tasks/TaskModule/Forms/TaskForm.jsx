import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, message } from 'antd';
import useLanguage from '@/locale/useLanguage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

export default function TaskForm({ isUpdateForm = false }) {
  const translate = useLanguage();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = window.localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}admin/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.result) {
        setUsers(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

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

      <Form.Item label={translate('Description')} name="description">
        <Input.TextArea rows={4} />
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
        <Select
          placeholder={translate('Select assignee')}
          showSearch
          loading={loadingUsers}
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
          }
        >
          {users.map((user) => (
            <Select.Option key={user._id} value={user._id}>
              {user.name || user.email}
            </Select.Option>
          ))}
        </Select>
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
        <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
      </Form.Item>

      <Form.Item label={translate('Priority')} name="priority">
        <Select>
          <Select.Option value="low">{translate('Low')}</Select.Option>
          <Select.Option value="medium">{translate('Medium')}</Select.Option>
          <Select.Option value="high">{translate('High')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label={translate('Status')} name="status">
        <Select>
          <Select.Option value="pending">{translate('Pending')}</Select.Option>
          <Select.Option value="assigned">{translate('Assigned')}</Select.Option>
          <Select.Option value="in_progress">{translate('In Progress')}</Select.Option>
          <Select.Option value="completed">{translate('Completed')}</Select.Option>
          <Select.Option value="cancelled">{translate('Cancelled')}</Select.Option>
        </Select>
      </Form.Item>
    </>
  );
}
