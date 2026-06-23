import useLanguage from '@/locale/useLanguage';
import { crud } from '@/redux/crud/actions';
import { selectListItems } from '@/redux/crud/selectors';
import { CheckOutlined, CloseOutlined, PercentageOutlined, PlusOutlined } from '@/components/icons';
import { Button, message, Modal, Spin, Switch, Table } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function TaxSelectionModal({ visible, onSelect, onCancel, currentTaxRate }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const entity = 'taxes';

  const { result: listResult, isLoading } = useSelector(selectListItems);
  const taxes = listResult?.items || [];
  const [selectedTaxId, setSelectedTaxId] = useState(null);

  useEffect(() => {
    if (visible) {
      dispatch(crud.list({ entity }));
    }
  }, [visible, dispatch]);

  useEffect(() => {
    // Find and select the current tax if it matches
    if (currentTaxRate && taxes.length > 0) {
      const currentTax = taxes.find((tax) => tax.taxRate === currentTaxRate);
      if (currentTax) {
        setSelectedTaxId(currentTax._id);
      }
    }
  }, [currentTaxRate, taxes]);

  const handleSelectTax = (tax) => {
    setSelectedTaxId(tax._id);
  };

  const handleConfirm = () => {
    const selectedTax = taxes.find((tax) => tax._id === selectedTaxId);
    if (selectedTax) {
      onSelect(selectedTax);
      message.success(`${translate('Selected tax')}: ${selectedTax.name}`);
    } else {
      message.warning(translate('Please select a tax rate'));
    }
  };

  const handleAddNewTax = () => {
    onCancel();
    navigate('/taxes');
  };

  const columns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PercentageOutlined style={{ color: '#8b45ff' }} />
          <span
            style={{ fontWeight: selectedTaxId === record._id ? '700' : '600', color: '#2c2c2c' }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: translate('Tax Value'),
      dataIndex: 'taxValue',
      render: (value) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{value}</span>,
    },
    {
      title: translate('Tax Rate'),
      dataIndex: 'taxRate',
      render: (rate) => <span style={{ fontWeight: '600', color: '#52c41a' }}>{rate}%</span>,
    },
    {
      title: translate('Default'),
      dataIndex: 'isDefault',
      render: (isDefault) => (
        <Switch
          checked={isDefault}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          disabled
          size="small"
        />
      ),
    },
    {
      title: translate('Enabled'),
      dataIndex: 'enabled',
      render: (enabled) => (
        <Switch
          checked={enabled}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          disabled
          size="small"
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#2c2c2c' }}>
          <PercentageOutlined style={{ marginRight: '8px', color: '#8b45ff' }} />
          {translate('Select Tax Rate')}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button
          key="add"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddNewTax}
          style={{ float: 'left' }}
        >
          {translate('Add New Tax')}
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          {translate('Cancel')}
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} disabled={!selectedTaxId}>
          {translate('Confirm Selection')}
        </Button>,
      ]}
    >
      <Spin spinning={isLoading}>
        <Table
          columns={columns}
          dataSource={taxes}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectedTaxId ? [selectedTaxId] : [],
            onChange: (selectedRowKeys, selectedRows) => {
              if (selectedRows.length > 0) {
                handleSelectTax(selectedRows[0]);
              }
            },
          }}
          onRow={(record) => ({
            onClick: () => handleSelectTax(record),
            style: {
              cursor: 'pointer',
              backgroundColor: selectedTaxId === record._id ? '#f0f5ff' : 'transparent',
            },
          })}
        />
      </Spin>
    </Modal>
  );
}
