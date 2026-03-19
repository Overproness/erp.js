import { createContext, useContext, useMemo, useReducer } from 'react';
import contextActions from './actions';
import { contextReducer, initialState } from './reducer';
import contextSelectors from './selectors';

const CrudContext = createContext();

function CrudContextProvider({ children }) {
  const [state, dispatch] = useReducer(contextReducer, initialState);
  const value = useMemo(() => [state, dispatch], [state]);

  return <CrudContext.Provider value={value}>{children}</CrudContext.Provider>;
}

function useCrudContext() {
  const context = useContext(CrudContext);
  if (context === undefined) {
    throw new Error('useCrudContext must be used within a CrudContextProvider');
  }
  const [state, dispatch] = context;
  const crudContextAction = contextActions(dispatch);
  const crudContextSelector = contextSelectors(state);
  return { state, crudContextAction, crudContextSelector };
}

export { CrudContext, CrudContextProvider, useCrudContext };
