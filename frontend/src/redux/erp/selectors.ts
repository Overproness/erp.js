import { createSelector } from 'reselect';

// Base selectors
const selectErp = (state) => state.erp;

// List selectors
export const selectCurrentItem = createSelector([selectErp], (erp) => erp.current);
export const selectListItems = createSelector([selectErp], (erp) => erp.list);
export const selectItemById = (itemId) =>
  createSelector(selectListItems, (list) => list.result.items.find((item) => item._id === itemId));

// Loading state selectors
export const selectListState = createSelector([selectErp], (erp) => erp.list);
export const selectReadState = createSelector([selectErp], (erp) => erp.read);
export const selectReadItem = createSelector([selectErp], (erp) => erp.read); // Added missing export for compatibility
export const selectUpdateState = createSelector([selectErp], (erp) => erp.update);
export const selectUpdatedItem = createSelector([selectErp], (erp) => erp.update); // Added missing selector
export const selectDeleteState = createSelector([selectErp], (erp) => erp.delete);
export const selectSearchState = createSelector([selectErp], (erp) => erp.search);
export const selectAdvancedSearchState = createSelector([selectErp], (erp) => erp.advancedSearch);

// Create item selectors
export const selectCreatedItem = createSelector([selectErp], (erp) => erp.create);
export const selectCreateState = createSelector([selectErp], (erp) => erp.create);
export const selectDeletedItem = createSelector(
  [selectErp],
  (erp) =>
    erp.delete || {
      current: null,
      isLoading: false,
      isSuccess: false,
    }
);

// Document-specific selectors
export const selectDocumentCompliance = createSelector([selectErp], (erp) => erp.compliance || {});
export const selectDocumentAuditTrail = createSelector(
  [selectErp],
  (erp) => erp.auditTrail || { result: [], isLoading: false, pagination: {} }
);
export const selectDocumentVersions = createSelector(
  [selectErp],
  (erp) => erp.versions || { items: [], isLoading: false, pagination: {} }
);
export const selectDocumentContent = createSelector(
  [selectErp],
  (erp) => erp.documentContent || { content: null, isLoading: false }
);
export const selectDownloadState = createSelector(
  [selectErp],
  (erp) => erp.download || { isLoading: false, success: false }
);
export const selectRevertState = createSelector(
  [selectErp],
  (erp) => erp.revert || { isLoading: false, success: false }
);

// Add missing selectors
export const selectMailItem = createSelector([selectErp], (erp) => erp.mail);
// export const selectUpdatedItem = createSelector([selectErp], (erp) => erp.update);
// export const selectReadItem = createSelector([selectErp], (erp) => erp.read);
export const selectRecordPaymentItem = createSelector([selectErp], (erp) => erp.recordPayment);

// General selectors
export const selectSummaryState = createSelector([selectErp], (erp) => erp.summary);
export const selectRecordPaymentState = createSelector([selectErp], (erp) => erp.recordPayment);
export const selectAnalysisState = (state) => state.erp.analysis;
