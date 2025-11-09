import { Button, Form } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectRecordPaymentItem } from '@/redux/erp/selectors';
import { useDispatch, useSelector } from 'react-redux';

import Loading from '@/components/Loading';

import PaymentForm from '@/forms/PaymentForm';
import calculate from '@/utils/calculate';
import { useNavigate } from 'react-router-dom';

export default function RecordPayment({ config }) {
  const navigate = useNavigate();
  const translate = useLanguage();
  let { entity } = config;

  const dispatch = useDispatch();

  const { isLoading, isSuccess, current: currentInvoice } = useSelector(selectRecordPaymentItem);

  const [form] = Form.useForm();

  const [maxAmount, setMaxAmount] = useState(0);
  useEffect(() => {
    if (currentInvoice) {
      const { credit, total, discount } = currentInvoice;
      setMaxAmount(calculate.sub(calculate.sub(total, discount), credit));
    }
  }, [currentInvoice]);
  useEffect(() => {
    if (isSuccess) {
      form.resetFields();
      dispatch(erp.resetAction({ actionType: 'recordPayment' }));
      dispatch(erp.list({ entity }));
      navigate(`/${entity}/`);
    }
  }, [isSuccess]);

  const onSubmit = (fieldsValue) => {
    if (currentInvoice) {
      const { _id: invoice } = currentInvoice;
      // Add null/undefined check for client
      const client =
        currentInvoice.client && currentInvoice.client._id ? currentInvoice.client._id : null;

      // Format date
      if (fieldsValue.date) {
        fieldsValue.date = dayjs(fieldsValue.date).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      }

      // Ensure amount is a number
      if (fieldsValue.amount) {
        fieldsValue.amount = Number(fieldsValue.amount);
      }      // Add required fields
      fieldsValue = {
        ...fieldsValue,
        invoice,
        client,
        // Ensure we have a valid currency
        currency: currentInvoice.currency || (currentInvoice.currencyCode ? 
                                            { code: currentInvoice.currencyCode, symbol: currentInvoice.currencySymbol } : 
                                            { code: 'EUR', symbol: '€' }),
      };
    }

    dispatch(
      erp.recordPayment({
        entity: 'payment',
        jsonData: fieldsValue,
      })
    );
  };

  return (
    <Loading isLoading={isLoading}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <PaymentForm maxAmount={maxAmount} />
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate('Record Payment')}
          </Button>
        </Form.Item>
      </Form>
    </Loading>
  );
}
