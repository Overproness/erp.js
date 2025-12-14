const create = require('./create');
const read = require('./read');
const update = require('./update');
const remove = require('./remove');
const list = require('./list');
const deleteTeam = require('./delete');
const search = require('./search');
const filter = require('./filter');
const summary = require('./summary');
const inviteMember = require('./inviteMember');
const acceptInvitation = require('./acceptInvitation');
const getInvitationDetails = require('./getInvitationDetails');
const listMembers = require('./listMembers');
const updateMember = require('./updateMember');
const removeMember = require('./removeMember');
const getMemberPerformance = require('./getMemberPerformance');

const teamController = {
  create,
  read,
  update,
  remove,
  delete: deleteTeam,
  list,
  search,
  filter,
  summary,
  inviteMember,
  acceptInvitation,
  getInvitationDetails,
  listMembers,
  updateMember,
  removeMember,
  getMemberPerformance,
};

module.exports = teamController;
