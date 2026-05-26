import React from 'react';
import { Button, Form, Select, Divider, Switch, Space, Typography, Checkbox, Row, Col } from '@/components/ui';
import { CloseOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import { useErpContext } from '@/context/erp';
import { selectCurrentItem } from '@/redux/erp/selectors';

const { Option } = Select;
const { Title, Text } = Typography;

const EditMemberPanel = ({ config }) => {
  const { entity, id, memberId } = config;
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { erpContextAction } = useErpContext();
  const { panel } = erpContextAction;
  const { result: currentResult } = useSelector(selectCurrentItem);
  const item  = currentResult;

  console.log("item:", item);

  // Find the current member object
  const currentMember = React.useMemo(() => {
    if (item && item.members) {
      return item.members.find(m => m._id === memberId);
    }
    return null;
  }, [item, memberId]);

  console.log(currentMember)

  // Define permission modules with their CRUD operations (same as InviteMemberPanel)
  const permissionModules = [
    { key: 'Invoices', permissions: ['canViewInvoices', 'canCreateInvoices', 'canUpdateInvoices', 'canDeleteInvoices'] },
    { key: 'Clients', permissions: ['canViewClients', 'canCreateClients', 'canUpdateClients', 'canDeleteClients'] },
    { key: 'Payments', permissions: ['canViewPayments', 'canCreatePayments', 'canUpdatePayments', 'canDeletePayments'] },
    { key: 'Quotes', permissions: ['canViewQuotes', 'canCreateQuotes', 'canUpdateQuotes', 'canDeleteQuotes'] },
    { key: 'Offers', permissions: ['canViewOffers', 'canCreateOffers', 'canUpdateOffers', 'canDeleteOffers'] },
    { key: 'Marketing', permissions: ['canViewMarketing', 'canCreateMarketing', 'canUpdateMarketing', 'canDeleteMarketing'] },
    { key: 'Reputation', permissions: ['canViewReputation', 'canCreateReputation', 'canUpdateReputation', 'canDeleteReputation'] },
    { key: 'Tasks', permissions: ['canViewTasks', 'canCreateTasks', 'canUpdateTasks', 'canDeleteTasks'] },
    { key: 'Documents', permissions: ['canViewDocuments', 'canCreateDocuments', 'canUpdateDocuments', 'canDeleteDocuments'] },
    { key: 'Reports', permissions: ['canViewReports', 'canCreateReports', 'canUpdateReports', 'canDeleteReports'] },
    { key: 'Analytics', permissions: ['canViewAnalytics', 'canCreateAnalytics', 'canUpdateAnalytics', 'canDeleteAnalytics'] },
    { key: 'Settings', permissions: ['canViewSettings', 'canCreateSettings', 'canUpdateSettings', 'canDeleteSettings'] },
    { key: 'Notifications', permissions: ['canViewNotifications', 'canCreateNotifications', 'canUpdateNotifications', 'canDeleteNotifications'] },
    { key: 'AI Assistants', permissions: ['canViewAiAssistants', 'canCreateAiAssistants', 'canUpdateAiAssistants', 'canDeleteAiAssistants'] },
    { key: 'Taxes', permissions: ['canViewTaxes', 'canCreateTaxes', 'canUpdateTaxes', 'canDeleteTaxes'] },
    { key: 'Currency', permissions: ['canViewCurrency', 'canCreateCurrency', 'canUpdateCurrency', 'canDeleteCurrency'] },
    { key: 'Teams', permissions: ['canViewTeams', 'canCreateTeams', 'canUpdateTeams', 'canDeleteTeams'] },
    { key: 'Workflows', permissions: ['canViewWorkflows', 'canCreateWorkflows', 'canUpdateWorkflows', 'canDeleteWorkflows'] },
    { key: 'Social Accounts', permissions: ['canViewSocialAccounts', 'canCreateSocialAccounts', 'canUpdateSocialAccounts', 'canDeleteSocialAccounts'] },
    { key: 'Social Posts', permissions: ['canViewSocialPosts', 'canCreateSocialPosts', 'canUpdateSocialPosts', 'canDeleteSocialPosts'] },
    { key: 'Social Campaigns', permissions: ['canViewSocialCampaigns', 'canCreateSocialCampaigns', 'canUpdateSocialCampaigns', 'canDeleteSocialCampaigns'] },
    { key: 'URLs', permissions: ['canViewUrls', 'canCreateUrls', 'canUpdateUrls', 'canDeleteUrls'] },
  ];

  // Define default permissions for each role
  const getDefaultPermissions = (role) => {
    const allPermissions = {};
    const basicMemberPermissions = {
      // Basic view permissions for members
      canViewInvoices: true,
      canViewClients: true,
      canViewPayments: true,
      canViewQuotes: true,
      canViewTasks: true,
      canViewDocuments: true,
      canViewReports: true,
      canViewReputation: true,
      // Some basic create permissions
      canCreateTasks: true,
      canCreateDocuments: true,
    };

    // Generate all permissions object for admin/lead roles
    permissionModules.forEach(module => {
      module.permissions.forEach(permission => {
        allPermissions[permission] = true;
      });
    });

    switch (role) {
      case 'admin':
      case 'lead':
        return allPermissions;
      case 'member':
        return basicMemberPermissions;
      default:
        return {};
    }
  };

  React.useEffect(() => {
    if (item && item.members) {
      const member = item.members.find(m => m._id === memberId);
      if (member) {
        form.setFieldsValue({
          role: member.role,
          permissions: member.permissions || {},
        });
      }
    }
  }, [item, memberId, form]);

  const onFinish = (values) => {
    dispatch(erp.custom({ 
      entity, 
      customAction: 'updateMember', 
      jsonData: { 
        ...values,
        teamId: id,
        memberId,
      }
    }));
    panel.close();
    form.resetFields();
  };

  const handleCancel = () => {
    panel.close();
  };

  // Handle role change
  const handleRoleChange = (newRole) => {
    const currentValues = form.getFieldsValue();
    const defaultPermissions = getDefaultPermissions(newRole);
    
    form.setFieldsValue({
      ...currentValues,
      role: newRole,
      permissions: defaultPermissions
    });
  };

  // Handle select all for a module
  const handleSelectAllForModule = (moduleKey, selectAll) => {
    const module = permissionModules.find(m => m.key === moduleKey);
    if (!module) return;

    const currentValues = form.getFieldsValue();
    const updatedPermissions = { ...currentValues.permissions };
    
    module.permissions.forEach(permission => {
      updatedPermissions[permission] = selectAll;
    });

    form.setFieldsValue({
      ...currentValues,
      permissions: updatedPermissions
    });
  };

  return (
    <div style={{ 
      position: 'fixed', 
      right: 0, 
      top: 0, 
      bottom: 0, 
      width: '520px', 
      background: 'white', 
      padding: '24px', 
      boxShadow: '-2px 0px 10px rgba(0, 0, 0, 0.15)', 
      overflowY: 'auto', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>Edit Team Member</Title>
        <Button type="text" onClick={handleCancel} icon={<CloseOutlined />} />
      </div>
      <Divider style={{ margin: '0 0 24px 0' }} />
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          permissions: currentMember?.permissions || {},
          role: currentMember?.role || 'member',
        }}
      >
        <Form.Item name="role" label="Role">
          <Select onChange={handleRoleChange}>
            <Option value="member">Member</Option>
            <Option value="lead">Team Lead</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </Form.Item>
        
        <Divider orientation="left">Permissions</Divider>
        
        {/* Permissions Grid Header */}
        <Row gutter={[8, 8]} style={{ marginBottom: '12px', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          <Col span={8}>
            <Text strong>Module</Text>
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>All</Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>View</Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>Create</Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>Update</Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>Delete</Text>
          </Col>
        </Row>

        {/* Permissions Grid Rows */}
        {permissionModules.map((module) => (
          <Row key={module.key} gutter={[8, 8]} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f5f5f5' }}>
            <Col span={8}>
              <Text style={{ fontSize: '12px', fontWeight: '500' }}>{module.key}</Text>
            </Col>
            <Col span={4} style={{ textAlign: 'center' }}>
              <Form.Item style={{ margin: 0 }}>
                <Checkbox
                  indeterminate={(() => {
                    const currentValues = form.getFieldsValue();
                    const checkedCount = module.permissions.filter(p => currentValues.permissions?.[p]).length;
                    return checkedCount > 0 && checkedCount < module.permissions.length;
                  })()}
                  checked={(() => {
                    const currentValues = form.getFieldsValue();
                    return module.permissions.every(p => currentValues.permissions?.[p]);
                  })()}
                  onChange={(e) => handleSelectAllForModule(module.key, e.target.checked)}
                />
              </Form.Item>
            </Col>
            {module.permissions.map((permission, index) => (
              <Col key={permission} span={3} style={{ textAlign: 'center' }}>
                <Form.Item name={['permissions', permission]} valuePropName="checked" style={{ margin: 0 }}>
                  <Checkbox 
                    onChange={(e) => {
                      const currentValues = form.getFieldsValue();
                      form.setFieldsValue({
                        ...currentValues,
                        permissions: {
                          ...currentValues.permissions,
                          [permission]: e.target.checked
                        }
                      });
                    }}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        ))}

        {/* Quick Actions */}
        <Row gutter={[8, 8]} style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <Col span={24}>
            <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>Quick Actions:</Text>
          </Col>
          <Col span={8}>
            <Button 
              size="small" 
              onClick={() => {
                const allPermissions = getDefaultPermissions('admin');
                const currentValues = form.getFieldsValue();
                form.setFieldsValue({
                  ...currentValues,
                  permissions: allPermissions
                });
              }}
            >
              Select All
            </Button>
          </Col>
          <Col span={8}>
            <Button 
              size="small" 
              onClick={() => {
                const currentValues = form.getFieldsValue();
                form.setFieldsValue({
                  ...currentValues,
                  permissions: {}
                });
              }}
            >
              Clear All
            </Button>
          </Col>
          <Col span={8}>
            <Button 
              size="small" 
              onClick={() => {
                const viewOnlyPermissions = {};
                permissionModules.forEach(module => {
                  const viewPermission = module.permissions.find(p => p.includes('View'));
                  if (viewPermission) {
                    viewOnlyPermissions[viewPermission] = true;
                  }
                });
                const currentValues = form.getFieldsValue();
                form.setFieldsValue({
                  ...currentValues,
                  permissions: viewOnlyPermissions
                });
              }}
            >
              View Only
            </Button>
          </Col>
        </Row>
        
        <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Member
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditMemberPanel;