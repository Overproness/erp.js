import React, { useEffect } from 'react';
import { Form, Input, Button, Switch, Space, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { erp } from '@/redux/erp/actions';

const UpdateTeamForm = ({ config, dataItem, isLoading }) => {
  const { TEAM_ENTITY, id } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (dataItem) {
      form.setFieldsValue({
        name: dataItem.name,
        description: dataItem.description,
        enabled: dataItem.enabled,
      });
    }
  }, [dataItem]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Space size="middle">
          <span>Loading...</span>
        </Space>
      </div>
    );
  }

  const onFinish = (values) => {
    dispatch(erp.update({ entity: TEAM_ENTITY, id, jsonData: values }));
    navigate(`/team/read/${id}`);
  };

  return (
    <>
      <PageHeader
        onBack={() => navigate(`/team/read/${id}`)}
        title="Update Team"
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
            Update Team
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default UpdateTeamForm;
