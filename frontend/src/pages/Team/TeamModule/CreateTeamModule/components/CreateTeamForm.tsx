import React from 'react';
import { Form, Input, Button, Switch, Divider } from '@/components/ui';
import { PageHeader } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

const CreateTeamForm = ({ form, onFinish }) => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        onBack={() => navigate('/team')}
        title="Create New Team"
        ghost={false}
        style={{
          padding: '20px 0px',
        }}
      />
      <Divider />
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          enabled: true
        }}
      >
        <Form.Item
          label="Team Name"
          name="name"
          rules={[
            {
              required: true,
              message: 'Please enter team name!',
            },
          ]}
        >
          <Input placeholder="Enter team name" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea rows={4} placeholder="Enter team description" />
        </Form.Item>

        <Form.Item
          label="Active"
          name="enabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create Team
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CreateTeamForm;
