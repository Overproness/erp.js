import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { PageHeader } from '@ant-design/pro-layout';
import { Button, Divider, Form, Tag, message } from 'antd';

import { useDispatch, useSelector } from 'react-redux';

import useLanguage from '@/locale/useLanguage';

import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';
import { settingsAction } from '@/redux/settings/actions';

import calculate from '@/utils/calculate';
import { generate as uniqueId } from 'shortid';

import Loading from '@/components/Loading';
import { ArrowLeftOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';

function SaveForm({ form }) {
  const translate = useLanguage();
  const handelClick = () => {
    form.submit();
  };

  return (
    <Button onClick={handelClick} type="primary" icon={<PlusOutlined />}>
      {translate('Save')}
    </Button>
  );
}

export default function CreateItem({ config, CreateForm }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);
  let { entity } = config;

  const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);
  const [form] = Form.useForm();
  const [subTotal, setSubTotal] = useState(0);
  const [offerSubTotal, setOfferSubTotal] = useState(0);
  const handelValuesChange = (changedValues, values) => {
    const items = values['items'];
    let subTotal = 0;
    let subOfferTotal = 0;

    if (items) {
      items.map((item) => {
        if (item) {
          if (item.offerPrice && item.quantity) {
            let offerTotal = calculate.multiply(item['quantity'], item['offerPrice']);
            subOfferTotal = calculate.add(subOfferTotal, offerTotal);
          }
          if (item.quantity && item.price) {
            let total = calculate.multiply(item['quantity'], item['price']);
            //sub total
            subTotal = calculate.add(subTotal, total);
          }
        }
      });
      setSubTotal(subTotal);
      setOfferSubTotal(subOfferTotal);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      form.resetFields();
      dispatch(erp.resetAction({ actionType: 'create' }));
      setSubTotal(0);
      setOfferSubTotal(0);
      navigate(`/${entity.toLowerCase()}/read/${result._id}`);
    }
    return () => {};
  }, [isSuccess]);

  const onSubmit = (fieldsValue) => {
    if (fieldsValue) {
      let newData = { ...fieldsValue };
      let withUpload = false;

      try {
        // Handle file uploads for documents
        if (entity === 'document' && fieldsValue.file) {
          const formData = new FormData();

          // Add document metadata
          Object.keys(fieldsValue).forEach((key) => {
            if (key === 'file') {
              if (Array.isArray(fieldsValue.file) && fieldsValue.file[0].originFileObj) {
                const file = fieldsValue.file[0].originFileObj;
                // Check file size before upload
                const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
                if (file.size > MAX_FILE_SIZE) {
                  throw new Error(
                    `File size exceeds the maximum limit of 50MB. Your file is ${(
                      file.size /
                      (1024 * 1024)
                    ).toFixed(2)}MB.`
                  );
                }
                formData.append('file', file);
              }
            } else if (key === 'expiryDate' && fieldsValue[key]) {
              // Only add expiry date if it exists
              formData.append(key, dayjs(fieldsValue[key]).format('YYYY-MM-DDTHH:mm:ss.SSSZ'));
            } else if (key === 'tags' && Array.isArray(fieldsValue[key])) {
              // Properly handle tags array - filter out empty values
              formData.append(
                key,
                JSON.stringify(fieldsValue[key].filter((tag) => tag && tag.trim !== ''))
              );
            } else if (fieldsValue[key] !== undefined && fieldsValue[key] !== null) {
              // Only append defined fields
              formData.append(key, fieldsValue[key]);
            }
          });

          withUpload = true;
          newData = formData;
        } else {
          // Format dates
          if (fieldsValue.date) {
            newData.date = dayjs(fieldsValue.date).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
          }
          if (fieldsValue.expiredDate) {
            newData.expiredDate = dayjs(fieldsValue.expiredDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
          }

          // Format items
          if (fieldsValue.items) {
            newData.items = fieldsValue.items.map((item) => ({
              itemName: item.itemName,
              description: item.description || '',
              quantity: Number(item.quantity),
              price: Number(item.price),
              total: Number(item.quantity) * Number(item.price),
            }));
          }

          // Add currency if not present
          if (!newData.currency) {
            newData.currency = 'USD'; // Or get from settings
          }
        }

        dispatch(erp.create({ entity, jsonData: newData, withUpload }));
      } catch (error) {
        message.error(error.message || 'Error processing your request');
        console.error('Form submission error:', error);
      }
    }
  };

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        backIcon={<ArrowLeftOutlined />}
        title={translate('New')}
        ghost={false}
        tags={<Tag>{translate('Draft')}</Tag>}
        // subTitle="This is create page"
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Cancel')}
          </Button>,
          <SaveForm form={form} key={`${uniqueId()}`} />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Form form={form} layout="vertical" onFinish={onSubmit} onValuesChange={handelValuesChange}>
          <CreateForm subTotal={subTotal} offerTotal={offerSubTotal} />
        </Form>
      </Loading>
    </>
  );
}
