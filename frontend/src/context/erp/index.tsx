import React, { createContext, useContext, useMemo, useState } from 'react';

const ErpContext = createContext<any>({});

export const ErpContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelConfig, setPanelConfig] = useState<any>({});

  const state = useMemo(
    () => ({
      deleteModal: { isOpen: deleteModalOpen },
      panel: { isOpen: panelOpen, config: panelConfig },
    }),
    [deleteModalOpen, panelOpen, panelConfig]
  );

  const erpContextAction = useMemo(
    () => ({
      modal: {
        open: () => setDeleteModalOpen(true),
        close: () => setDeleteModalOpen(false),
      },
      panel: {
        open: (config?: any) => {
          setPanelOpen(true);
          if (config) setPanelConfig(config);
        },
        close: () => setPanelOpen(false),
      },
      collapsedBox: {
        open: () => {},
        close: () => {},
      },
      readBox: {
        open: () => {},
        close: () => {},
      },
    }),
    []
  );

  const value = useMemo(() => ({ state, erpContextAction }), [state, erpContextAction]);

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
};

export const useErpContext = () => useContext(ErpContext);
export default ErpContext;
