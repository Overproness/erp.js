import React, { createContext, useContext, useState } from 'react';

const ProfileContext = createContext<any>({});

export const ProfileContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const value = {
    state: {
      read: { isOpen: !isUpdateOpen },
      update: { isOpen: isUpdateOpen },
      passwordModal: { isOpen: isPasswordModalOpen },
    },
    profileContextAction: {
      updatePanel: {
        open: () => setIsUpdateOpen(true),
        close: () => setIsUpdateOpen(false),
      },
      modal: {
        open: () => setIsPasswordModalOpen(true),
        close: () => setIsPasswordModalOpen(false),
      },
    },
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfileContext = () => useContext(ProfileContext);
export default ProfileContext;
