const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch"); // هنستخدمه للـ ping
require("dotenv").config();

admin.initializeApp();

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;

/* =========================================================
   SEND WELCOME EMAIL (زي ما هو - بدون تغيير)
========================================================= */
exports.sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated."
      );
    }

    const email = data.email;
    const name = data.name || "User";

    if (!email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email is required."
      );
    }

    if (!gmailUser || !gmailPass) {
      console.error("Email config missing:", {
        hasGmailUser: Boolean(gmailUser),
        hasGmailPass: Boolean(gmailPass)
      });

      throw new functions.https.HttpsError(
        "failed-precondition",
        "Email service is not configured."
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const mailOptions = {
      from: `Nabta-System <${gmailUser}>`,
      to: email,
      subject: `Welcome to Nabta-System, ${name}! ❤️`,
      html: `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; background-color: #fff8f1;">
  <div style="max-width: 600px; margin: auto; padding: 20px;">

    <a href="https://nabta-system.tech/" target="_blank" style="text-decoration:none;">
      <img 
        src="https://i.imgur.com/A0LWWKw.png"
        alt="Nabta-System Logo"
        style="height:50px; margin-bottom:20px;"
      />
    </a>

    <p>Welcome to the Nabta-System family ❤️ We're excited to have you on board.</p>

    <p>Your account has been successfully created, and you're now ready to explore all the great features we offer.</p>

    <p>
      <a 
        href="https://nabta-system.tech/"
        target="_blank"
        style="display:inline-block; text-decoration:none; color:#ffffff; background-color:#fc0038; padding:10px 20px; border-radius:6px; font-weight:bold;">
        Open Nabta-System
      </a>
    </p>

    <p>If you have any questions or need help getting started, our support team is just an email away at ${gmailUser}.</p>

    <p>
      Best regards,<br>
      <strong>The Nabta-System Team</strong>
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

    console.log("Email sent to:", email);

    return { success: true };

  } catch (error) {
    const message = error?.message || "Failed to send email.";
    console.error("Email error:", {
      message,
      code: error?.code,
      stack: error?.stack
    });

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError("internal", message);
  }
});

/* =========================================================
   KEEP HUGGING FACE ALIVE (1st Gen - بدون Scheduler API)
   بيعمل Ping كل 10 دقائق
========================================================= */

exports.keepHuggingFaceAlive = functions.pubsub
  .schedule("every 10 minutes")
  .timeZone("UTC")
  .onRun(async (context) => {
    const urls = [
      "https://armia-gamal-plant-leaf-detection-api.hf.space",
      "https://armia-gamal-agritech-api.hf.space"
    ];

    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url);
          console.log(`${url} -> ${response.status}`);
        } catch (error) {
          console.error(`${url} -> Ping Failed`, error);
        }
      })
    );

    return null;
  });

/* =========================================================
   SECURE COHERE CHAT PROXY
========================================================= */

exports.cohereChat = functions.https.onCall(async (data, context) => {
  try {
    // اختياري: لو عايزة تخليه للمستخدمين المسجلين بس
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Cohere API error");
    }

    return result;

  } catch (error) {
    console.error("Cohere Error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Chat service failed."
    );
  }
});