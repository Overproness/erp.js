import { ErpLayout } from '@/layout';

import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectCurrentItem, selectItemById } from '@/redux/erp/selectors';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Payment from './components/Payment';

export default function RecordPaymentModule({ config }) {
  const dispatch = useDispatch();
  const { id } = useParams();

  let item = useSelector(selectItemById(id));
  const loadedRef = useRef('');

  useEffect(() => {
    if (item) {
      dispatch(erp.currentItem({ data: item }));
    } else if (loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(erp.read({ entity: config.entity, id }));
    }
  }, [item, id]);

  const { result: currentResult } = useSelector(selectCurrentItem);
  item = currentResult;

  useEffect(() => {
    dispatch(erp.currentAction({ actionType: 'recordPayment', data: item }));
  }, [item]);

  return (
    <ErpLayout>
      {item ? <Payment config={config} currentItem={currentResult} /> : <PageLoader />}
    </ErpLayout>
  );
}
