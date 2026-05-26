import { Button, Col, Form, Row } from '@/components/ui';
import { useProfileContext } from '@/context/profileContext';
import { CloseCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generate as uniqueId } from 'shortid';
import ProfileAdminForm from './ProfileAdminForm';

import { updateProfile } from '@/redux/auth/actions';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import useLanguage from '@/locale/useLanguage';

const UpdateAdmin = ({ config }) => {
  const translate = useLanguage();

  const { profileContextAction } = useProfileContext();
  const { updatePanel } = profileContextAction;
  const dispatch = useDispatch();
  const { ENTITY_NAME } = config;

  const currentAdmin = useSelector(selectCurrentAdmin);
  const [form] = Form.useForm();

  useEffect(() => {
    if (currentAdmin) {
      form.setFieldsValue({
        ...currentAdmin,
        name: currentAdmin.name ?? '',
        surname: currentAdmin.surname ?? '',
        email: currentAdmin.email ?? '',
      });
    }
  }, [currentAdmin]);

  const handleSubmit = () => {
    form.submit();
  };

  const onSubmit = (fieldsValue) => {
    if (fieldsValue.file) {
      fieldsValue.file = fieldsValue.file[0].originFileObj;
    }

    dispatch(updateProfile({ entity: 'admin/profile', jsonData: fieldsValue }));
  };

  return (
    <div>
      <PageHeader
        onBack={() => updatePanel.close()}
        title={ENTITY_NAME}
        ghost={false}
        extra={[
          <Button
            onClick={() => updatePanel.close()}
            key={`${uniqueId()}`}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              handleSubmit();
              updatePanel.close();
            }}
            type="primary"
            icon={<SaveOutlined />}
            htmlType="submit"
          >
            {translate('Save')}
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>
      <Row align="start">
        <Col xs={{ span: 24 }} sm={{ span: 6 }} md={{ span: 4 }}></Col>
        <Col xs={{ span: 16 }}>
          <Form
            form={form}
            onFinish={onSubmit}
            labelAlign="left"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 10 }}
          >
            <ProfileAdminForm isUpdateForm={true} />
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default UpdateAdmin;
