import { ErpLayout } from '@/layout';
import CreateItem from '@/pages/ErpPanelModule/CreateItem';
import QuoteForm from '../Forms/QuoteForm';

export default function CreateQuoteModule({ config }) {
  return (
    <ErpLayout>
      <CreateItem config={config} CreateForm={QuoteForm} />
    </ErpLayout>
  );
}
