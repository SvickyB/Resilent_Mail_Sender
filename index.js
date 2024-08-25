const EmailService = require('./EmailService');

const emailService = new EmailService();

// E-mail options
const mailOptions = {
  from: 'your-email@example.com', // Enter your mail address
  to: 'receiver-email@example.com', // Enter receiver mail address
  subject: 'Test Email',
  text: 'This is a test email sent from the resilient email sending service.',
  id: 'unique-email-id' // Optional, for idempotency
};

async function testEmailService() {
  try {
    const result = await emailService.sendMail(mailOptions);
    console.log('Email send result:', result);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

testEmailService();
