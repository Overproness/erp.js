import { useEffect } from 'react';

import { useCrudContext } from '@/context/crud';
import { crud } from '@/redux/crud/actions';
import { selectCreatedItem } from '@/redux/crud/selectors';
import { useDispatch, useSelector } from 'react-redux';

import useLanguage from '@/locale/useLanguage';

import Loading from '@/components/Loading';
import { Button, Form } from 'antd';

export default function CreateForm({ config, formElements, withUpload = false }) {
  let { entity } = config;
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector(selectCreatedItem);
  const { crudContextAction } = useCrudContext();
  const { panel, collapsedBox, readBox } = crudContextAction;
  const [form] = Form.useForm();
  const translate = useLanguage();

  const onSubmit = (fieldsValue) => {
    // Special handling for document files
    if (entity === 'document' && fieldsValue.file) {
      const formData = new FormData();

      // Process form data for file upload
      Object.keys(fieldsValue).forEach((key) => {
        if (key === 'file') {
          if (Array.isArray(fieldsValue.file) && fieldsValue.file[0].originFileObj) {
            formData.append('file', fieldsValue.file[0].originFileObj);
          } else if (fieldsValue.file.originFileObj) {
            formData.append('file', fieldsValue.file.originFileObj);
          }
        } else {
          formData.append(key, fieldsValue[key]);
        }
      });

      dispatch(crud.create({ entity, jsonData: formData, withUpload: true }));
    } else if (fieldsValue.file && withUpload) {
      // Regular file upload
      const formData = new FormData();

      Object.keys(fieldsValue).forEach((key) => {
        if (key === 'file') {
          if (Array.isArray(fieldsValue.file)) {
            formData.append('file', fieldsValue.file[0].originFileObj);
          } else {
            formData.append('file', fieldsValue.file.originFileObj);
          }
        } else {
          formData.append(key, fieldsValue[key]);
        }
      });

      dispatch(crud.create({ entity, jsonData: formData, withUpload }));
    } else {
      dispatch(crud.create({ entity, jsonData: fieldsValue, withUpload }));
    }
  };

  useEffect(() => {
    if (isSuccess) {
      readBox.open();
      collapsedBox.open();
      panel.open();
      form.resetFields();
      dispatch(crud.resetAction({ actionType: 'create' }));
      dispatch(crud.list({ entity }));
    }
  }, [isSuccess]);

  return (
    <Loading isLoading={isLoading}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {formElements}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate('Submit')}
          </Button>
        </Form.Item>
      </Form>
    </Loading>
  );
}
