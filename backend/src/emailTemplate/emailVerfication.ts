exports.passwordVerfication = ({ name, link }: { name?: string; link: string }) => {
  return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Hello ${name || 'there'},</p>
      <p>You have requested to reset your password. Please click on the link below to set a new password:</p>
      <p>
        <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 30 minutes.</p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <p>Best regards,<br/>Your Application Team</p>
    </div>
  `;
};
