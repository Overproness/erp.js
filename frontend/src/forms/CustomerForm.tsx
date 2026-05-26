import { Form, Input, Select, DatePicker, InputNumber, Divider, Row, Col } from '@/components/ui';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;
const { TextArea } = Input;

export default function CustomerForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  const validateEmptyString = (_, value) => {
    if (value && value.trim() === '') {
      return Promise.reject(new Error('Field cannot be empty'));
    }
    return Promise.resolve();
  };

  return (
    <>
      {/* Basic Information */}
      <Divider orientation="left">{translate('Basic Information')}</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label={translate('Name')}
            rules={[
              { required: true, message: 'Name is required' },
              { validator: validateEmptyString },
            ]}
          >
            <Input placeholder={translate('Enter customer name')} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customerType"
            label={translate('Customer Type')}
            initialValue="individual"
          >
            <Select>
              <Option value="individual">{translate('Individual')}</Option>
              <Option value="company">{translate('Company')}</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="email"
            label={translate('Email')}
            rules={[
              { type: 'email', message: 'Please enter a valid email' },
              { required: true, message: 'Email is required' },
            ]}
          >
            <Input placeholder={translate('Enter email address')} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="phone"
            label={translate('Phone')}
            rules={[{ required: true, message: 'Phone is required' }]}
          >
            <Input placeholder={translate('Enter phone number')} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="company"
        label={translate('Company')}
      >
        <Input placeholder={translate('Enter company name')} />
      </Form.Item>

      <Form.Item
        name="address"
        label={translate('Address')}
      >
        <TextArea rows={2} placeholder={translate('Enter address')} />
      </Form.Item>

      {/* Demographics Section */}
      <Divider orientation="left">{translate('Demographics')}</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['demographics', 'age']} label={translate('Age')}>
            <InputNumber min={0} max={150} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['demographics', 'gender']} label={translate('Gender')}>
            <Select placeholder={translate('Select gender')}>
              <Option value="male">{translate('Male')}</Option>
              <Option value="female">{translate('Female')}</Option>
              <Option value="other">{translate('Other')}</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['demographics', 'location']} label={translate('Location')}>
            <Input placeholder={translate('Enter location')} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['demographics', 'occupation']} label={translate('Occupation')}>
            <Input placeholder={translate('Enter occupation')} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['demographics', 'income']} label={translate('Annual Income')}>
            <InputNumber
              min={0}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Customer Value Section */}
      <Divider orientation="left">{translate('Customer Value')}</Divider>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['customerValue', 'segment']} label={translate('Segment')}>
            <Select placeholder={translate('Select segment')}>
              <Option value="platinum">{translate('Platinum')}</Option>
              <Option value="gold">{translate('Gold')}</Option>
              <Option value="silver">{translate('Silver')}</Option>
              <Option value="bronze">{translate('Bronze')}</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['customerValue', 'customerSince']} label={translate('Customer Since')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['customerValue', 'lifetimeValue']} label={translate('Lifetime Value')}>
            <InputNumber
              min={0}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Behavior Section */}
      <Divider orientation="left">{translate('Behavior')}</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['behavior', 'lastPurchaseDate']} label={translate('Last Purchase Date')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['behavior', 'purchaseFrequency']} label={translate('Purchase Frequency')}>
            <Select placeholder={translate('Select frequency')}>
              <Option value="high">{translate('High')}</Option>
              <Option value="medium">{translate('Medium')}</Option>
              <Option value="low">{translate('Low')}</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name={['behavior', 'preferredProducts']} label={translate('Preferred Products')}>
        <Select
          mode="tags"
          placeholder={translate('Enter preferred products')}
          tokenSeparators={[',']}
          style={{ width: '100%' }}
          notFoundContent={null}
        />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={['behavior', 'preferredPaymentMethod']}
            label={translate('Preferred Payment Method')}
          >
            <Select placeholder={translate('Select payment method')}>
              <Option value="credit_card">{translate('Credit Card')}</Option>
              <Option value="debit_card">{translate('Debit Card')}</Option>
              <Option value="bank_transfer">{translate('Bank Transfer')}</Option>
              <Option value="cash">{translate('Cash')}</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['behavior', 'visitFrequency']}
            label={translate('Visit Frequency (per month)')}
          >
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      {/* Latest Interaction */}
      <Divider orientation="left">{translate('Latest Interaction')}</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['interaction', 'channel']} label={translate('Channel')}>
            <Select placeholder={translate('Select channel')}>
              <Option value="email">{translate('Email')}</Option>
              <Option value="phone">{translate('Phone')}</Option>
              <Option value="in_person">{translate('In Person')}</Option>
              <Option value="web">{translate('Web')}</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['interaction', 'type']} label={translate('Interaction Type')}>
            <Select placeholder={translate('Select interaction type')}>
              <Option value="inquiry">{translate('Inquiry')}</Option>
              <Option value="complaint">{translate('Complaint')}</Option>
              <Option value="purchase">{translate('Purchase')}</Option>
              <Option value="support">{translate('Support')}</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name={['interaction', 'notes']} label={translate('Notes')}>
        <TextArea rows={3} placeholder={translate('Enter interaction notes')} />
      </Form.Item>

      <Form.Item name={['interaction', 'outcome']} label={translate('Outcome')}>
        <Input placeholder={translate('Enter interaction outcome')} />
      </Form.Item>
    </>
  );
}
