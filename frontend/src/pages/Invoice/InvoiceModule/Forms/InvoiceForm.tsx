import { Button, Checkbox, Col, Divider, Form, Input, InputNumber, Row, Select } from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import { PlusOutlined } from '@/components/icons';

import { DatePicker } from '@/components/ui';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import ItemRow from '@/pages/ErpPanelModule/ItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import useLanguage from '@/locale/useLanguage';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';

import TaxSelectionModal from '@/components/TaxSelectionModal';
import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';

export default function InvoiceForm({ subTotal = 0, current = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} />;
}

function LoadInvoiceForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);
  const [isTaxModalVisible, setIsTaxModalVisible] = useState(false);
  const [selectedTaxName, setSelectedTaxName] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const form = Form.useFormInstance();

  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };

  const handleTaxSelect = (tax) => {
    setTaxRate(tax.taxRate / 100);
    setSelectedTaxName(tax.name);
    form.setFieldsValue({ taxRate: tax.taxRate });
    setIsTaxModalVisible(false);
  };

  useEffect(() => {
    if (current) {
      const { taxRate = 0, year, number, isRecurring: recurringStatus } = current;
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
      setIsRecurring(recurringStatus || false);
    }
  }, [current]);
  useEffect(() => {
    const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
    setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  return (
    <>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="client"
            label={translate('Client')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoCompleteAsync
              entity={'client'}
              displayLabels={['name']}
              searchFields={'name'}
              redirectLabel={'Add New Client'}
              withRedirect
              urlToRedirect={'/client'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            initialValue={currentYear}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'draft'}
          >
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={6}>
          <Form.Item
            name="expiredDate"
            label={translate('Expire Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs().add(30, 'days')}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      {/* Recurring Billing Section */}
      <Divider orientation="left">{translate('Recurring Billing')}</Divider>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={6}>
          <Form.Item name="isRecurring" valuePropName="checked" initialValue={false}>
            <Checkbox onChange={(e) => setIsRecurring(e.target.checked)}>
              {translate('Enable Recurring Billing')}
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>

      {isRecurring && (
        <Row gutter={[12, 0]}>
          <Col className="gutter-row" span={6}>
            <Form.Item
              name={['recurringConfig', 'frequency']}
              label={translate('Frequency')}
              rules={[{ required: isRecurring, message: translate('Please select frequency') }]}
            >
              <Select
                placeholder={translate('Select frequency')}
                options={[
                  { value: 'daily', label: translate('Daily') },
                  { value: 'weekly', label: translate('Weekly') },
                  { value: 'biweekly', label: translate('Bi-weekly') },
                  { value: 'monthly', label: translate('Monthly') },
                  { value: 'quarterly', label: translate('Quarterly') },
                  { value: 'semiannually', label: translate('Semi-annually') },
                  { value: 'annually', label: translate('Annually') },
                ]}
              />
            </Form.Item>
          </Col>

          <Col className="gutter-row" span={6}>
            <Form.Item
              name={['recurringConfig', 'startDate']}
              label={translate('Start Date')}
              rules={[{ required: isRecurring, type: 'object' }]}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} format={dateFormat} />
            </Form.Item>
          </Col>

          <Col className="gutter-row" span={6}>
            <Form.Item
              name={['recurringConfig', 'endDate']}
              label={translate('End Date (Optional)')}
            >
              <DatePicker style={{ width: '100%' }} format={dateFormat} />
            </Form.Item>
          </Col>

          <Col className="gutter-row" span={6}>
            <Form.Item
              name={['recurringConfig', 'occurrences']}
              label={translate('Max Occurrences (Optional)')}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                placeholder={translate('Leave blank for unlimited')}
              />
            </Form.Item>
          </Col>

          <Col className="gutter-row" span={6}>
            <Form.Item
              name={['recurringConfig', 'autoSend']}
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox>{translate('Auto-send invoices')}</Checkbox>
            </Form.Item>
          </Col>
        </Row>
      )}

      <Divider dashed />
      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col className="gutter-row" span={5}>
          <p>
            {translate('Item')} <span style={{ color: 'red' }}>*</span>
          </p>
        </Col>
        <Col className="gutter-row" span={7}>
          <p>{translate('Description')}</p>
        </Col>
        <Col className="gutter-row" span={3}>
          <p>
            {translate('Quantity')} <span style={{ color: 'red' }}>*</span>
          </p>{' '}
        </Col>
        <Col className="gutter-row" span={4}>
          <p>
            {translate('Price')} <span style={{ color: 'red' }}>*</span>
          </p>
        </Col>
        <Col className="gutter-row" span={5}>
          <p>{translate('Total')}</p>
        </Col>
      </Row>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <ItemRow key={field.key} remove={remove} field={field} current={current}></ItemRow>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                ref={addField}
              >
                {translate('Add field')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Divider dashed />
      <div style={{ position: 'relative', width: ' 100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4} offset={10}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Sub Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={subTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <Form.Item
              name="taxRate"
              rules={[
                {
                  required: true,
                  message: translate('Please select a tax rate'),
                },
              ]}
            >
              <Button
                type="default"
                onClick={() => setIsTaxModalVisible(true)}
                block
                style={{ textAlign: 'left' }}
              >
                {selectedTaxName || translate('Select Tax Rate')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>

      <TaxSelectionModal
        visible={isTaxModalVisible}
        onSelect={handleTaxSelect}
        onCancel={() => setIsTaxModalVisible(false)}
        currentTaxRate={taxRate * 100}
      />
    </>
  );
}
