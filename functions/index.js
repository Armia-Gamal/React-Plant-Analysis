const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Environment variables
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

// ==========================================================
// SEND WELCOME EMAIL (CHINESE VERSION)
// Egypt Chinese Translation Platform
// ==========================================================

exports.sendWelcomeEmailChinese = functions.https.onCall(async (data, context) => {
  try {

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const { email, name } = data;

    if (!email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: `Egypt Chinese Translation Platform <${gmailUser}>`,
      to: email,
      subject: `欢迎加入埃及华人翻译平台，${name}！`,
      html: `
<div style="font-family:Arial, Helvetica, sans-serif; background:#f5f7fb; padding:20px;">
  <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">
    
    <h2 style="color:#2c3e50;">
      欢迎加入埃及华人翻译平台 🇪🇬🇨🇳
    </h2>

    <p>您好 <strong>${name}</strong>，</p>

    <p>
      欢迎您加入 <strong>埃及华人翻译平台</strong>！
    </p>

    <p>
      您的账户已经成功创建，现在您可以开始使用我们的平台。
    </p>

    <p>
      本平台旨在帮助在埃及的中国游客与专业翻译人员快速连接，
      提供翻译、导游以及紧急协助等服务。
    </p>

    <div style="margin:30px 0;">
      <a 
        href="https://your-platform-link.com"
        style="background:#1976d2;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
        进入平台
      </a>
    </div>

    <p>
      如果您有任何问题，请随时联系我们。
    </p>

    <p>
      祝您使用愉快！
    </p>

    <p>
      此致<br>
      <strong>埃及华人翻译平台团队</strong>
    </p>

    <hr/>

    <p style="font-size:13px;color:#777;">
      用户邮箱: ${email}
    </p>

  </div>
</div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("Chinese welcome email sent");

    return { success: true };

  } catch (error) {

    console.error("Email error:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message
    );
  }
});