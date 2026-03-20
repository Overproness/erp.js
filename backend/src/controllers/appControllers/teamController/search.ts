// @ts-nocheck
const Team = require('@/models/appModels/Team');

const search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const requesterCompanyID = req.companyOwner?.companyID || req.user?.companyID;
    const teams = await Team.find({
      $and: [
        { companyID: requesterCompanyID },
        { removed: false },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    })
      .populate('owner', 'name email')
      .populate('teamLead', 'name email')
      .populate('members', 'name email role')
      .sort({ created: -1 });

    return res.status(200).json({
      success: true,
      result: teams,
      message: 'Teams retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while searching teams',
      error: error.message,
    });
  }
};

module.exports = search;
