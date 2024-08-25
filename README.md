EmailService is a robust and resilient email sending service implemented in JavaScript using Node.js. This service integrates with real email providers via the Nodemailer library and provides a reliable mechanism for sending emails with advanced features such as retry logic, idempotency, rate limiting, and status tracking.

Key Features
--Retry Mechanism with Exponential Backoff: Automatically retries sending emails with increasing delays in case of failures.
--Fallback Between Providers: Uses multiple email providers to ensure email delivery, switching providers on failure.
--Idempotency: Prevents duplicate email sends by tracking unique email IDs.
--Basic Rate Limiting: Controls the rate at which emails are sent to avoid overwhelming the email provider.
--Status Tracking: Logs the status of each email attempt for monitoring and debugging.

Bonus Features
--Circuit Breaker Pattern: Implements a basic circuit breaker to handle repeated failures and prevent system overload.
--Simple Logging: Provides logging for email send attempts and status updates.
--Basic Queue System: Manages email sending when rate-limited by queuing email requests and processing them when allowed.

--Installation--

--Clone the repository:

Copy code
--git clone https://github.com/yourusername/emailservice.git
--cd emailservice

Install dependencies:

Copy code
--npm install

Create a .env file in the root directory of the project and add your email provider credentials:

Copy code
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
Usage
Create an Email Service Instance

--javascript--

const EmailService = require('./emailService');
const emailService = new EmailService();
const mailOptions = {
  from: 'your-email@gmail.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email sent from the resilient email sending service.',
  id: 'unique-email-id' // Optional, for idempotency
};

emailService.sendMail(mailOptions)
  .then(result => console.log('Email send result:', result))
  .catch(error => console.error('Failed to send email:', error.message));

--Testing--
--Run Unit Tests

--To ensure the functionality of the EmailService, run the unit tests with Jest:
Copy code
--npm test
The tests cover email sending success, retries, rate limiting, and idempotency.
