import React from 'react';
import { Form } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { erp } from '@/redux/erp/actions';
import { TEAM_ENTITY } from '../TeamDataTableModule/config';
import CreateItemForm from './components/CreateTeamForm';

const CreateTeamModule = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    dispatch(erp.create({ entity: TEAM_ENTITY, jsonData: values }));
    navigate('/team');
  };

  return (
    <CreateItemForm
      form={form}
      onFinish={onFinish}
      entity={TEAM_ENTITY}
    />
  );
};

export { CreateTeamModule };
