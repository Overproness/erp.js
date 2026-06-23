import Loading from '@/components/Loading';
import { CheckOutlined, CloseCircleOutlined, CloseOutlined, EditOutlined } from '@/components/icons';
import { Button, Descriptions, Divider, PageHeader, Switch } from '@/components/ui';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem, selectReadState } from '@/redux/erp/selectors';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const entity = 'taxes';
const routePath = '/taxes';

function ReadOnlySwitch({ checked }: { checked?: boolean }) {
  return (
    <Switch
      checked={Boolean(checked)}
      checkedChildren={<CheckOutlined />}
      unCheckedChildren={<CloseOutlined />}
      disabled
    />
  );
}

export default function TaxesRead() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const loadedRef = useRef('');

  const { result: currentItem } = useSelector(selectCurrentItem);
  const { isLoading } = useSelector(selectReadState);

  useEffect(() => {
    if (id && loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(erp.read({ entity, id }));
    }
  }, [id]);

  const item = currentItem || {};

  return (
    <>
      <PageHeader
        onBack={() => navigate(routePath)}
        title={item.name || translate('tax')}
        ghost={false}
        extra={[
          <Button key="close" onClick={() => navigate(routePath)} icon={<CloseCircleOutlined />}>
            {translate('Close')}
          </Button>,
          <Button
            key="edit"
            onClick={() => navigate(`${routePath}/update/${item._id || id}`)}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{ padding: '20px 0px' }}
      />
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Descriptions title={translate('tax')}>
          <Descriptions.Item label={translate('Name')}>{item.name || '-'}</Descriptions.Item>
          <Descriptions.Item label={translate('Tax Value')}>
            {item.taxValue ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Tax Rate')}>
            {item.taxRate != null ? `${item.taxRate}%` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Enabled')}>
            <ReadOnlySwitch checked={item.enabled} />
          </Descriptions.Item>
          <Descriptions.Item label={translate('Default')}>
            <ReadOnlySwitch checked={item.isDefault} />
          </Descriptions.Item>
        </Descriptions>
      </Loading>
    </>
  );
}
