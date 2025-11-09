import { useEffect, useState } from 'react';

import {
  CloseCircleOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  GlobalOutlined,
  CrownOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Button, Descriptions, Divider, Row, Statistic, Typography, Avatar, Card, Col, Tag } from 'antd';

import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { useDispatch, useSelector } from 'react-redux';

import { generate as uniqueId } from 'shortid';

import { selectCurrentItem } from '@/redux/erp/selectors';
import { useNavigate } from 'react-router-dom';
import { useMoney } from '@/settings';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ReadItem({ config, selectedItem }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { moneyFormatter } = useMoney();

  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetCustomer = {
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    customerType: 'individual',
    enabled: true,
    demographics: {},
    customerValue: {},
    behavior: {},
    interaction: {},
  };

  const [currentCustomer, setCurrentCustomer] = useState(selectedItem ?? resetCustomer);

  useEffect(() => {
    const controller = new AbortController();
    if (currentResult) {
      setCurrentCustomer(currentResult);
    }
    return () => controller.abort();
  }, [currentResult]);

  const getSegmentColor = (segment) => {
    const colorMap = {
      platinum: '#9370DB',
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
    };
    return colorMap[segment] || '#1890ff';
  };

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={`${ENTITY_NAME}: ${currentCustomer.name}`}
        ghost={false}
        tags={
          currentCustomer.enabled ? (
            <Tag color="green">{translate('Active')}</Tag>
          ) : (
            <Tag color="red">{translate('Inactive')}</Tag>
          )
        }
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              navigate(`/${entity.toLowerCase()}`);
            }}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>
        ]}
        style={{
          padding: '20px 0px',
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={translate('Customer Type')}
              value={translate(currentCustomer.customerType || 'Individual')}
            />
          </Col>
          {currentCustomer.customerValue?.segment && (
            <Col span={6}>
              <Statistic
                title={translate('Segment')}
                value={currentCustomer.customerValue.segment}
                valueStyle={{ color: getSegmentColor(currentCustomer.customerValue.segment) }}
              />
            </Col>
          )}
          {currentCustomer.customerValue?.lifetimeValue && (
            <Col span={6}>
              <Statistic
                title={translate('Lifetime Value')}
                value={moneyFormatter({
                  amount: currentCustomer.customerValue.lifetimeValue,
                  currency_code: 'USD',
                })}
                prefix={<DollarOutlined />}
              />
            </Col>
          )}
          {currentCustomer.behavior?.visitFrequency && (
            <Col span={6}>
              <Statistic
                title={translate('Monthly Visits')}
                value={currentCustomer.behavior.visitFrequency}
                prefix={<ShoppingOutlined />}
              />
            </Col>
          )}
        </Row>
      </PageHeader>

      <Divider dashed />

      <Row gutter={[24, 24]}>
        {/* Customer Profile Card */}
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: currentCustomer.customerValue?.segment
                    ? getSegmentColor(currentCustomer.customerValue.segment)
                    : '#1890ff',
                }}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                {currentCustomer.name}
              </Title>
              <div style={{ marginTop: 8 }}>
                {currentCustomer.customerType && (
                  <Tag color={currentCustomer.customerType === 'company' ? 'blue' : 'green'}>
                    {translate(currentCustomer.customerType === 'company' ? 'Company' : 'Individual')}
                  </Tag>
                )}
                {currentCustomer.customerValue?.segment && (
                  <Tag color={getSegmentColor(currentCustomer.customerValue.segment)}>
                    <CrownOutlined style={{ marginRight: 4 }} />
                    {currentCustomer.customerValue.segment.charAt(0).toUpperCase() +
                      currentCustomer.customerValue.segment.slice(1)}
                  </Tag>
                )}
              </div>
            </div>

            <Descriptions column={1} size="small">
              <Descriptions.Item
                label={
                  <>
                    <PhoneOutlined /> {translate('Phone')}
                  </>
                }
              >
                {currentCustomer.phone || translate('Not provided')}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined /> {translate('Email')}
                  </>
                }
              >
                {currentCustomer.email || translate('Not provided')}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <GlobalOutlined /> {translate('Company')}
                  </>
                }
              >
                {currentCustomer.company || translate('Not provided')}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Address')}>
                {currentCustomer.address || translate('Not provided')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Customer Details */}
        <Col xs={24} md={16}>
          <Card title={translate('Customer Information')}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={translate('Customer Since')}>
                {currentCustomer.customerValue?.customerSince
                  ? dayjs(currentCustomer.customerValue.customerSince).format('MMMM D, YYYY')
                  : dayjs(currentCustomer.created).format('MMMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Status')}>
                {currentCustomer.enabled ? (
                  <Tag color="green">{translate('Active')}</Tag>
                ) : (
                  <Tag color="red">{translate('Inactive')}</Tag>
                )}
              </Descriptions.Item>

              {/* Demographics */}
              {currentCustomer.demographics?.age && (
                <Descriptions.Item label={translate('Age')}>
                  {currentCustomer.demographics.age}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.gender && (
                <Descriptions.Item label={translate('Gender')}>
                  {translate(currentCustomer.demographics.gender)}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.location && (
                <Descriptions.Item label={translate('Location')}>
                  {currentCustomer.demographics.location}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.occupation && (
                <Descriptions.Item label={translate('Occupation')}>
                  {currentCustomer.demographics.occupation}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.income && (
                <Descriptions.Item label={translate('Annual Income')}>
                  {moneyFormatter({
                    amount: currentCustomer.demographics.income,
                    currency_code: 'USD',
                  })}
                </Descriptions.Item>
              )}

              {/* Customer Value */}
              {currentCustomer.customerValue?.lifetimeValue && (
                <Descriptions.Item label={translate('Lifetime Value')}>
                  {moneyFormatter({
                    amount: currentCustomer.customerValue.lifetimeValue,
                    currency_code: 'USD',
                  })}
                </Descriptions.Item>
              )}

              {/* Behavior */}
              {currentCustomer.behavior?.lastPurchaseDate && (
                <Descriptions.Item label={translate('Last Purchase')}>
                  {dayjs(currentCustomer.behavior.lastPurchaseDate).format('MMMM D, YYYY')}
                </Descriptions.Item>
              )}
              {currentCustomer.behavior?.purchaseFrequency && (
                <Descriptions.Item label={translate('Purchase Frequency')}>
                  {translate(currentCustomer.behavior.purchaseFrequency)}
                </Descriptions.Item>
              )}
              {currentCustomer.behavior?.preferredPaymentMethod && (
                <Descriptions.Item label={translate('Preferred Payment')}>
                  {translate(currentCustomer.behavior.preferredPaymentMethod)}
                </Descriptions.Item>
              )}
              {currentCustomer.behavior?.visitFrequency && (
                <Descriptions.Item label={translate('Visit Frequency')}>
                  {currentCustomer.behavior.visitFrequency} {translate('times per month')}
                </Descriptions.Item>
              )}

              {/* Latest Interaction */}
              {currentCustomer.interaction?.channel && (
                <Descriptions.Item label={translate('Last Contact Channel')}>
                  {translate(currentCustomer.interaction.channel)}
                </Descriptions.Item>
              )}
              {currentCustomer.interaction?.type && (
                <Descriptions.Item label={translate('Last Interaction Type')}>
                  {translate(currentCustomer.interaction.type)}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Preferred Products */}
            {currentCustomer.behavior?.preferredProducts && currentCustomer.behavior.preferredProducts.length > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={5}>{translate('Preferred Products')}:</Title>
                  <div style={{ marginTop: 8 }}>
                    {currentCustomer.behavior.preferredProducts.map((product, index) => (
                      <Tag key={index} style={{ margin: '2px' }}>
                        {product}
                      </Tag>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Interaction Notes */}
            {currentCustomer.interaction?.notes && (
              <>
                <Divider />
                <div>
                  <Title level={5}>{translate('Latest Notes')}:</Title>
                  <p style={{ marginTop: 8, color: '#666' }}>{currentCustomer.interaction.notes}</p>
                  {currentCustomer.interaction.outcome && (
                    <p style={{ marginTop: 8, fontWeight: 'bold' }}>
                      {translate('Outcome')}: {currentCustomer.interaction.outcome}
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
