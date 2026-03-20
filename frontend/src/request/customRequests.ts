import teamCustomRequests from './teamCustomRequests';

// Map of custom actions to their handler functions
const customActionHandlers = {
  inviteMember: teamCustomRequests.inviteMember,
  updateMember: teamCustomRequests.updateMember,
  removeMember: teamCustomRequests.removeMember,
};

export const handleCustomRequest = async ({ entity, customAction, jsonData }) => {
  if (customActionHandlers[customAction]) {
    return await customActionHandlers[customAction]({ entity, customAction, jsonData });
  } else {
    throw new Error(`Unknown custom action: ${customAction}`);
  }
};
