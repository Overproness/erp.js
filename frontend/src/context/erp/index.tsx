import React, { createContext, useContext } from 'react';

const ErpContext = createContext<any>({});

export const ErpContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <ErpContext.Provider value={{}}>{children}</ErpContext.Provider>;
};

export const useErpContext = () => useContext(ErpContext);
export default ErpContext;
