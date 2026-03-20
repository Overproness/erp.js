import React, { lazy, Suspense } from 'react';
import { useErpContext } from '@/context/erp';
import { TEAM_ENTITY } from './TeamDataTableModule/config';

const InviteMemberPanel = lazy(() => import('./components/InviteMemberPanel'));
const EditMemberPanel = lazy(() => import('./components/EditMemberPanel'));

const Loading = () => (
  <div className="suspense-loading">Loading...</div>
);

export default function TeamPanelProvider({ children }) {
  const { state: contextState, erpContextAction } = useErpContext();
  const { panel = { isOpen: false, config: {} } } = contextState || {};
  const { config = {} } = panel || {};
  const { entity = null, mode = null } = config || {};  return (
    <>      {entity === TEAM_ENTITY && mode === 'invite' && panel.isOpen && (
        <div className="erp-panel-container" style={{ 
          position: 'fixed', 
          right: 0,
          top: 0,
          height: '100vh',
          width: '450px',
          backgroundColor: '#fff',
          boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1050,
          overflow: 'auto',
          padding: 0,
          margin: 0
        }}>
          <Suspense fallback={<Loading />}>
            <InviteMemberPanel config={config} />
          </Suspense>
        </div>
      )}      {entity === TEAM_ENTITY && mode === 'editMember' && panel.isOpen && (
        <div className="erp-panel-container" style={{ 
          position: 'fixed', 
          right: 0,
          top: 0,
          height: '100vh',
          width: '450px',
          backgroundColor: '#fff',
          boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1050,
          overflow: 'auto',
          padding: 0,
          margin: 0
        }}>
          <Suspense fallback={<Loading />}>
            <EditMemberPanel config={config} />
          </Suspense>
        </div>
      )}
      {children}
    </>
  );
}
