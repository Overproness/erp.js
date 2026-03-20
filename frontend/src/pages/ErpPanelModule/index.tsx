import { useLayoutEffect } from 'react';

import DataTable from '@/components/UnifiedDataTable';

import Delete from './DeleteItem';

import { erp } from '@/redux/erp/actions';
import { useDispatch } from 'react-redux';

import { useErpContext } from '@/context/erp';

export default function ErpPanel({ config, extra }) {
  const dispatch = useDispatch();
  const { state } = useErpContext();
  const { deleteModal } = state;

  const dispatcher = () => {
    dispatch(erp.resetState());
  };

  useLayoutEffect(() => {
    const controller = new AbortController();
    dispatcher();
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <DataTable config={config} extra={extra} mode="navigate" />
      <Delete config={config} isOpen={deleteModal.isOpen} />
    </>
  );
}
