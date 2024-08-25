const EmailService = require('./emailService');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('EmailService', () => {
  let emailService;
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    // Reset the mocks before each test
    jest.resetAllMocks();

    // Create a mock transport
    mockSendMail = jest.fn();
    mockTransporter = {
      sendMail: mockSendMail
    };

    // Replace nodemailer.createTransport with a mock function that returns our mock transporter
    nodemailer.createTransport = jest.fn(() => mockTransporter);

    // Initialize the email service
    emailService = new EmailService();
  });

  test('should send email successfully', async () => {
    // Mock the sendMail method to resolve successfully
    mockSendMail.mockResolvedValue({ success: true, info: 'Message sent successfully' });

    const mailOptions = {
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      id: 'unique-email-id'
    };

    const result = await emailService.sendMail(mailOptions);

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(mailOptions);
  });

  test('should retry on failure', async () => {
    // Mock the sendMail method to fail initially and then succeed
    mockSendMail
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ success: true, info: 'Message sent successfully' });

    const mailOptions = {
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      id: 'unique-email-id'
    };

    const result = await emailService.sendMail(mailOptions);

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(2); // Retries once
  });

  test('should handle email sending failure after retries', async () => {
    // Mock the sendMail method to fail
    mockSendMail.mockRejectedValue(new Error('Network error'));

    const mailOptions = {
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      id: 'unique-email-id'
    };

    await expect(emailService.sendMail(mailOptions)).rejects.toThrow('Network error');
    expect(mockSendMail).toHaveBeenCalledTimes(emailService.maxRetries); // Should retry maxRetries times
  });

  test('should not send duplicate emails', async () => {
    // Mock the sendMail method to resolve successfully
    mockSendMail.mockResolvedValue({ success: true, info: 'Message sent successfully' });

    const mailOptions = {
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      id: 'unique-email-id'
    };

    await emailService.sendMail(mailOptions); // First call
    const result = await emailService.sendMail(mailOptions); // Duplicate call

    expect(result.message).toBe('Duplicate email detected');
    expect(mockSendMail).toHaveBeenCalledTimes(1); // Should only send once
  });

  test('should handle rate limiting', async () => {
    jest.useFakeTimers(); // Use fake timers to control setTimeout behavior

    // Mock the sendMail method to resolve successfully
    mockSendMail.mockResolvedValue({ success: true, info: 'Message sent successfully' });

    const mailOptions = {
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      id: 'unique-email-id'
    };

    // Send the first email
    await emailService.sendMail(mailOptions);
    jest.advanceTimersByTime(emailService.rateLimitDuration + 1); // Advance time to lift rate limit
    const result = await emailService.sendMail(mailOptions);

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(2); // Should send twice
  });
});
