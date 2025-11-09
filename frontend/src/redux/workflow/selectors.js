import { createSelector } from 'reselect';

// Base selector
const selectWorkflowState = (state) => state.workflow;

// List selectors
export const selectWorkflows = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.list.items
);

export const selectWorkflowsPagination = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.list.pagination
);

export const selectWorkflowsLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.list.isLoading
);

// Current workflow selectors
export const selectCurrentWorkflow = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.current.item
);

export const selectCurrentWorkflowLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.current.isLoading
);

// Create selectors
export const selectCreateWorkflowLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.create.isLoading
);

export const selectCreateWorkflowSuccess = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.create.success
);

// Update selectors
export const selectUpdateWorkflowLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.update.isLoading
);

export const selectUpdateWorkflowSuccess = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.update.success
);

// Delete selectors
export const selectDeleteWorkflowLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.delete.isLoading
);

export const selectDeleteWorkflowSuccess = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.delete.success
);

// Toggle status selectors
export const selectToggleWorkflowLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.toggle.isLoading
);

export const selectToggleWorkflowSuccess = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.toggle.success
);

// Test condition selectors
export const selectTestConditionResult = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.testCondition.result
);

export const selectTestConditionLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.testCondition.isLoading
);

// Simulation selectors
export const selectSimulationResult = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.simulation.result
);

export const selectSimulationLoading = createSelector(
  [selectWorkflowState],
  (workflow) => workflow.simulation.isLoading
);
