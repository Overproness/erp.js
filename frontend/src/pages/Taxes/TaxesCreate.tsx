import Loading from '@/components/Loading';
import { ArrowLeftOutlined, CloseCircleOutlined, PlusOutlined } from '@/components/icons';
import { Button, Divider, Form, PageHeader, Tag } from '@/components/ui';
import TaxForm from '@/forms/TaxForm';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const entity = 'taxes';
const routePath = '/taxes';

export default function TaxesCreate() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);

  useEffect(() => {
    dispatch(erp.resetAction({ actionType: 'create' }));
  }, []);

  useEffect(() => {
    if (isSuccess && result?._id) {
      form.resetFields();
      dispatch(erp.resetAction({ actionType: 'create' }));
      navigate(`${routePath}/read/${result._id}`);
    }
  }, [isSuccess, result?._id]);

  const onSubmit = (fieldsValue: Record<string, unknown>) => {
    dispatch(erp.create({ entity, jsonData: fieldsValue }));
  };

  return (
    <>
      <PageHeader
        onBack={() => navigate(routePath)}
        backIcon={<ArrowLeftOutlined />}
        title={translate('add_new_tax')}
        ghost={false}
        tags={<Tag>{translate('Draft')}</Tag>}
        extra={[
          <Button key="cancel" onClick={() => navigate(routePath)} icon={<CloseCircleOutlined />}>
            {translate('Cancel')}
          </Button>,
          <Button key="save" onClick={() => form.submit()} type="primary" icon={<PlusOutlined />}>
            {translate('Save')}
          </Button>,
        ]}
        style={{ padding: '20px 0px' }}
      />
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <TaxForm />
        </Form>
      </Loading>
    </>
  );
}
