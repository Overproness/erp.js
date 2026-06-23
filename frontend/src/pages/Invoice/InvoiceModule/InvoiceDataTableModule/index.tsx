import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import ErpPanel from '@/pages/ErpPanelModule';
import { CreditCardOutlined } from '@/components/icons';

export default function InvoiceDataTableModule({ config, extra }) {
  const translate = useLanguage();
  return (
    <ErpLayout>
      <ErpPanel
        config={{
          ...config,
          dropdownExtra: [
            {
              label: translate('Record Payment'),
              key: 'recordPayment',
              icon: <CreditCardOutlined />,
            },
          ],
        }}
        extra={extra}
      ></ErpPanel>
    </ErpLayout>
  );
}
