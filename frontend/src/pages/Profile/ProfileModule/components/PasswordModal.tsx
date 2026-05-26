import { useProfileContext } from '@/context/profileContext';
import useOnFetch from '@/hooks/useOnFetch';
import apolloClient from '@/graphql/client';
import { UPDATE_PROFILE_PASSWORD } from '@/graphql/operations/auth';
import { Form, Input, Modal } from '@/components/ui';

import useLanguage from '@/locale/useLanguage';

const PasswordModal = () => {
  const translate = useLanguage();

  const { state, profileContextAction } = useProfileContext();
  const { modal } = profileContextAction;
  const { passwordModal } = state;
  const modalTitle = translate('Update Password');

  const [passForm] = Form.useForm();

  const { onFetch } = useOnFetch();

  const handelSubmit = (fieldsValue) => {
    const updateFn = async () => {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE_PASSWORD,
        variables: { input: fieldsValue },
      });
      return data.updateProfilePassword;
    };
    const callback = updateFn();
    onFetch(callback);
    passForm.resetFields();
    modal.close();
  };
  return (
    <Modal
      title={modalTitle}
      open={passwordModal.isOpen}
      onCancel={modal.close}
      okText="Update"
      onOk={() => {
        passForm.submit();
      }}
    >
      <Form form={passForm} layout="vertical" onFinish={handelSubmit}>
        <Form.Item
          label={translate('New Password')}
          name="password"
          rules={[
            {
              required: true,
              min: 8,
            },
          ]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label={translate('Confirm Password')}
          name="passwordCheck"
          hasFeedback
          rules={[
            {
              required: true,
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('The two passwords that you entered do not match!')
                );
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PasswordModal;
