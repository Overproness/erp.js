import { API_BASE_URL } from '@/config/serverApiConfig';
import useLanguage from '@/locale/useLanguage';
import { DatePicker, Form, Input, message, Select } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function TaskForm({ isUpdateForm = false }) {
  const translate = useLanguage();
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Function to fetch teams from API
  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const token = window.localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}team/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.result) {
        setTeams(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      message.error('Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  // Function to handle team selection and fetch members
  const handleTeamChange = async (teamId) => {
    setSelectedTeam(teamId);
    setTeamMembers([]);

    if (!teamId) {
      return;
    }

    setLoadingMembers(true);
    try {
      const token = window.localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}team/${teamId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.result) {
        setTeamMembers(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      message.error('Failed to load team members');
    } finally {
      setLoadingMembers(false);
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
        label={translate('Assigned Team')}
        name="assignedTeam"
        rules={[
          {
            required: true,
            message: translate('Please select a team first!'),
          },
        ]}
      >
        <Select
          placeholder={translate('Select team')}
          showSearch
          loading={loadingTeams}
          optionFilterProp="children"
          onChange={handleTeamChange}
          filterOption={(input, option) =>
            (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
          }
        >
          {teams.map((team) => (
            <Select.Option key={team._id} value={team._id}>
              {team.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={translate('Assigned To')}
        name="assignedTo"
        rules={[
          {
            required: false,
            message: translate('Please select assignee!'),
          },
        ]}
      >
        <Select
          placeholder={
            selectedTeam
              ? translate('Select team member (optional)')
              : translate('Please select a team first')
          }
          showSearch
          loading={loadingMembers}
          disabled={!selectedTeam}
          allowClear
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
          }
        >
          {teamMembers.map((member) => (
            <Select.Option key={member.user._id} value={member.user._id}>
              {member.user.name || member.user.email} ({member.role})
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
