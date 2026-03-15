const nodemailer = require('nodemailer');

const {
    EMAIL_USER,
    EMAIL_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    NODE_ENV
} = process.env;

// Create a transporter object using the default SMTP transport
const createTransporter = () => {
    // If SMTP missing, return null to trigger fallback
    if (!SMTP_HOST || !EMAIL_USER || !EMAIL_PASS || EMAIL_USER === 'your_smtp_username') {
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT) || 465,
        secure: SMTP_PORT === '465' || SMTP_SECURE === 'true',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        connectionTimeout: 15000, // 15 seconds
        greetingTimeout: 15000,
        socketTimeout: 30000,
    });
};

/**
 * Sends a password reset email using Nodemailer.
 */
const sendPasswordResetEmail = async (to, resetLink) => {
    const transporter = createTransporter();

    if (!transporter) {
        logFallback(to, resetLink, "Missing SMTP Configuration (Password Reset)");
        return true;
    }

    try {
        const mailOptions = {
            from: `"Lost & Found Support" <${EMAIL_USER}>`,
            to: to,
            subject: 'Reset Your Password - Lost & Found',
            text: `You requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 1 hour.`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #1e293b; margin-bottom: 16px;">Reset Your Password</h2>
                    <p style="color: #475569; line-height: 1.6;">You requested a password reset for your Lost & Found account. Click the button below to set a new password:</p>
                    <div style="margin: 32px 0;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-top: 24px;">This link is valid for 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px;">Lost & Found System</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email via Nodemailer:', error.message);
        logFallback(to, resetLink, "Nodemailer Error");
        return true;
    }
};

/**
 * Sends a login confirmation email.
 * This was used in the previous flow but kept for compatibility.
 */
const sendLoginConfirmationEmail = async (to, confirmationLink) => {
    const transporter = createTransporter();

    if (!transporter) {
        logFallback(to, confirmationLink, "Missing SMTP Configuration (Login)");
        return true;
    }

    try {
        const mailOptions = {
            from: `"Lost & Found Support" <${EMAIL_USER}>`,
            to: to,
            subject: 'Confirm Your Login - Lost & Found',
            text: `Click the link below to confirm your login:\n\n${confirmationLink}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #1e293b; margin-bottom: 16px;">Confirm Your Login</h2>
                    <p style="color: #475569; line-height: 1.6;">Click the button below to complete your login to Lost & Found:</p>
                    <div style="margin: 32px 0;">
                        <a href="${confirmationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Confirm Login</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px;">Lost & Found System</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Login confirmation email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending login confirmation email via Nodemailer:', error.message);
        logFallback(to, confirmationLink, "Nodemailer Error");
        return true;
    }
};

const logFallback = (to, link, reason) => {
    console.log('\n' + '='.repeat(60));
    console.log(`⚠️  [DEVELOPMENT FALLBACK] (${reason})`);
    console.log(`To: ${to}`);
    console.log(`Link: ${link}`);
    console.log('='.repeat(60) + '\n');
    console.log('👉 Tip: Copy the link above and open it in your browser to proceed.\n');
};

const sendMatchNotificationEmail = async (to, itemName, matchLink) => {
    const transporter = createTransporter();

    if (!transporter) {
        logFallback(to, matchLink, `Missing SMTP Configuration (Match: ${itemName})`);
        return true;
    }

    try {
        const mailOptions = {
            from: `"Lost & Found Alerts" <${EMAIL_USER}>`,
            to: to,
            subject: `Potential Match Found: ${itemName} - Lost & Found`,
            text: `Good news! We've found a potential match for your item: ${itemName}.\n\nView details here: ${matchLink}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #059669; margin-bottom: 16px;">Potential Match Found!</h2>
                    <p style="color: #475569; line-height: 1.6;">Good news! Our system has identified a potential match for your item: <strong>${itemName}</strong>.</p>
                    <div style="margin: 32px 0;">
                        <a href="${matchLink}" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Potential Match</a>
                    </div>
                    <p style="color: #64748b; font-size: 14px;">If this is your item, you can proceed to claim it through the platform.</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px;">Lost & Found System Alerts</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Match notification email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending match notification email:', error.message);
        logFallback(to, matchLink, "Match Notification Error");
        return true;
    }
};

module.exports = { sendLoginConfirmationEmail, sendPasswordResetEmail, sendMatchNotificationEmail };
