import useLanguage from '@/locale/useLanguage';
import ReadCustomerModule from './CustomerModule/ReadCustomerModule';

export default function CustomerRead() {
  const translate = useLanguage();

  const entity = 'client';

  const Labels = {
    PANEL_TITLE: translate('customer'),
    DATATABLE_TITLE: translate('customer_list'),
    ADD_NEW_ENTITY: translate('add_new_customer'),
    ENTITY_NAME: translate('customer'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  return <ReadCustomerModule config={configPage} />;
}
