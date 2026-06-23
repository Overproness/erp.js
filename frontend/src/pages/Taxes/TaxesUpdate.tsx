import Loading from '@/components/Loading';
import { CloseCircleOutlined, PlusOutlined } from '@/components/icons';
import { Button, Divider, Form, PageHeader } from '@/components/ui';
import TaxForm from '@/forms/TaxForm';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem, selectReadState, selectUpdatedItem } from '@/redux/erp/selectors';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const entity = 'taxes';
const routePath = '/taxes';

export default function TaxesUpdate() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const loadedRef = useRef('');

  const { result: currentItem } = useSelector(selectCurrentItem);
  const { isLoading: isReading } = useSelector(selectReadState);
  const { isLoading: isUpdating, isSuccess } = useSelector(selectUpdatedItem);

  useEffect(() => {
    dispatch(erp.resetAction({ actionType: 'update' }));
  }, []);

  useEffect(() => {
    if (id && loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(erp.read({ entity, id }));
    }
  }, [id]);

  useEffect(() => {
    if (currentItem) {
      form.resetFields();
      form.setFieldsValue(currentItem);
    }
  }, [currentItem]);

  useEffect(() => {
    if (isSuccess && id) {
      form.resetFields();
      dispatch(erp.resetAction({ actionType: 'update' }));
      navigate(`${routePath}/read/${id}`);
    }
  }, [isSuccess, id]);

  const onSubmit = (fieldsValue: Record<string, unknown>) => {
    if (!id) return;
    dispatch(erp.update({ entity, id, jsonData: fieldsValue }));
  };

  return (
    <>
      <PageHeader
        onBack={() => navigate(routePath)}
        title={translate('update')}
        ghost={false}
        extra={[
          <Button key="cancel" onClick={() => navigate(routePath)} icon={<CloseCircleOutlined />}>
            {translate('Cancel')}
          </Button>,
          <Button key="save" onClick={() => form.submit()} type="primary" icon={<PlusOutlined />}>
            {translate('update')}
          </Button>,
        ]}
        style={{ padding: '20px 0px' }}
      />
      <Divider dashed />
      <Loading isLoading={isReading || isUpdating}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <TaxForm isUpdateForm={true} />
        </Form>
      </Loading>
    </>
  );
}
