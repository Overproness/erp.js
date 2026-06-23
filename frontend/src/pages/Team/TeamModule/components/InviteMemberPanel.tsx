import { useErpContext } from '@/context/erp';
import { erp } from '@/redux/erp/actions';
import { CloseOutlined } from '@/components/icons';
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Typography,
  message,
} from '@/components/ui';
import React from 'react';
import { useDispatch } from 'react-redux';

const { Option } = Select;
const { Title, Text } = Typography;

const InviteMemberPanel = ({ config }) => {
  const { entity, recordId } = config;
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { erpContextAction } = useErpContext();
  const { panel } = erpContextAction;
  const [submitting, setSubmitting] = React.useState(false);

  // Define permission modules with their CRUD operations (updated to match backend)
  const permissionModules = [
    {
      key: 'Invoices',
      permissions: [
        'canViewInvoices',
        'canCreateInvoices',
        'canUpdateInvoices',
        'canDeleteInvoices',
      ],
    },
    {
      key: 'Clients',
      permissions: ['canViewClients', 'canCreateClients', 'canUpdateClients', 'canDeleteClients'],
    },
    {
      key: 'Payments',
      permissions: [
        'canViewPayments',
        'canCreatePayments',
        'canUpdatePayments',
        'canDeletePayments',
      ],
    },
    {
      key: 'Payment Methods',
      permissions: [
        'canViewPaymentMethods',
        'canCreatePaymentMethods',
        'canUpdatePaymentMethods',
        'canDeletePaymentMethods',
      ],
    },
    {
      key: 'Quotes',
      permissions: ['canViewQuotes', 'canCreateQuotes', 'canUpdateQuotes', 'canDeleteQuotes'],
    },
    {
      key: 'Offers',
      permissions: ['canViewOffers', 'canCreateOffers', 'canUpdateOffers', 'canDeleteOffers'],
    },
    {
      key: 'Follow-Ups',
      permissions: [
        'canViewFollowUps',
        'canCreateFollowUps',
        'canUpdateFollowUps',
        'canDeleteFollowUps',
      ],
    },
    {
      key: 'Marketing',
      permissions: [
        'canViewMarketing',
        'canCreateMarketing',
        'canUpdateMarketing',
        'canDeleteMarketing',
      ],
    },
    {
      key: 'Behavior Triggers',
      permissions: [
        'canViewBehaviorTriggers',
        'canCreateBehaviorTriggers',
        'canUpdateBehaviorTriggers',
        'canDeleteBehaviorTriggers',
      ],
    },
    {
      key: 'Retargeting',
      permissions: [
        'canViewRetargeting',
        'canCreateRetargeting',
        'canUpdateRetargeting',
        'canDeleteRetargeting',
      ],
    },
    {
      key: 'Reputation',
      permissions: [
        'canViewReputation',
        'canCreateReputation',
        'canUpdateReputation',
        'canDeleteReputation',
      ],
    },
    {
      key: 'Surveys',
      permissions: ['canViewSurveys', 'canCreateSurveys', 'canUpdateSurveys', 'canDeleteSurveys'],
    },
    {
      key: 'Chat',
      permissions: ['canViewChat', 'canCreateChat', 'canUpdateChat', 'canDeleteChat'],
    },
    {
      key: 'Tasks',
      permissions: ['canViewTasks', 'canCreateTasks', 'canUpdateTasks', 'canDeleteTasks'],
    },
    {
      key: 'Appointments',
      permissions: [
        'canViewAppointments',
        'canCreateAppointments',
        'canUpdateAppointments',
        'canDeleteAppointments',
      ],
    },
    {
      key: 'Documents',
      permissions: [
        'canViewDocuments',
        'canCreateDocuments',
        'canUpdateDocuments',
        'canDeleteDocuments',
      ],
    },
    {
      key: 'Reports',
      permissions: ['canViewReports', 'canCreateReports', 'canUpdateReports', 'canDeleteReports'],
    },
    {
      key: 'Analytics',
      permissions: [
        'canViewAnalytics',
        'canCreateAnalytics',
        'canUpdateAnalytics',
        'canDeleteAnalytics',
      ],
    },
    {
      key: 'Settings',
      permissions: [
        'canViewSettings',
        'canCreateSettings',
        'canUpdateSettings',
        'canDeleteSettings',
      ],
    },
    {
      key: 'Notifications',
      permissions: [
        'canViewNotifications',
        'canCreateNotifications',
        'canUpdateNotifications',
        'canDeleteNotifications',
      ],
    },
    {
      key: 'AI Assistants',
      permissions: [
        'canViewAiAssistants',
        'canCreateAiAssistants',
        'canUpdateAiAssistants',
        'canDeleteAiAssistants',
      ],
    },
    {
      key: 'AI Learning',
      permissions: [
        'canViewAiLearning',
        'canCreateAiLearning',
        'canUpdateAiLearning',
        'canDeleteAiLearning',
      ],
    },
    {
      key: 'Taxes',
      permissions: ['canViewTaxes', 'canCreateTaxes', 'canUpdateTaxes', 'canDeleteTaxes'],
    },
    {
      key: 'Currency',
      permissions: [
        'canViewCurrency',
        'canCreateCurrency',
        'canUpdateCurrency',
        'canDeleteCurrency',
      ],
    },
    {
      key: 'Teams',
      permissions: ['canViewTeams', 'canCreateTeams', 'canUpdateTeams', 'canDeleteTeams'],
    },
    {
      key: 'Workflows',
      permissions: [
        'canViewWorkflows',
        'canCreateWorkflows',
        'canUpdateWorkflows',
        'canDeleteWorkflows',
      ],
    },
    {
      key: 'Social Accounts',
      permissions: [
        'canViewSocialAccounts',
        'canCreateSocialAccounts',
        'canUpdateSocialAccounts',
        'canDeleteSocialAccounts',
      ],
    },
    {
      key: 'Social Posts',
      permissions: [
        'canViewSocialPosts',
        'canCreateSocialPosts',
        'canUpdateSocialPosts',
        'canDeleteSocialPosts',
      ],
    },
    {
      key: 'Social Campaigns',
      permissions: [
        'canViewSocialCampaigns',
        'canCreateSocialCampaigns',
        'canUpdateSocialCampaigns',
        'canDeleteSocialCampaigns',
      ],
    },
    {
      key: 'URLs',
      permissions: ['canViewUrls', 'canCreateUrls', 'canUpdateUrls', 'canDeleteUrls'],
    },
  ];

  const crudLabels = ['View', 'Create', 'Update', 'Delete'];

  // Define default permissions for each role (updated to include all permissions)
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
      canViewAnalytics: true,
      // Some basic create permissions
      canCreateTasks: true,
      canCreateDocuments: true,
      // No delete permissions for basic members
    };

    // Generate all permissions object for admin/lead roles
    permissionModules.forEach((module) => {
      module.permissions.forEach((permission) => {
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

  const onFinish = async (values) => {
    // Make sure we send data in the format expected by the backend
    console.log('Form values received:', JSON.stringify(values, null, 2));

    // Explicitly convert each permission to a boolean to ensure they're not undefined (updated with all permissions)
    const permissions = {
      // Invoices
      canViewInvoices: values.permissions?.canViewInvoices === true,
      canCreateInvoices: values.permissions?.canCreateInvoices === true,
      canUpdateInvoices: values.permissions?.canUpdateInvoices === true,
      canDeleteInvoices: values.permissions?.canDeleteInvoices === true,
      // Clients
      canViewClients: values.permissions?.canViewClients === true,
      canCreateClients: values.permissions?.canCreateClients === true,
      canUpdateClients: values.permissions?.canUpdateClients === true,
      canDeleteClients: values.permissions?.canDeleteClients === true,
      // Payments
      canViewPayments: values.permissions?.canViewPayments === true,
      canCreatePayments: values.permissions?.canCreatePayments === true,
      canUpdatePayments: values.permissions?.canUpdatePayments === true,
      canDeletePayments: values.permissions?.canDeletePayments === true,
      // Payment Methods
      canViewPaymentMethods: values.permissions?.canViewPaymentMethods === true,
      canCreatePaymentMethods: values.permissions?.canCreatePaymentMethods === true,
      canUpdatePaymentMethods: values.permissions?.canUpdatePaymentMethods === true,
      canDeletePaymentMethods: values.permissions?.canDeletePaymentMethods === true,
      // Quotes
      canViewQuotes: values.permissions?.canViewQuotes === true,
      canCreateQuotes: values.permissions?.canCreateQuotes === true,
      canUpdateQuotes: values.permissions?.canUpdateQuotes === true,
      canDeleteQuotes: values.permissions?.canDeleteQuotes === true,
      // Offers
      canViewOffers: values.permissions?.canViewOffers === true,
      canCreateOffers: values.permissions?.canCreateOffers === true,
      canUpdateOffers: values.permissions?.canUpdateOffers === true,
      canDeleteOffers: values.permissions?.canDeleteOffers === true,
      // Follow-Ups
      canViewFollowUps: values.permissions?.canViewFollowUps === true,
      canCreateFollowUps: values.permissions?.canCreateFollowUps === true,
      canUpdateFollowUps: values.permissions?.canUpdateFollowUps === true,
      canDeleteFollowUps: values.permissions?.canDeleteFollowUps === true,
      // Marketing
      canViewMarketing: values.permissions?.canViewMarketing === true,
      canCreateMarketing: values.permissions?.canCreateMarketing === true,
      canUpdateMarketing: values.permissions?.canUpdateMarketing === true,
      canDeleteMarketing: values.permissions?.canDeleteMarketing === true,
      // Behavior Triggers
      canViewBehaviorTriggers: values.permissions?.canViewBehaviorTriggers === true,
      canCreateBehaviorTriggers: values.permissions?.canCreateBehaviorTriggers === true,
      canUpdateBehaviorTriggers: values.permissions?.canUpdateBehaviorTriggers === true,
      canDeleteBehaviorTriggers: values.permissions?.canDeleteBehaviorTriggers === true,
      // Retargeting
      canViewRetargeting: values.permissions?.canViewRetargeting === true,
      canCreateRetargeting: values.permissions?.canCreateRetargeting === true,
      canUpdateRetargeting: values.permissions?.canUpdateRetargeting === true,
      canDeleteRetargeting: values.permissions?.canDeleteRetargeting === true,
      // Reputation (was missing!)
      canViewReputation: values.permissions?.canViewReputation === true,
      canCreateReputation: values.permissions?.canCreateReputation === true,
      canUpdateReputation: values.permissions?.canUpdateReputation === true,
      canDeleteReputation: values.permissions?.canDeleteReputation === true,
      // Surveys
      canViewSurveys: values.permissions?.canViewSurveys === true,
      canCreateSurveys: values.permissions?.canCreateSurveys === true,
      canUpdateSurveys: values.permissions?.canUpdateSurveys === true,
      canDeleteSurveys: values.permissions?.canDeleteSurveys === true,
      // Chat
      canViewChat: values.permissions?.canViewChat === true,
      canCreateChat: values.permissions?.canCreateChat === true,
      canUpdateChat: values.permissions?.canUpdateChat === true,
      canDeleteChat: values.permissions?.canDeleteChat === true,
      // Tasks
      canViewTasks: values.permissions?.canViewTasks === true,
      canCreateTasks: values.permissions?.canCreateTasks === true,
      canUpdateTasks: values.permissions?.canUpdateTasks === true,
      canDeleteTasks: values.permissions?.canDeleteTasks === true,
      // Appointments
      canViewAppointments: values.permissions?.canViewAppointments === true,
      canCreateAppointments: values.permissions?.canCreateAppointments === true,
      canUpdateAppointments: values.permissions?.canUpdateAppointments === true,
      canDeleteAppointments: values.permissions?.canDeleteAppointments === true,
      // Documents
      canViewDocuments: values.permissions?.canViewDocuments === true,
      canCreateDocuments: values.permissions?.canCreateDocuments === true,
      canUpdateDocuments: values.permissions?.canUpdateDocuments === true,
      canDeleteDocuments: values.permissions?.canDeleteDocuments === true,
      // Reports
      canViewReports: values.permissions?.canViewReports === true,
      canCreateReports: values.permissions?.canCreateReports === true,
      canUpdateReports: values.permissions?.canUpdateReports === true,
      canDeleteReports: values.permissions?.canDeleteReports === true,
      // Analytics
      canViewAnalytics: values.permissions?.canViewAnalytics === true,
      canCreateAnalytics: values.permissions?.canCreateAnalytics === true,
      canUpdateAnalytics: values.permissions?.canUpdateAnalytics === true,
      canDeleteAnalytics: values.permissions?.canDeleteAnalytics === true,
      // Settings
      canViewSettings: values.permissions?.canViewSettings === true,
      canCreateSettings: values.permissions?.canCreateSettings === true,
      canUpdateSettings: values.permissions?.canUpdateSettings === true,
      canDeleteSettings: values.permissions?.canDeleteSettings === true,
      // Notifications
      canViewNotifications: values.permissions?.canViewNotifications === true,
      canCreateNotifications: values.permissions?.canCreateNotifications === true,
      canUpdateNotifications: values.permissions?.canUpdateNotifications === true,
      canDeleteNotifications: values.permissions?.canDeleteNotifications === true,
      // AI Assistants
      canViewAiAssistants: values.permissions?.canViewAiAssistants === true,
      canCreateAiAssistants: values.permissions?.canCreateAiAssistants === true,
      canUpdateAiAssistants: values.permissions?.canUpdateAiAssistants === true,
      canDeleteAiAssistants: values.permissions?.canDeleteAiAssistants === true,
      // AI Learning
      canViewAiLearning: values.permissions?.canViewAiLearning === true,
      canCreateAiLearning: values.permissions?.canCreateAiLearning === true,
      canUpdateAiLearning: values.permissions?.canUpdateAiLearning === true,
      canDeleteAiLearning: values.permissions?.canDeleteAiLearning === true,
      // Taxes
      canViewTaxes: values.permissions?.canViewTaxes === true,
      canCreateTaxes: values.permissions?.canCreateTaxes === true,
      canUpdateTaxes: values.permissions?.canUpdateTaxes === true,
      canDeleteTaxes: values.permissions?.canDeleteTaxes === true,
      // Currency
      canViewCurrency: values.permissions?.canViewCurrency === true,
      canCreateCurrency: values.permissions?.canCreateCurrency === true,
      canUpdateCurrency: values.permissions?.canUpdateCurrency === true,
      canDeleteCurrency: values.permissions?.canDeleteCurrency === true,
      // Teams
      canViewTeams: values.permissions?.canViewTeams === true,
      canCreateTeams: values.permissions?.canCreateTeams === true,
      canUpdateTeams: values.permissions?.canUpdateTeams === true,
      canDeleteTeams: values.permissions?.canDeleteTeams === true,
      // Workflows
      canViewWorkflows: values.permissions?.canViewWorkflows === true,
      canCreateWorkflows: values.permissions?.canCreateWorkflows === true,
      canUpdateWorkflows: values.permissions?.canUpdateWorkflows === true,
      canDeleteWorkflows: values.permissions?.canDeleteWorkflows === true,
      // Social Media Accounts
      canViewSocialAccounts: values.permissions?.canViewSocialAccounts === true,
      canCreateSocialAccounts: values.permissions?.canCreateSocialAccounts === true,
      canUpdateSocialAccounts: values.permissions?.canUpdateSocialAccounts === true,
      canDeleteSocialAccounts: values.permissions?.canDeleteSocialAccounts === true,
      // Social Media Posts
      canViewSocialPosts: values.permissions?.canViewSocialPosts === true,
      canCreateSocialPosts: values.permissions?.canCreateSocialPosts === true,
      canUpdateSocialPosts: values.permissions?.canUpdateSocialPosts === true,
      canDeleteSocialPosts: values.permissions?.canDeleteSocialPosts === true,
      // Social Media Campaigns
      canViewSocialCampaigns: values.permissions?.canViewSocialCampaigns === true,
      canCreateSocialCampaigns: values.permissions?.canCreateSocialCampaigns === true,
      canUpdateSocialCampaigns: values.permissions?.canUpdateSocialCampaigns === true,
      canDeleteSocialCampaigns: values.permissions?.canDeleteSocialCampaigns === true,
      // URL Management
      canViewUrls: values.permissions?.canViewUrls === true,
      canCreateUrls: values.permissions?.canCreateUrls === true,
      canUpdateUrls: values.permissions?.canUpdateUrls === true,
      canDeleteUrls: values.permissions?.canDeleteUrls === true,
    };

    console.log('Formatted permissions:', JSON.stringify(permissions, null, 2));

    const formattedValues = {
      name: values.name,
      email: values.email,
      role: values.role || 'member',
      permissions: permissions,
    };

    setSubmitting(true);
    try {
      // Ensure permissions values are explicitly boolean (updated with all permissions)
      const safePermissions = {
        // Invoices
        canViewInvoices: formattedValues.permissions.canViewInvoices === true,
        canCreateInvoices: formattedValues.permissions.canCreateInvoices === true,
        canUpdateInvoices: formattedValues.permissions.canUpdateInvoices === true,
        canDeleteInvoices: formattedValues.permissions.canDeleteInvoices === true,
        // Clients
        canViewClients: formattedValues.permissions.canViewClients === true,
        canCreateClients: formattedValues.permissions.canCreateClients === true,
        canUpdateClients: formattedValues.permissions.canUpdateClients === true,
        canDeleteClients: formattedValues.permissions.canDeleteClients === true,
        // Payments
        canViewPayments: formattedValues.permissions.canViewPayments === true,
        canCreatePayments: formattedValues.permissions.canCreatePayments === true,
        canUpdatePayments: formattedValues.permissions.canUpdatePayments === true,
        canDeletePayments: formattedValues.permissions.canDeletePayments === true,
        // Quotes
        canViewQuotes: formattedValues.permissions.canViewQuotes === true,
        canCreateQuotes: formattedValues.permissions.canCreateQuotes === true,
        canUpdateQuotes: formattedValues.permissions.canUpdateQuotes === true,
        canDeleteQuotes: formattedValues.permissions.canDeleteQuotes === true,
        // Offers
        canViewOffers: formattedValues.permissions.canViewOffers === true,
        canCreateOffers: formattedValues.permissions.canCreateOffers === true,
        canUpdateOffers: formattedValues.permissions.canUpdateOffers === true,
        canDeleteOffers: formattedValues.permissions.canDeleteOffers === true,
        // Marketing
        canViewMarketing: formattedValues.permissions.canViewMarketing === true,
        canCreateMarketing: formattedValues.permissions.canCreateMarketing === true,
        canUpdateMarketing: formattedValues.permissions.canUpdateMarketing === true,
        canDeleteMarketing: formattedValues.permissions.canDeleteMarketing === true,
        // Reputation (was missing!)
        canViewReputation: formattedValues.permissions.canViewReputation === true,
        canCreateReputation: formattedValues.permissions.canCreateReputation === true,
        canUpdateReputation: formattedValues.permissions.canUpdateReputation === true,
        canDeleteReputation: formattedValues.permissions.canDeleteReputation === true,
        // Tasks
        canViewTasks: formattedValues.permissions.canViewTasks === true,
        canCreateTasks: formattedValues.permissions.canCreateTasks === true,
        canUpdateTasks: formattedValues.permissions.canUpdateTasks === true,
        canDeleteTasks: formattedValues.permissions.canDeleteTasks === true,
        // Documents
        canViewDocuments: formattedValues.permissions.canViewDocuments === true,
        canCreateDocuments: formattedValues.permissions.canCreateDocuments === true,
        canUpdateDocuments: formattedValues.permissions.canUpdateDocuments === true,
        canDeleteDocuments: formattedValues.permissions.canDeleteDocuments === true,
        // Reports
        canViewReports: formattedValues.permissions.canViewReports === true,
        canCreateReports: formattedValues.permissions.canCreateReports === true,
        canUpdateReports: formattedValues.permissions.canUpdateReports === true,
        canDeleteReports: formattedValues.permissions.canDeleteReports === true,
        // Analytics
        canViewAnalytics: formattedValues.permissions.canViewAnalytics === true,
        canCreateAnalytics: formattedValues.permissions.canCreateAnalytics === true,
        canUpdateAnalytics: formattedValues.permissions.canUpdateAnalytics === true,
        canDeleteAnalytics: formattedValues.permissions.canDeleteAnalytics === true,
        // Settings
        canViewSettings: formattedValues.permissions.canViewSettings === true,
        canCreateSettings: formattedValues.permissions.canCreateSettings === true,
        canUpdateSettings: formattedValues.permissions.canUpdateSettings === true,
        canDeleteSettings: formattedValues.permissions.canDeleteSettings === true,
        // Notifications
        canViewNotifications: formattedValues.permissions.canViewNotifications === true,
        canCreateNotifications: formattedValues.permissions.canCreateNotifications === true,
        canUpdateNotifications: formattedValues.permissions.canUpdateNotifications === true,
        canDeleteNotifications: formattedValues.permissions.canDeleteNotifications === true,
        // AI Assistants
        canViewAiAssistants: formattedValues.permissions.canViewAiAssistants === true,
        canCreateAiAssistants: formattedValues.permissions.canCreateAiAssistants === true,
        canUpdateAiAssistants: formattedValues.permissions.canUpdateAiAssistants === true,
        canDeleteAiAssistants: formattedValues.permissions.canDeleteAiAssistants === true,
        // Taxes
        canViewTaxes: formattedValues.permissions.canViewTaxes === true,
        canCreateTaxes: formattedValues.permissions.canCreateTaxes === true,
        canUpdateTaxes: formattedValues.permissions.canUpdateTaxes === true,
        canDeleteTaxes: formattedValues.permissions.canDeleteTaxes === true,
        // Currency
        canViewCurrency: formattedValues.permissions.canViewCurrency === true,
        canCreateCurrency: formattedValues.permissions.canCreateCurrency === true,
        canUpdateCurrency: formattedValues.permissions.canUpdateCurrency === true,
        canDeleteCurrency: formattedValues.permissions.canDeleteCurrency === true,
        // Teams
        canViewTeams: formattedValues.permissions.canViewTeams === true,
        canCreateTeams: formattedValues.permissions.canCreateTeams === true,
        canUpdateTeams: formattedValues.permissions.canUpdateTeams === true,
        canDeleteTeams: formattedValues.permissions.canDeleteTeams === true,
        // Workflows
        canViewWorkflows: formattedValues.permissions.canViewWorkflows === true,
        canCreateWorkflows: formattedValues.permissions.canCreateWorkflows === true,
        canUpdateWorkflows: formattedValues.permissions.canUpdateWorkflows === true,
        canDeleteWorkflows: formattedValues.permissions.canDeleteWorkflows === true,
        // Social Media Accounts
        canViewSocialAccounts: formattedValues.permissions.canViewSocialAccounts === true,
        canCreateSocialAccounts: formattedValues.permissions.canCreateSocialAccounts === true,
        canUpdateSocialAccounts: formattedValues.permissions.canUpdateSocialAccounts === true,
        canDeleteSocialAccounts: formattedValues.permissions.canDeleteSocialAccounts === true,
        // Social Media Posts
        canViewSocialPosts: formattedValues.permissions.canViewSocialPosts === true,
        canCreateSocialPosts: formattedValues.permissions.canCreateSocialPosts === true,
        canUpdateSocialPosts: formattedValues.permissions.canUpdateSocialPosts === true,
        canDeleteSocialPosts: formattedValues.permissions.canDeleteSocialPosts === true,
        // Social Media Campaigns
        canViewSocialCampaigns: formattedValues.permissions.canViewSocialCampaigns === true,
        canCreateSocialCampaigns: formattedValues.permissions.canCreateSocialCampaigns === true,
        canUpdateSocialCampaigns: formattedValues.permissions.canUpdateSocialCampaigns === true,
        canDeleteSocialCampaigns: formattedValues.permissions.canDeleteSocialCampaigns === true,
        // URL Management
        canViewUrls: formattedValues.permissions.canViewUrls === true,
        canCreateUrls: formattedValues.permissions.canCreateUrls === true,
        canUpdateUrls: formattedValues.permissions.canUpdateUrls === true,
        canDeleteUrls: formattedValues.permissions.canDeleteUrls === true,
      };

      console.log('Safe permissions before dispatch:', JSON.stringify(safePermissions, null, 2));

      const result = await dispatch(
        erp.custom({
          entity,
          customAction: 'inviteMember',
          jsonData: {
            ...formattedValues,
            permissions: safePermissions, // Override with safe values
            teamId: recordId,
          },
        })
      );

      if (result && result.success) {
        message.success('Team member invited successfully');
        form.resetFields();
        panel.close();
      } else {
        const errorMsg = result?.message || 'Failed to send invitation';
        message.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to send invitation';
      console.error('Invitation error:', errorMsg);
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
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
      permissions: defaultPermissions,
    });
  };

  // Handle select all for a module
  const handleSelectAllForModule = (moduleKey, selectAll) => {
    const module = permissionModules.find((m) => m.key === moduleKey);
    if (!module) return;

    const currentValues = form.getFieldsValue();
    const updatedPermissions = { ...currentValues.permissions };

    module.permissions.forEach((permission) => {
      updatedPermissions[permission] = selectAll;
    });

    form.setFieldsValue({
      ...currentValues,
      permissions: updatedPermissions,
    });
  };

  return (
    <div
      style={{
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
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Invite Team Member
        </Title>
        <Button type="text" onClick={handleCancel} icon={<CloseOutlined />} />
      </div>
      <Divider style={{ margin: '0 0 24px 0' }} />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          permissions: {},
          role: 'member',
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter member name' }]}
        >
          <Input placeholder="Enter member name" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter email address' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item name="role" label="Role">
          <Select onChange={handleRoleChange}>
            <Option value="member">Member</Option>
            <Option value="lead">Team Lead</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </Form.Item>

        <Divider orientation="left">Permissions</Divider>

        {/* Permissions Grid Header */}
        <Row
          gutter={[8, 8]}
          style={{
            marginBottom: '12px',
            fontWeight: 'bold',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '8px',
          }}
        >
          <Col span={8}>
            <Text strong>Module</Text>
          </Col>
          <Col span={4} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>
              All
            </Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>
              View
            </Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>
              Create
            </Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>
              Update
            </Text>
          </Col>
          <Col span={3} style={{ textAlign: 'center' }}>
            <Text strong style={{ fontSize: '11px' }}>
              Delete
            </Text>
          </Col>
        </Row>

        {/* Permissions Grid Rows */}
        {permissionModules.map((module) => (
          <Row
            key={module.key}
            gutter={[8, 8]}
            style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f5f5f5' }}
          >
            <Col span={8}>
              <Text style={{ fontSize: '12px', fontWeight: '500' }}>{module.key}</Text>
            </Col>
            <Col span={4} style={{ textAlign: 'center' }}>
              <Form.Item style={{ margin: 0 }}>
                <Checkbox
                  indeterminate={(() => {
                    const currentValues = form.getFieldsValue();
                    const checkedCount = module.permissions.filter(
                      (p) => currentValues.permissions?.[p]
                    ).length;
                    return checkedCount > 0 && checkedCount < module.permissions.length;
                  })()}
                  checked={(() => {
                    const currentValues = form.getFieldsValue();
                    return module.permissions.every((p) => currentValues.permissions?.[p]);
                  })()}
                  onChange={(e) => handleSelectAllForModule(module.key, e.target.checked)}
                />
              </Form.Item>
            </Col>
            {module.permissions.map((permission, index) => (
              <Col key={permission} span={3} style={{ textAlign: 'center' }}>
                <Form.Item
                  name={['permissions', permission]}
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Checkbox
                    onChange={(e) => {
                      const currentValues = form.getFieldsValue();
                      form.setFieldsValue({
                        ...currentValues,
                        permissions: {
                          ...currentValues.permissions,
                          [permission]: e.target.checked,
                        },
                      });
                    }}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>
        ))}

        {/* Quick Actions */}
        <Row
          gutter={[8, 8]}
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
          }}
        >
          <Col span={24}>
            <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
              Quick Actions:
            </Text>
          </Col>
          <Col span={8}>
            <Button
              size="small"
              onClick={() => {
                const allPermissions = getDefaultPermissions('admin');
                const currentValues = form.getFieldsValue();
                form.setFieldsValue({
                  ...currentValues,
                  permissions: allPermissions,
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
                  permissions: {},
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
                permissionModules.forEach((module) => {
                  const viewPermission = module.permissions.find((p) => p.includes('View'));
                  if (viewPermission) {
                    viewOnlyPermissions[viewPermission] = true;
                  }
                });
                const currentValues = form.getFieldsValue();
                form.setFieldsValue({
                  ...currentValues,
                  permissions: viewOnlyPermissions,
                });
              }}
            >
              View Only
            </Button>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Send Invitation
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default InviteMemberPanel;
