import DataTable from '@/components/UnifiedDataTable';
import Delete from './DeleteItem';
import { useErpContext } from '@/context/erp';

export default function ErpPanel({ config, extra }) {
  const { state } = useErpContext();
  const { deleteModal } = state;

  return (
    <>
      <DataTable config={config} extra={extra} mode="navigate" />
      <Delete config={config} isOpen={deleteModal.isOpen} />
    </>
  );
}
