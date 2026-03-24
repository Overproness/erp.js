import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CrudContext = createContext<any>({});

export const CrudContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPanelClose, setIsPanelClose] = useState(true);
  const [isBoxCollapsed, setIsBoxCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadBoxOpen, setIsReadBoxOpen] = useState(false);
  const [isEditBoxOpen, setIsEditBoxOpen] = useState(false);
  const [isAdvancedBoxOpen, setIsAdvancedBoxOpen] = useState(false);

  const state = useMemo(
    () => ({
      isPanelClose,
      isBoxCollapsed,
      isModalOpen,
      isReadBoxOpen,
      isEditBoxOpen,
      isAdvancedBoxOpen,
    }),
    [isPanelClose, isBoxCollapsed, isModalOpen, isReadBoxOpen, isEditBoxOpen, isAdvancedBoxOpen]
  );

  const crudContextAction = useMemo(
    () => ({
      panel: {
        open: () => setIsPanelClose(false),
        close: () => setIsPanelClose(true),
      },
      collapsedBox: {
        open: () => setIsBoxCollapsed(true),
        close: () => setIsBoxCollapsed(false),
      },
      modal: {
        open: () => setIsModalOpen(true),
        close: () => setIsModalOpen(false),
      },
      readBox: {
        open: () => setIsReadBoxOpen(true),
        close: () => setIsReadBoxOpen(false),
      },
      editBox: {
        open: () => setIsEditBoxOpen(true),
        close: () => setIsEditBoxOpen(false),
      },
      advancedBox: {
        open: () => setIsAdvancedBoxOpen(true),
        close: () => setIsAdvancedBoxOpen(false),
      },
    }),
    []
  );

  const value = useMemo(() => ({ state, crudContextAction }), [state, crudContextAction]);

  return <CrudContext.Provider value={value}>{children}</CrudContext.Provider>;
};

export const useCrudContext = () => useContext(CrudContext);
export { CrudContext };
export default CrudContext;
