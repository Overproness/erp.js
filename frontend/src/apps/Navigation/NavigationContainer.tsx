import { Button, Drawer } from 'antd';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '@/context/appContext';
import { usePermissions } from '@/hooks/usePermissions';

import useLanguage from '@/locale/useLanguage';

import useResponsive from '@/hooks/useResponsive';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import IconSidebar from './IconSidebar';

import { N8N_URL } from '@/config/serverApiConfig';
import {
  ApartmentOutlined,
  BankOutlined,
  CalendarOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  CheckSquareOutlined,
  ContainerOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  FileOutlined,
  FileSyncOutlined,
  FundOutlined,
  LinkOutlined,
  MenuOutlined,
  MessageOutlined,
  NodeIndexOutlined,
  ReconciliationOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  StarOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';

export default function Navigation() {
  const { isMobile } = useResponsive();
  // Use the new IconSidebar for desktop, old MobileSidebar for mobile
  return isMobile ? <MobileSidebar /> : <IconSidebar />;
}

// Export old sidebar as well for backward compatibility
export function NavigationOld() {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;

  // Always call hooks in the same order
  const {
    hasPermission,
    hasAnyPermission,
    isOwner,
    loading: permissionsLoading,
  } = usePermissions();
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));

  const translate = useLanguage();
  const navigate = useNavigate();
  const currentAdmin = useSelector(selectCurrentAdmin);

  // Dropdown state for each parent menu
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredKey, setHoveredKey] = useState(null);

  const handleDropdownToggle = (key, e) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === key ? null : key);
  };

  // Helper for Tailwind classes based on state
  const getMenuItemClass = (active, isDropdown = false) =>
    `flex items-center w-full rounded-lg mb-1 px-4 h-11 font-bold text-base transition-all duration-200 cursor-pointer
    ${
      active
        ? 'bg-[#eaf4ff] text-[#1e3a8a]'
        : 'bg-white text-[#1e3a8a] hover:bg-[#eaf4ff] hover:text-[#1e3a8a] focus:bg-[#dbeafe] focus:text-[#1e3a8a]'
    } 
    focus:outline-none ${isDropdown ? 'justify-between' : ''}`;

  const getIconClass = (active, hovered = false) =>
    `flex-shrink-0 w-6 h-6 mr-3 text-lg transition-all duration-200 flex items-center justify-center
    ${active || hovered ? 'text-[#1e3a8a]' : 'text-[#64748b]'}`;

  // Submenu icons for different categories
  const crmSubIcons = [
    <CustomerServiceOutlined key="customers" />,
    <FileSyncOutlined key="quotes" />,
    <ContainerOutlined key="invoices" />,
    <CreditCardOutlined key="payments" />,
    <WalletOutlined key="payment-methods" />,
  ];

  const marketingSubIcons = [
    <FundOutlined key="campaigns" />,
    <NodeIndexOutlined key="behavior" />,
    <ReconciliationOutlined key="retargeting" />,
    <SendOutlined key="social-media" />,
    <StarOutlined key="reputation" />,
  ];

  const workflowSubIcons = [
    <DeploymentUnitOutlined key="workflows" />,
    <CheckSquareOutlined key="tasks" />,
  ];

  const businessProcessSubIcons = [
    <CalendarOutlined key="appointments" />,
    <ApartmentOutlined key="processes" />,
    <CheckSquareOutlined key="task-tracking" />,
  ];

  const teamSettingsSubIcons = [<TeamOutlined key="team" />, <SettingOutlined key="settings" />];

  // Get submenu icons based on parent menu key
  const getSubMenuIcons = (parentKey) => {
    switch (parentKey) {
      case 'crm':
        return crmSubIcons;
      case 'marketing':
        return marketingSubIcons;
      case 'workflows-tasks':
        return workflowSubIcons;
      case 'business-process-automation':
        return businessProcessSubIcons;
      case 'team-settings':
        return teamSettingsSubIcons;
      default:
        return [];
    }
  };

  // Permission checker for menu items
  const checkPermission = (requiredPermissions) => {
    if (isOwner) return true;
    if (!requiredPermissions) return true;

    if (Array.isArray(requiredPermissions)) {
      return hasAnyPermission(requiredPermissions);
    }
    return hasPermission(requiredPermissions);
  };

  // Filter menu items based on permissions
  const filterItemsByPermissions = (items) => {
    if (permissionsLoading) return [];

    return items.filter((item) => {
      // Check main item permission
      if (!checkPermission(item.permissions)) {
        return false;
      }

      // If item has children, filter them too
      if (item.children) {
        item.children = item.children.filter((child) => checkPermission(child.permissions));
        // Hide parent if no children are accessible
        return item.children.length > 0;
      }

      return true;
    });
  };

  // Render menu items and dropdowns
  const renderMenuItems = (itemsArr) => (
    <ul className="w-full">
      {itemsArr.map((item) => {
        const active =
          currentPath === item.key ||
          (item.children && item.children.some((sub) => currentPath === sub.key));

        if (item.children) {
          const isOpen = openDropdown === item.key;
          return (
            <li key={item.key} className="w-full flex flex-col">
              <div
                className={
                  getMenuItemClass(active, true) + ' flex items-center min-w-0 w-full relative'
                }
                style={{
                  textDecoration: 'none',
                  paddingRight: '4px',
                  paddingLeft: '4px',
                  boxSizing: 'border-box',
                  gap: '0.5rem',
                  width: '100%',
                  maxWidth: '100%',
                  height: '40px',
                }}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <Link
                  to={item.linkpath}
                  className={`flex items-center flex-1 min-w-0 w-full ${
                    active ? 'text-[#1e3a8a] !important' : ''
                  }`}
                  style={{
                    textDecoration: 'none',
                    color: active ? '#1e3a8a' : '#1F2937',
                    fontWeight: 'bold',
                    width: '100%',
                    maxWidth: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '15px',
                    height: '40px',
                  }}
                  onClick={() => setCurrentPath(item.key)}
                >
                  <span
                    className={getIconClass(
                      active,
                      hoveredKey === item.key,
                      active || hoveredKey === item.key ? 'text-[#1e3a8a]' : 'text-[#64748b]'
                    )}
                    style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="flex-1 text-left"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '15px',
                    }}
                  >
                    {translate(item.key.charAt(0).toUpperCase() + item.key.slice(1))}
                  </span>
                </Link>
                <span
                  className={`flex items-center cursor-pointer ${
                    active || hoveredKey === item.key ? 'text-[#1e3a8a]' : 'text-[#64748b]'
                  } bg-transparent absolute right-2`}
                  onClick={(e) => {
                    handleDropdownToggle(item.key, e);
                  }}
                  tabIndex={0}
                  role="button"
                  style={{
                    minWidth: '24px',
                    alignSelf: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    height: '40px',
                    top: 0,
                    bottom: 0,
                  }}
                >
                  {isOpen ? (
                    <CaretUpOutlined className="text-base" />
                  ) : (
                    <CaretDownOutlined className="text-base" />
                  )}
                </span>
              </div>
              {isOpen && (
                <ul className="w-full">
                  {item.children.map((sub, idx) => {
                    const subMenuIcons = getSubMenuIcons(item.key);
                    return (
                      <li key={sub.key} className="w-full flex flex-col">
                        <div
                          className={
                            getMenuItemClass(currentPath === sub.key, false) +
                            ' flex items-center min-w-0 w-full'
                          }
                          style={{
                            textDecoration: 'none',
                            paddingRight: '12px',
                            paddingLeft: '24px',
                            boxSizing: 'border-box',
                            gap: '0.5rem',
                            width: '100%',
                            maxWidth: '100%',
                            height: '28px', // reduced height for sub menu
                            fontSize: '13px',
                            background: currentPath === sub.key ? '#dbeafe' : '#fff',
                          }}
                          onMouseEnter={() => setHoveredKey(sub.key)}
                          onMouseLeave={() => setHoveredKey(null)}
                        >
                          <Link
                            to={sub.linkpath}
                            className={`flex items-center flex-1 min-w-0 w-full`}
                            style={{
                              textDecoration: 'none',
                              color: currentPath === sub.key ? '#1e3a8a' : '#1F2937',
                              fontWeight: 'normal',
                              width: '100%',
                              maxWidth: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '13px',
                              height: '28px', // reduced height for sub menu
                            }}
                            onClick={() => setCurrentPath(sub.key)}
                          >
                            <span
                              className={getIconClass(
                                currentPath === sub.key,
                                hoveredKey === sub.key,
                                currentPath === sub.key || hoveredKey === sub.key
                                  ? 'text-[#1e3a8a]'
                                  : 'text-[#64748b]'
                              )}
                              style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}
                            >
                              {subMenuIcons[idx] || <FundOutlined />}
                            </span>
                            <span
                              className="flex-1 text-left"
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '13px',
                              }}
                            >
                              {sub.label.props?.children || sub.label}
                            </span>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        }

        return (
          <li key={item.key} className="w-full flex flex-col">
            <div
              className={getMenuItemClass(active) + ' flex items-center min-w-0 w-full'}
              style={{
                textDecoration: 'none',
                paddingRight: '4px',
                paddingLeft: '4px',
                boxSizing: 'border-box',
                gap: '0.5rem',
                width: '100%',
                maxWidth: '100%',
                height: '40px',
              }}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              <Link
                to={item.linkpath}
                className={`flex items-center flex-1 min-w-0 w-full ${
                  active ? 'text-[#1e3a8a] !important' : ''
                }`}
                style={{
                  textDecoration: 'none',
                  color: active ? '#1e3a8a' : '#1F2937',
                  fontWeight: 'bold',
                  width: '100%',
                  maxWidth: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '15px',
                  height: '40px',
                }}
                onClick={() => setCurrentPath(item.key)}
              >
                <span
                  className={getIconClass(
                    active,
                    hoveredKey === item.key,
                    active || hoveredKey === item.key ? 'text-[#1e3a8a]' : 'text-[#64748b]'
                  )}
                  style={{ display: 'flex', alignItems: 'center', fontSize: '18px' }}
                >
                  {item.icon}
                </span>
                <span
                  className="flex-1 text-left"
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '15px',
                  }}
                >
                  {item.label.props?.children || item.label}
                </span>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );

  // Define the menu items array
  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: (
        <Link to={'/'} className={getMenuItemClass(currentPath === 'dashboard')}>
          {translate('Dashboard')}
        </Link>
      ),
      linkpath: '/',
    },
    {
      key: 'CRM',
      icon: <BankOutlined />,
      label: (
        <span
          className={getMenuItemClass(
            currentPath === 'crm' ||
              currentPath.startsWith('crm-') ||
              ['customer', 'quote', 'invoice', 'payment', 'paymentMode'].includes(currentPath)
          )}
        >
          {translate('CRM (Customers & Sales)')}
        </span>
      ),
      linkpath: '/client',
      permissions: ['customer:read'],
      children: [
        {
          key: 'customer',
          label: (
            <Link to={'/client'} className={getMenuItemClass(currentPath === 'customer')}>
              {translate('Customers')}
            </Link>
          ),
          linkpath: '/client',
          permissions: ['customer:read'],
        },
        {
          key: 'quote',
          label: (
            <Link to={'/quote'} className={getMenuItemClass(currentPath === 'quote')}>
              {translate('Quotes')}
            </Link>
          ),
          linkpath: '/quote',
          permissions: ['quote:read'],
        },
        {
          key: 'invoice',
          label: (
            <Link to={'/invoice'} className={getMenuItemClass(currentPath === 'invoice')}>
              {translate('Invoices')}
            </Link>
          ),
          linkpath: '/invoice',
          permissions: ['invoice:read'],
        },
        {
          key: 'payment',
          label: (
            <Link to={'/payment'} className={getMenuItemClass(currentPath === 'payment')}>
              {translate('Payments')}
            </Link>
          ),
          linkpath: '/payment',
          permissions: ['payment:read'],
        },
        {
          key: 'paymentMode',
          label: (
            <Link to={'/payment/mode'} className={getMenuItemClass(currentPath === 'paymentMode')}>
              {translate('Payment Methods')}
            </Link>
          ),
          linkpath: '/payment/mode',
          permissions: ['payment:read'],
        },
      ],
    },
    {
      key: 'marketing',
      icon: <FundOutlined />,
      label: (
        <span
          className={getMenuItemClass(
            currentPath === 'marketing' ||
              currentPath.startsWith('marketing-') ||
              ['social-media', 'reputation'].includes(currentPath)
          )}
        >
          {translate('Marketing & Reputation')}
        </span>
      ),
      linkpath: '/marketing',
      permissions: ['marketing:read'],
      children: [
        {
          key: 'marketing-campaigns',
          label: (
            <Link
              to={'/marketing'}
              className={getMenuItemClass(currentPath === 'marketing-campaigns')}
            >
              {translate('Campaigns')}
            </Link>
          ),
          linkpath: '/marketing',
          permissions: ['marketing:read'],
        },
        {
          key: 'marketing-behavior',
          label: (
            <Link
              to={'/marketing/behavior-triggers'}
              className={getMenuItemClass(currentPath === 'marketing-behavior')}
            >
              {translate('Behavior Triggers')}
            </Link>
          ),
          linkpath: '/marketing/behavior-triggers',
          permissions: ['marketing:read'],
        },
        {
          key: 'marketing-retargeting',
          label: (
            <Link
              to={'/marketing/audiences'}
              className={getMenuItemClass(currentPath === 'marketing-retargeting')}
            >
              {translate('Retargeting')}
            </Link>
          ),
          linkpath: '/marketing/audiences',
          permissions: ['marketing:read'],
        },
        {
          key: 'social-media',
          label: (
            <Link to={'/social-media'} className={getMenuItemClass(currentPath === 'social-media')}>
              {translate('Social Media')}
            </Link>
          ),
          linkpath: '/social-media',
          permissions: ['social:read'],
        },
        {
          key: 'reputation',
          label: (
            <Link to={'/reputation'} className={getMenuItemClass(currentPath === 'reputation')}>
              {translate('Reputation')}
            </Link>
          ),
          linkpath: '/reputation',
          permissions: ['reputation:read'],
        },
        {
          key: 'survey',
          label: (
            <Link to={'/survey'} className={getMenuItemClass(currentPath === 'survey')}>
              {translate('Customer Surveys')}
            </Link>
          ),
          linkpath: '/survey',
          permissions: ['survey:read'],
        },
      ],
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: (
        <Link to={'/chat'} className={getMenuItemClass(currentPath === 'chat')}>
          {translate('Chat')}
        </Link>
      ),
      linkpath: '/chat',
    },
    {
      key: 'ai-assistant',
      icon: <RobotOutlined />,
      label: (
        <Link to={'/ai-assistant'} className={getMenuItemClass(currentPath === 'ai-assistant')}>
          {translate('AI Assistant')}
        </Link>
      ),
      linkpath: '/ai-assistant',
      permissions: ['ai:read'],
    },
    {
      key: 'url',
      icon: <LinkOutlined />,
      label: (
        <Link to={'/url'} className={getMenuItemClass(currentPath === 'url')}>
          {translate('URL')}
        </Link>
      ),
      linkpath: '/url',
      permissions: ['url:read'],
    },
    {
      key: 'document',
      icon: <FileOutlined />,
      label: (
        <Link to={'/document'} className={getMenuItemClass(currentPath === 'document')}>
          {translate('Documents')}
        </Link>
      ),
      linkpath: '/document',
      permissions: ['document:read'],
    },
    {
      key: 'taxes',
      label: (
        <Link to={'/taxes'} className={getMenuItemClass(currentPath === 'taxes')}>
          {translate('Taxes')}
        </Link>
      ),
      icon: <ShopOutlined />,
      linkpath: '/taxes',
      permissions: ['settings:read'],
    },
    {
      key: 'Workflow & Tasks',
      icon: <DeploymentUnitOutlined />,
      label: (
        <span
          className={getMenuItemClass(
            currentPath === 'workflows-tasks' || ['workflow', 'tasks'].includes(currentPath)
          )}
        >
          {translate('Workflow & Tasks')}
        </span>
      ),
      linkpath: '/workflow',
      permissions: ['workflow:read'],
      children: [
        {
          key: 'workflow',
          label: (
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={() => {
                const companyId = currentAdmin?._id;
                if (companyId) {
                  window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
                }
              }}
              style={{
                backgroundColor: '#7ED957',
                borderColor: '#7ED957',
                color: '#fff',
                width: '100%',
                height: '28px',
                fontSize: '13px',
              }}
            >
              {translate('Workflows')}
            </Button>
          ),
          linkpath: '#',
          permissions: ['workflow:read'],
        },
        {
          key: 'tasks',
          label: (
            <Link to={'/tasks'} className={getMenuItemClass(currentPath === 'tasks')}>
              {translate('Tasks')}
            </Link>
          ),
          linkpath: '/tasks',
          permissions: ['task:read'],
        },
      ],
    },
    {
      key: 'business-process-automation',
      icon: <ApartmentOutlined />,
      label: (
        <span
          className={getMenuItemClass(
            currentPath === 'business-process-automation' ||
              ['appointments', 'business-processes', 'task-tracking'].includes(currentPath)
          )}
        >
          {translate('Business Process Automation')}
        </span>
      ),
      linkpath: '/appointments',
      permissions: ['workflow:read'],
      children: [
        {
          key: 'appointments',
          label: (
            <Link to={'/appointments'} className={getMenuItemClass(currentPath === 'appointments')}>
              {translate('Appointments')}
            </Link>
          ),
          linkpath: '/appointments',
          permissions: ['workflow:read'],
        },
        {
          key: 'business-processes',
          label: (
            <Link
              to={'/business-processes'}
              className={getMenuItemClass(currentPath === 'business-processes')}
            >
              {translate('Business Processes')}
            </Link>
          ),
          linkpath: '/business-processes',
          permissions: ['workflow:read'],
        },
        {
          key: 'task-tracking',
          label: (
            <Link
              to={'/task-tracking'}
              className={getMenuItemClass(currentPath === 'task-tracking')}
            >
              {translate('Task Tracking')}
            </Link>
          ),
          linkpath: '/task-tracking',
          permissions: ['task:read'],
        },
      ],
    },
    {
      key: 'Team & Settings',
      icon: <UsergroupAddOutlined />,
      label: (
        <span
          className={getMenuItemClass(
            currentPath === 'team-settings' || ['team', 'generalSettings'].includes(currentPath)
          )}
        >
          {translate('Team & Settings')}
        </span>
      ),
      linkpath: '/team',
      permissions: ['team:read'],
      children: [
        {
          key: 'team',
          label: (
            <Link to={'/team'} className={getMenuItemClass(currentPath === 'team')}>
              {translate('Team')}
            </Link>
          ),
          linkpath: '/team',
          permissions: ['team:read'],
        },
        {
          key: 'generalSettings',
          label: (
            <Link to={'/settings'} className={getMenuItemClass(currentPath === 'generalSettings')}>
              {translate('Settings')}
            </Link>
          ),
          linkpath: '/settings',
          permissions: ['settings:read'],
        },
      ],
    },
    {
      key: 'subscription',
      icon: <BankOutlined />,
      label: (
        <Link to={'/subscription'} className={getMenuItemClass(currentPath === 'subscription')}>
          {translate('Subscription')}
        </Link>
      ),
      linkpath: '/subscription',
    },
  ];

  // Filter items based on permissions
  const filteredItems = filterItemsByPermissions(items);

  useEffect(() => {
    if (location)
      if (currentPath !== location.pathname) {
        if (location.pathname === '/') {
          setCurrentPath('dashboard');
        } else {
          const path = location.pathname.slice(1);
          // Handle special route mappings for menu highlighting
          if (path === 'client' || path.startsWith('client/')) {
            setCurrentPath('customer');
          } else if (path === 'payment/mode' || path.startsWith('payment/mode')) {
            setCurrentPath('paymentMode');
          } else if (path === 'settings' || path.startsWith('settings/')) {
            setCurrentPath('generalSettings');
          } else if (path === 'chat' || path.startsWith('chat/')) {
            setCurrentPath('chat');
          } else if (path === 'marketing' || path.startsWith('marketing/')) {
            // Handle marketing submenu items
            if (path === 'marketing/behavior-triggers') {
              setCurrentPath('marketing-behavior');
            } else if (path === 'marketing/audiences') {
              setCurrentPath('marketing-retargeting');
            } else if (path === 'marketing') {
              setCurrentPath('marketing-campaigns');
            } else {
              setCurrentPath('marketing');
            }
          } else if (path === 'social-media' || path.startsWith('social-media/')) {
            setCurrentPath('social-media');
          } else if (path === 'reputation' || path.startsWith('reputation/')) {
            setCurrentPath('reputation');
          } else if (path === 'workflow' || path.startsWith('workflow/')) {
            setCurrentPath('workflow');
          } else if (path === 'tasks' || path.startsWith('tasks/')) {
            setCurrentPath('tasks');
          } else if (path === 'team' || path.startsWith('team/')) {
            setCurrentPath('team');
          } else {
            // Handle other base paths
            const basePath = path.split('/')[0];
            setCurrentPath(basePath);
          }
        }
      }
  }, [location, currentPath]);

  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(isNavMenuClose);
    }
    const timer = setTimeout(() => {
      if (!isNavMenuClose) {
        setLogoApp(isNavMenuClose);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isNavMenuClose]);

  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <aside
      className={`bg-white border-r border-gray-200 shadow`}
      style={{
        height: 'calc(100vh - 70px)',
        position: 'fixed',
        left: 0,
        bottom: 0,
        top: 70,
        zIndex: 1001,
        background: '#ffffff',
        borderRight: '1px solid #e8e8e8',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav className="flex-1 h-full overflow-y-auto py-4 px-4 w-full custom-scrollbar box-border">
        {permissionsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div>Loading menu...</div>
          </div>
        ) : (
          renderMenuItems(filteredItems)
        )}
      </nav>
      <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #ffffff;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #dbeafe !important;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #bfdbfe !important;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:active {
            background: #93c5fd !important;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #dbeafe #ffffff;
          }
      `}</style>
    </aside>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="ml-6 text-[#1e3a8a] rounded-xl bg-[#eaf4ff] border border-[#1e3a8a] transition-all"
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={280}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
        styles={{
          body: {
            padding: 0,
            background: '#ffffff',
          },
        }}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
