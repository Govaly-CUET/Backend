const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

const sendStaffOtpEmail = async (email, otp, role, purpose) => {
  const roleName = role === 'admin' ? 'Admin' : 'Seller';
  const subject = `Govaly ${roleName} Password Reset Code`;

  await transporter.sendMail({
    from: `Govaly ${roleName} <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject,
    text: `Your Govaly ${roleName.toLowerCase()} password reset code is ${otp}. It expires in 30 minutes. Do not share this code.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <body style="margin:0;padding:0;background:#ed1760;font-family:Arial,Helvetica,sans-serif;color:#222">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ed1760;padding:36px 12px">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
                <tr><td style="padding:8px 42px 28px;color:#fff">
                  <div style="font-size:42px;line-height:44px;font-weight:700">Govaly</div>
                  <div style="font-size:13px;line-height:18px;font-weight:600">Bangladesh's Favorite Online Fashion Mall</div>
                </td></tr>
                <tr><td style="background:#fff;border-radius:10px 10px 0 0;padding:52px 42px">
                  <div style="font-size:22px;line-height:28px;font-weight:600;margin-bottom:8px">Password Reset Code</div>
                  <div style="font-size:14px;line-height:22px;color:#666;margin-bottom:26px">Use this code to reset your Govaly ${roleName.toLowerCase()} account password.</div>
                  <div style="display:inline-block;background:#fff0f7;border:1px solid #ffd0e4;border-radius:8px;padding:15px 24px;color:#ed1760;font-size:30px;line-height:34px;font-weight:700;letter-spacing:8px">${otp}</div>
                  <div style="font-size:13px;line-height:20px;color:#777;margin-top:24px">This code will expire in 30 minutes.</div>
                  <div style="font-size:13px;line-height:20px;color:#777;margin-top:8px">Please do not share this code with anyone.</div>
                </td></tr>
                <tr><td style="background:#fff;padding:0 42px 36px;border-radius:0 0 10px 10px;color:#999;font-size:12px">If you did not request this, you can safely ignore this email.<br><br>Govaly Support</td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>`,
  });
};

module.exports = { sendStaffOtpEmail };
