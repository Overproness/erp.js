import { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { useErpContext } from '@/context/erp';
import { selectDeletedItem } from '@/redux/erp/selectors';
import { valueByString } from '@/utils/helpers';
import useLanguage from '@/locale/useLanguage';

export default function Delete({ config }) {
  const translate = useLanguage();
  let {
    entity,
    deleteModalLabels,
    deleteMessage = 'Do you want delete : ',
    modalTitle = 'Remove Item',
  } = config;

  const dispatch = useDispatch();
  const { current, isLoading, isSuccess } = useSelector(selectDeletedItem);
  const { state, erpContextAction } = useErpContext();
  const { deleteModal } = state;
  const { modal } = erpContextAction;
  const [displayItem, setDisplayItem] = useState('');

  useEffect(() => {
    if (isSuccess) {
      modal.close();
      message.success(translate('Item deleted successfully'));
      // Add small delay before refreshing list to ensure modal closes smoothly
      setTimeout(() => {
        dispatch(erp.list({ entity }));
        dispatch(erp.resetAction({ actionType: 'delete' }));
      }, 100);
    }
    if (current) {
      let labels = deleteModalLabels.map((x) => valueByString(current, x)).join(' ');
      setDisplayItem(labels);
    }
  }, [isSuccess, current]);

  const handleOk = async () => {
    const id = current._id;
    try {
      await dispatch(erp.delete({ entity, id }));
    } catch (error) {
      message.error(translate('Error deleting item'));
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      modal.close();
      dispatch(erp.resetAction({ actionType: 'delete' }));
    }
  };

  return (
    <Modal
      title={modalTitle}
      open={deleteModal.isOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      okText={translate('Delete')}
      cancelText={translate('Cancel')}
    >
      <p>
        {deleteMessage}
        {displayItem}
      </p>
    </Modal>
  );
}
