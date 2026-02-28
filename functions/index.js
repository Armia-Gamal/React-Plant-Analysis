const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

admin.initializeApp();

// Environment variables
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

// ==========================================================
// SEND WELCOME EMAIL
// ==========================================================

exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
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

    console.log("USER:", gmailUser);
    console.log("PASS EXISTS:", gmailPass ? "YES" : "NO");

    // SMTP config (أضمن من service: gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // verify connection
    await transporter.verify();

    const mailOptions = {
      from: `Nabta-System <${gmailUser}>`,
      to: email,
      subject: `Welcome to Nabta-System, ${name}! ❤️`,
      html: `
    <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #fff8f1;">
      <div style="max-width: 600px; margin: auto; padding: 20px;">

        <a href="https://nabta-seniors.netlify.app/" target="_blank" style="text-decoration:none;">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/gp-hu-42ca5.firebasestorage.app/o/%D9%8A%D8%B3%20(1).png?alt=media&token=6cf4c7b3-2956-456d-a23c-d16719d2e6ad"
            alt="Nabta-System Logo"
            style="height:50px; margin-bottom:20px;"
          />
        </a>

        <p>Welcome to the Nabta-System family ❤️ We're excited to have you on board.</p>

        <p>Your account has been successfully created, and you're now ready to explore all the great features we offer.</p>

        <p>
          <a 
            href="https://nabta-seniors.netlify.app/"
            target="_blank"
            style="display:inline-block; text-decoration:none; color:#ffffff; background-color:#fc0038; padding:10px 20px; border-radius:6px; font-weight:bold;">
            Open Nabta-System
          </a>
        </p>

        <p>If you have any questions or need help getting started, our support team is just an email away at ${gmailUser}.</p>

        <p>
          Best regards,<br>
          <strong>The Nabta-Seniors Team</strong>
        </p>

        <hr style="margin-top:30px;" />

        <p style="font-size:14px; color:#555;">
          Account created for: <strong>${name} (${email})</strong>
        </p>

      </div>
    </div>
          `,
        };
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");

    return { success: true };

  } catch (error) {
    console.error("Email error:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message
    );
  }
});


exports.keepHuggingFaceAlive = functions.pubsub
  .schedule("every 10 minutes")
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const response = await fetch(
        "https://armia-gamal-plant-leaf-detection-api.hf.space"
      );

      console.log("HF Ping Status:", response.status);
    } catch (error) {
      console.error("HF Ping Failed:", error);
    }

    return null;
  });
// ==========================================================
// COHERE CHAT PROXY
// ==========================================================

exports.cohereChat = functions.https.onCall(async (data, context) => {
  try {

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const apiKey = process.env.COHERE_KEY;

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;

  } catch (error) {
    console.error("Cohere error:", error);

    throw new functions.https.HttpsError(
      "internal",
      error.message
    );
  }
});

// ==========================================================
// SEND CUSTOM PASSWORD RESET EMAIL
// ==========================================================

exports.sendCustomPasswordReset = functions.https.onCall(
  async (data, context) => {
    try {
      const { email } = data;

      if (!email) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Email is required."
        );
      }

      // Generate official Firebase reset link
      const actionCodeSettings = {
        url: "https://nabta-seniors.netlify.app/Login",
        handleCodeInApp: false,
      };

    const resetLink = await admin
      .auth()
      .generatePasswordResetLink(email, actionCodeSettings);

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
        from: `Nabta-System <${gmailUser}>`,
        to: email,
        subject: "Reset Your Nabta-System Password",
        html: `
        <div style="font-family: Arial; font-size:16px; background:#fff8f1; padding:20px;">
          
          <a href="https://nabta-seniors.netlify.app/" target="_blank">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/gp-hu-42ca5.firebasestorage.app/o/%D9%8A%D8%B3%20(1).png?alt=media&token=6cf4c7b3-2956-456d-a23c-d16719d2e6ad"
              width="160"
              alt="Nabta-System Logo"
              style="display:block; margin-bottom:20px;"
            />
          </a>

          <p>Hello,</p>

          <p>We received a request to reset your password.</p>

          <p>
            <a href="${resetLink}" 
              style="background-color:#fc0038; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px;">
              Reset Password
            </a>
          </p>

          <p>If you didn’t request this, you can ignore this email.</p>

          <p>Best regards,<br><strong>The Nabta-System Team</strong></p>
        </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return { success: true };

    } catch (error) {
      console.error("Reset email error:", error);

      throw new functions.https.HttpsError(
        "internal",
        error.message
      );
    }
  }
);