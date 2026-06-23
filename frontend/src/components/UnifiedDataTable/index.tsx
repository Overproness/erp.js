import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  FilePdfOutlined,
  PlusOutlined,
  RedoOutlined,
} from '@/components/icons';
import { PageHeader } from '@/components/ui';
import { Button, Dropdown, Input, Table } from '@/components/ui';
import {
  cloneElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { generate as uniqueId } from 'shortid';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import useLanguage from '@/locale/useLanguage';
import { useDate, useMoney } from '@/settings';
import { dataForTable } from '@/utils/dataStructure';

import { CrudContext } from '@/context/crud';
import { crud } from '@/redux/crud/actions';
import { selectListItems as selectCrudListItems } from '@/redux/crud/selectors';

import { useErpContext } from '@/context/erp';
import { erp } from '@/redux/erp/actions';
import { selectListItems as selectErpListItems } from '@/redux/erp/selectors';

/**
 * UnifiedDataTable - A single table component for both CrudModule (panel) and ErpPanelModule (navigate) modes.
 *
 * Props:
 *  - config: { entity, dataTableColumns, fields, DATATABLE_TITLE, ADD_NEW_ENTITY, searchConfig, disableAdd, dropdownExtra }
 *  - extra: extra dropdown menu items or header buttons
 *  - mode: 'panel' (CrudModule side-panel UX) | 'navigate' (ErpPanelModule page-navigation UX)
 */
export default function UnifiedDataTable({ config, extra = [], mode = 'panel' }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();

  const {
    entity,
    dataTableColumns: rawColumns,
    fields,
    DATATABLE_TITLE,
    searchConfig,
    disableAdd = false,
    dropdownExtra = [],
  } = config;

  const isNavigateMode = mode === 'navigate';

  // Select the right Redux slice and context based on mode
  const actions = isNavigateMode ? erp : crud;
  const selectListItems = isNavigateMode ? selectErpListItems : selectCrudListItems;

  // CrudContext may not be available (only provided inside CrudLayout/DefaultLayout)
  // useContext returns undefined safely when outside provider
  const crudContextValue = useContext(CrudContext);
  const crudContextAction = useMemo(() => {
    if (!crudContextValue || !crudContextValue.crudContextAction) return null;
    return crudContextValue.crudContextAction;
  }, [crudContextValue]);

  // ErpContext is always available (wraps entire app)
  const erpCtx = useErpContext();

  const { result: listResult, isLoading: listIsLoading } = useSelector(selectListItems);
  const { pagination, items: dataSource } = listResult || { pagination: {}, items: [] };
  const safeDataSource = Array.isArray(dataSource) ? dataSource : [];

  // Build columns from fields config or raw columns
  let dataTableColumns = [];
  if (fields) {
    dataTableColumns = [...dataForTable({ fields, translate, moneyFormatter, dateFormat })];
  } else {
    dataTableColumns = [...(rawColumns || [])];
  }

  // --- Action handlers ---
  const handleRead = (record) => {
    if (isNavigateMode) {
      dispatch(erp.currentItem({ data: record }));
      navigate(`/${entity}/read/${record._id}`);
    } else {
      dispatch(crud.currentItem({ data: record }));
      crudContextAction.panel.open();
      crudContextAction.collapsedBox.open();
      crudContextAction.readBox.open();
    }
  };

  const handleEdit = (record) => {
    if (isNavigateMode) {
      dispatch(erp.currentAction({ actionType: 'update', data: { ...record } }));
      navigate(`/${entity}/update/${record._id}`);
    } else {
      dispatch(crud.currentItem({ data: record }));
      dispatch(crud.currentAction({ actionType: 'update', data: record }));
      crudContextAction.editBox.open();
      crudContextAction.panel.open();
      crudContextAction.collapsedBox.open();
    }
  };

  const handleDelete = (record) => {
    if (isNavigateMode) {
      dispatch(erp.currentAction({ actionType: 'delete', data: record }));
      erpCtx.erpContextAction.modal.open();
    } else {
      dispatch(crud.currentAction({ actionType: 'delete', data: record }));
      crudContextAction.modal.open();
    }
  };

  const handleDownload = (record) => {
    if (entity === 'document') {
      dispatch(erp.downloadDocument({ entity, id: record._id }));
    } else {
      window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
    }
  };

  const handleRecordPayment = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/invoice/pay/${record._id}`);
  };

  const handleUpdatePassword = (record) => {
    dispatch(crud.currentItem({ data: record }));
    dispatch(crud.currentAction({ actionType: 'update', data: record }));
    crudContextAction.advancedBox.open();
    crudContextAction.panel.open();
    crudContextAction.collapsedBox.open();
  };

  // --- Build dropdown menu items ---
  const extraArray = Array.isArray(extra) ? extra : extra ? [extra] : [];

  const menuItems = [
    { label: translate('Show'), key: 'read', icon: <EyeOutlined /> },
    { label: translate('Edit'), key: 'edit', icon: <EditOutlined /> },
    ...(isNavigateMode
      ? [{ label: translate('Download'), key: 'download', icon: <FilePdfOutlined /> }]
      : []),
    ...dropdownExtra,
    ...(isNavigateMode ? [] : extraArray),
    { type: 'divider' },
    { label: translate('Delete'), key: 'delete', icon: <DeleteOutlined /> },
  ];

  const onMenuClick = ({ key }, record) => {
    switch (key) {
      case 'read':
        handleRead(record);
        break;
      case 'edit':
        handleEdit(record);
        break;
      case 'download':
        handleDownload(record);
        break;
      case 'delete':
        handleDelete(record);
        break;
      case 'recordPayment':
        handleRecordPayment(record);
        break;
      case 'updatePassword':
        handleUpdatePassword(record);
        break;
      default:
        break;
    }
  };

  // Append action column
  dataTableColumns = [
    ...dataTableColumns,
    {
      title: '',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{ items: menuItems, onClick: (info) => onMenuClick(info, record) }}
          trigger={['click']}
        >
          <EllipsisOutlined
            style={{ cursor: 'pointer', fontSize: '24px' }}
            onClick={(e) => e.preventDefault()}
          />
        </Dropdown>
      ),
    },
  ];

  // --- Pagination / load ---
  const handleTableLoad = useCallback(
    (pag) => {
      const options = { page: pag.current || 1, items: pag.pageSize || 10 };
      dispatch(actions.list({ entity, options }));
    },
    [entity]
  );

  const loadedRef = useRef('');
  useEffect(() => {
    if (loadedRef.current === entity) return;
    loadedRef.current = entity;
    dispatch(actions.list({ entity }));
  }, [entity]);

  // --- Search / filter ---
  const filterTable = isNavigateMode
    ? (value) => {
        dispatch(erp.list({ entity, options: { equal: value, filter: searchConfig?.entity } }));
      }
    : (e) => {
        const value = e.target.value;
        dispatch(
          crud.list({ entity, options: { q: value, fields: searchConfig?.searchFields || '' } })
        );
      };

  // --- Add new ---
  const handleAddNew = () => {
    if (isNavigateMode) {
      navigate(`/${entity.toLowerCase()}/create`);
    } else {
      crudContextAction.panel.open();
      crudContextAction.collapsedBox.close();
    }
  };

  // --- Header extras ---
  const searchElement = isNavigateMode ? (
    <AutoCompleteAsync
      key={`${uniqueId()}`}
      entity={searchConfig?.entity}
      displayLabels={['name']}
      searchFields={'name'}
      onChange={filterTable}
    />
  ) : (
    <Input
      key="searchFilterDataTable"
      onChange={filterTable}
      placeholder={translate('search')}
      allowClear
    />
  );

  const configExtra = config.extra;
  const allHeaderExtra = [
    ...(Array.isArray(configExtra) ? configExtra : configExtra ? [configExtra] : []),
    ...(isNavigateMode ? extraArray : []),
  ];

  const headerExtra = [
    searchElement,
    <Button
      onClick={() => handleTableLoad({ current: 1 })}
      key={`${uniqueId()}`}
      icon={<RedoOutlined />}
    >
      {translate('Refresh')}
    </Button>,
    ...allHeaderExtra.map((item, index) =>
      isValidElement(item) ? cloneElement(item, { key: `extra-${index}` }) : item
    ),
    !disableAdd && (
      <Button
        key={`${uniqueId()}`}
        onClick={handleAddNew}
        type="primary"
        icon={isNavigateMode ? <PlusOutlined /> : undefined}
      >
        {config.ADD_NEW_ENTITY}
      </Button>
    ),
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        onBack={() => window.history.back()}
        backIcon={<ArrowLeftOutlined />}
        title={DATATABLE_TITLE}
        ghost={isNavigateMode}
        extra={headerExtra}
        style={{ padding: '20px 0px' }}
      />
      <Table
        columns={dataTableColumns}
        rowKey={(item) => item._id}
        dataSource={safeDataSource}
        pagination={pagination}
        loading={listIsLoading}
        onChange={handleTableLoad}
        scroll={{ x: true }}
      />
    </>
  );
}
