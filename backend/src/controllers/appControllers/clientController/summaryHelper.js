// Helper functions for client summary
module.exports = {
  // Creates a default summary object for test mode
  createDefaultSummary: () => ({
    new: 0,
    active: 0,
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    segments: {
      new: 0,
      regular: 0,
      loyal: 0,
      vip: 0,
    },
    trends: {
      newClientsThisMonth: 0,
      newClientsLastMonth: 0,
      clientGrowth: 0,
    },
    revenueBySegment: {
      new: 0,
      regular: 0,
      loyal: 0,
      vip: 0,
    },
  }),
};
