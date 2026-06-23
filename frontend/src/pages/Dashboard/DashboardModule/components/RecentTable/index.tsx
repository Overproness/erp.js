import { Dropdown, Table } from '@/components/ui';

import apolloClient from '@/graphql/client';
import { getListQuery } from '@/graphql/operations/crudFactory';
import useFetch from '@/hooks/useFetch';

import { EllipsisOutlined, EyeOutlined, EditOutlined, FilePdfOutlined } from '@/components/icons';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';

export default function RecentTable({ ...props }) {
  const translate = useLanguage();
  let { entity, dataTableColumns } = props;

  const items = [
    {
      label: translate('Show'),
      key: 'read',
      icon: <EyeOutlined />,
    },
    {
      label: translate('Edit'),
      key: 'edit',
      icon: <EditOutlined />,
    },
    {
      label: translate('Download'),
      key: 'download',
      icon: <FilePdfOutlined />,
    },
  ];

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRead = (record) => {
    dispatch(erp.currentItem({ data: record }));
    navigate(`/${entity}/read/${record._id}`);
  };
  const handleEdit = (record) => {
    dispatch(erp.currentAction({ actionType: 'update', data: record }));
    navigate(`/${entity}/update/${record._id}`);
  };
  const handleDownload = (record) => {
    window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${record._id}.pdf`, '_blank');
  };

  dataTableColumns = [
    ...dataTableColumns,
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Dropdown
          menu={{
            items,
            onClick: ({ key }) => {
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

                default:
                  break;
              }
            },
          }}
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

  const asyncList = () => {
    return apolloClient.query({ query: getListQuery(entity) }).then(({ data }) => {
      const key = `${entity}List`;
      return data[key] || { success: true, result: [] };
    });
  };
  const { result, isLoading, isSuccess } = useFetch(asyncList);
  const firstFiveItems = () => {
    if (isSuccess && result) return result.slice(0, 5);
    return [];
  };

  return (
    <Table
      columns={dataTableColumns}
      rowKey={(item) => item._id}
      dataSource={isSuccess && firstFiveItems()}
      pagination={false}
      loading={isLoading}
      scroll={{ x: true }}
      style={{
        border: '1px solid #7ED957',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}