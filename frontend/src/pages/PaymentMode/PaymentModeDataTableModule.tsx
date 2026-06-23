import { ErpLayout } from '@/layout';
import ErpPanel from '@/pages/ErpPanelModule';

export default function PaymentModeDataTableModule({ config, extra }) {
  return (
    <ErpLayout>
      <ErpPanel config={config} extra={extra}></ErpPanel>
    </ErpLayout>
  );
}
