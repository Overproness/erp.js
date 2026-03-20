import React, { createContext, useContext } from 'react';

const ProfileContext = createContext<any>({});

export const ProfileContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <ProfileContext.Provider value={{}}>{children}</ProfileContext.Provider>;
};

export const useProfileContext = () => useContext(ProfileContext);
export default ProfileContext;
