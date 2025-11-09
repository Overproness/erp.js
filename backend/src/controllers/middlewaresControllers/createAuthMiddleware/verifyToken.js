const verifyToken = async (req, res) => {
    return res.status(200).json({
      success: true,
      result: {
        user: req.user || req.companyOwner,
        isUser: !!req.user,
      },
      message: 'Token is valid',
    });
}

module.exports = verifyToken;