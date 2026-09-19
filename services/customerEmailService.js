// Backend/services/customerEmailService.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

/**
 * Send Govaly OTP email
 *
 * purpose:
 * - register / verification
 * - login
 * - forgot-password
 */
const sendOtpEmail = async (
  email,
  otp,
  purpose = "verification"
) => {
  let title = "Govaly Verification Code";
  let description =
    "Use this code to verify your Govaly account.";

  // New account registration
  if (
    purpose === "register" ||
    purpose === "verification"
  ) {
    title = "Govaly Verification Code";
    description =
      "Use this code to verify your Govaly account.";
  }

  // Login with OTP
  if (purpose === "login") {
    title = "Govaly Login Code";
    description =
      "Use this code to log in to your Govaly account.";
  }

  // Forgot password
  if (purpose === "forgot-password") {
    title = "Govaly Reset Code";
    description =
      "Use this code to reset your Govaly password.";
  }

  // --------------------------------------------------
  // Plain-text fallback
  // --------------------------------------------------
  const plainText = `
${title}

Hi there, ${description}

Your verification code is: ${otp}

The code will expire in 30 minutes.

Please DO NOT share your OTP with others.

If you did not request this code, you can safely ignore this email.

Govaly
Bangladesh's Favorite Online Fashion Mall
  `.trim();

  // --------------------------------------------------
  // HTML Email
  // --------------------------------------------------
  const html = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>${title}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#ed1760;
    font-family:Arial, Helvetica, sans-serif;
    color:#222222;
  "
>

  <!-- Main Pink Background -->
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      width:100%;
      margin:0;
      padding:0;
      background-color:#ed1760;
    "
  >

    <tr>
      <td align="center">

        <!-- Main 600px Container -->
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:600px;
            max-width:600px;
            margin:0 auto;
          "
        >

          <!-- ===================================== -->
          <!-- GOVALY HEADER                         -->
          <!-- ===================================== -->

          <tr>

            <td
              align="left"
              style="
                padding:45px 50px 32px 50px;
                color:#ffffff;
              "
            >

              <!-- Govaly -->
              <div
                style="
                  font-size:42px;
                  line-height:44px;
                  font-weight:700;
                  letter-spacing:-1px;
                  color:#ffffff;
                  margin-bottom:8px;
                "
              >
                Govaly
              </div>

              <!-- Tagline -->
              <div
                style="
                  font-size:13px;
                  line-height:18px;
                  font-weight:600;
                  color:#ffffff;
                "
              >
                Bangladesh's Favorite Online Fashion Mall
              </div>

            </td>

          </tr>


          <!-- ===================================== -->
          <!-- WHITE MAIN CARD                       -->
          <!-- ===================================== -->

          <tr>

            <td
              style="
                background-color:#ffffff;
                border-radius:10px 10px 0 0;
                overflow:hidden;
              "
            >

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >

                <tr>

                  <td
                    style="
                      padding:60px 48px;
                    "
                  >

                    <!-- ================================= -->
                    <!-- TITLE                               -->
                    <!-- ================================= -->

                    <div
                      style="
                        font-size:22px;
                        line-height:28px;
                        font-weight:600;
                        color:#222222;
                        margin-bottom:4px;
                      "
                    >
                      ${title}
                    </div>


                    <!-- ================================= -->
                    <!-- DESCRIPTION                         -->
                    <!-- ================================= -->

                    <div
                      style="
                        font-size:14px;
                        line-height:21px;
                        color:#333333;
                        margin-bottom:35px;
                      "
                    >
                      Hi there, ${description}
                    </div>


                    <!-- ================================= -->
                    <!-- OTP                                 -->
                    <!-- ================================= -->

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >

                      <tr>

                        <td
                          align="center"
                          style="
                            padding-top:30px;
                            padding-bottom:45px;
                          "
                        >

                          <div
                            style="
                              display:inline-block;
                              padding:8px 14px;
                              border:2px solid #dddddd;
                              border-radius:8px;
                              background-color:#ffffff;
                              color:#ed1760;
                              font-size:42px;
                              line-height:46px;
                              font-weight:700;
                              letter-spacing:7px;
                              font-family:Arial, Helvetica, sans-serif;
                            "
                          >
                            ${otp}
                          </div>

                        </td>

                      </tr>

                    </table>


                    <!-- ================================= -->
                    <!-- EXPIRATION                         -->
                    <!-- ================================= -->

                    <div
                      style="
                        text-align:center;
                        font-size:13px;
                        line-height:22px;
                        color:#333333;
                      "
                    >

                      <div>
                        The code will expire in
                        <strong>30 minutes</strong>
                      </div>

                      <div>
                        Please
                        <strong>DO NOT share your OTP with others.</strong>
                      </div>

                    </div>

                  </td>

                </tr>

              </table>

            </td>

          </tr>


          <!-- ===================================== -->
          <!-- FOOTER                                -->
          <!-- ===================================== -->

          <tr>

            <td
              align="center"
              style="
                background-color:#fce0e8;
                padding:25px 30px 26px 30px;
              "
            >

              <!-- Help / Contact -->
              <div
                style="
                  font-size:12px;
                  line-height:18px;
                  color:#333333;
                "
              >
                Help Center
                <span style="padding:0 6px;">|</span>
                Contact Us
              </div>


              <!-- Govaly Footer -->
              <div
                style="
                  margin-top:2px;
                  font-size:18px;
                  line-height:25px;
                  font-weight:700;
                  color:#ed1760;
                "
              >
                Govaly
              </div>


              <!-- Policies -->
              <div
                style="
                  margin-top:1px;
                  font-size:12px;
                  line-height:18px;
                  color:#333333;
                "
              >
                Privacy Policy
                <span style="padding:0 6px;">|</span>
                Terms &amp; Conditions
              </div>


              <!-- Disclaimer -->
              <div
                style="
                  margin-top:4px;
                  font-size:10px;
                  line-height:14px;
                  color:#666666;
                "
              >
                This is an automatically generated e-mail from our system.
              </div>

              <div
                style="
                  font-size:10px;
                  line-height:14px;
                  color:#666666;
                "
              >
                Please do not reply to this e-mail.
              </div>

            </td>

          </tr>

        </table>

      </td>
    </tr>

  </table>

</body>

</html>
`;

  // --------------------------------------------------
  // Send Email
  // --------------------------------------------------
  try {
    const info = await transporter.sendMail({
      from: `"Govaly" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: title,

      // Plain-text fallback
      text: plainText,

      // HTML design
      html,
    });

    return info;
  } catch (error) {
    console.error(
      "Failed to send OTP email:",
      error.message
    );

    throw error;
  }
};

module.exports = {
  transporter,
  sendOtpEmail,
};