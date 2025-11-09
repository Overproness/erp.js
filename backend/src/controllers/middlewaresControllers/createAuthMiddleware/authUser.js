const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);

  if (!isMatch)
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid credentials.',
    });

  if (isMatch === true) {
    const isUser = !(req.body.userType === 'CompanyOwner' || user.role === 'owner');
    const token = jwt.sign(
      {
        id: user._id,
        ...(isUser ? { isUser: true } : {}),
      },
      process.env.JWT_SECRET,
      { expiresIn: req.body.remember ? 365 * 24 + 'h' : '24h' }
    );

    // Only update loggedSessions if UserPasswordModel exists
    if (UserPasswordModel) {
      await UserPasswordModel.findOneAndUpdate(
        { user: user._id },
        { $push: { loggedSessions: token } },
        {
          new: true,
        }
      ).exec();
    }

    res.status(200).json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role: user.role,
        email: user.email,
        photo: user.photo,
        maxAge: req.body.remember ? 365 : null,
        // Only include onboardingComplete for CompanyOwner
        ...(req.body.userType === 'CompanyOwner' || (user.role === 'owner')
          ? { onboardingComplete: user.onboardingComplete === true }
          : {}),
        token: token, // Token inside result object for test compatibility
      },
      token: token, // Token at top level for backward compatibility
      message: 'Successfully login user',
    });
  } else {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid credentials.',
    });
  }
};

module.exports = authUser;