import { ErpLayout } from '@/layout';
import CreateItem from '@/pages/ErpPanelModule/CreateItem';
import CustomerForm from '@/forms/CustomerForm';

export default function CreateCustomerModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={CustomerForm} />
    </ErpLayout>
  );
}
