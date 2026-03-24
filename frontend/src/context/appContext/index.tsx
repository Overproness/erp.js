import React, { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext<any>({});

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentApp, setCurrentApp] = useState('default');
  const [isNavMenuClose, setIsNavMenuClose] = useState(false);

  const appContextAction = useMemo(
    () => ({
      app: {
        open: (appName: string) => setCurrentApp(appName),
        default: () => setCurrentApp('default'),
      },
      navMenu: {
        open: () => setIsNavMenuClose(false),
        close: () => setIsNavMenuClose(true),
        collapse: () => setIsNavMenuClose((prev) => !prev),
      },
    }),
    []
  );

  const state = useMemo(
    () => ({
      currentApp,
      isNavMenuClose,
    }),
    [currentApp, isNavMenuClose]
  );

  const value = useMemo(() => ({ state, appContextAction }), [state, appContextAction]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
