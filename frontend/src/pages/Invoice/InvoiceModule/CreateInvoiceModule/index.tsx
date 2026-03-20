import { ErpLayout } from '@/layout';
import CreateItem from '@/pages/ErpPanelModule/CreateItem';
import InvoiceForm from '../Forms/InvoiceForm';

export default function CreateInvoiceModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={InvoiceForm} />
    </ErpLayout>
  );
}
