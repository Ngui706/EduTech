import nodemailer from 'nodemailer';

const isConfigured =
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_USER !== 'your_email@gmail.com' &&
  process.env.SMTP_PASS &&
  process.env.SMTP_PASS !== 'your_app_password';

let transporter = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email notification. Fallbacks to console logging if SMTP is not configured.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.SMTP_FROM || 'noreply@techsips.com';
  
  if (isConfigured && transporter) {
    try {
      await transporter.sendMail({
        from: `"TechSips LMS" <${from}>`,
        to,
        subject,
        text: text || subject,
        html,
      });
      console.log(`✉️ Email successfully sent to ${to}: "${subject}"`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to send email to ${to}:`, err.message);
      return false;
    }
  } else {
    // Beautiful console logging as a fallback
    console.log('\n==================================================');
    console.log(`✉️  [SIMULATED EMAIL SENT]`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From:    ${from}`);
    console.log(`Content:`);
    console.log(text || html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    console.log('==================================================\n');
    return true;
  }
};

/**
 * Helper to fetch all Admin emails to broadcast admin notifications.
 */
export const getAdminEmails = async (supabase) => {
  try {
    const { data } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin');
    
    if (data && data.length > 0) {
      return data.map(u => u.email);
    }
  } catch (err) {
    console.error('Error fetching admin emails:', err);
  }
  return [process.env.SMTP_USER || 'admin@techsips.com'];
};
