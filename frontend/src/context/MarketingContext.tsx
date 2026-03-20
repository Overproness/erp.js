import React, { createContext, useContext } from 'react';

const MarketingContext = createContext<any>({});

export const MarketingContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <MarketingContext.Provider value={{}}>{children}</MarketingContext.Provider>;
};

export const MarketingProvider = MarketingContextProvider;

export const useMarketingContext = () => useContext(MarketingContext);
export { MarketingContext };
export default MarketingContext;
