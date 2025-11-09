import { ErpLayout } from '@/layout';
import ErpPanel from '@/pages/ErpPanelModule';

export default function QuoteDataTableModule({ config }) {
  return (
    <ErpLayout>
      <ErpPanel config={config}></ErpPanel>
    </ErpLayout>
  );
}
