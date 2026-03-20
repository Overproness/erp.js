import React, { createContext, useContext } from 'react';

const CrudContext = createContext<any>({});

export const CrudContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <CrudContext.Provider value={{}}>{children}</CrudContext.Provider>;
};

export const useCrudContext = () => useContext(CrudContext);
export { CrudContext };
export default CrudContext;
