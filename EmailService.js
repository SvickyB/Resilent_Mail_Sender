const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

class MockEmailProvider {
  constructor(name) {
    this.name = name;
    this.successRate = 0.8; // Simulated success rate for the provider
  }

  async sendMail(mailOptions) {
    if (Math.random() > this.successRate) {
      throw new Error(`Failed to send email using ${this.name}`);
    }
    return { success: true, provider: this.name };
  }
}

class EmailService {
  constructor() {
    // Initialize mock email providers
    this.providers = [
      new MockEmailProvider('ProviderA'),
      new MockEmailProvider('ProviderB')
    ];

    // Initialize idempotency tracking, rate limiting, and email queue
    this.idempotencySet = new Set();
    this.queue = [];
    this.isRateLimited = false;
    this.rateLimitDuration = 60000; // 1 minute
    this.lastSent = Date.now();
    this.retryDelay = 1000; // Start with 1 second delay
    this.maxRetries = 5;
  }

  async sendMail(mailOptions) {
    const emailId = mailOptions.id || uuidv4();

    // Checking idempotency
    if (this.idempotencySet.has(emailId)) {
      console.log('Duplicate email detected, skipping.');
      return { success: false, message: 'Duplicate email detected' };
    }
    this.idempotencySet.add(emailId);

    if (this.isRateLimited) {
      console.log('Rate limit exceeded, queuing email.');
      this.queue.push(mailOptions);
      return;
    }

    let lastError;
    for (const provider of this.providers) {
      try {
        const result = await this._sendWithRetry(provider, mailOptions);
        this._updateStatus(emailId, result);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`Error sending email with ${provider.name}: ${error.message}`);
      }
    }

    // If all providers fails
    this._updateStatus(emailId, { success: false, error: lastError.message });
    throw lastError;
  }

  async _sendWithRetry(provider, mailOptions) {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const result = await provider.sendMail(mailOptions);
        return result;
      } catch (error) {
        attempts++;
        if (attempts >= this.maxRetries) {
          throw error;
        }
        // Exponential backoff
        const delay = Math.pow(2, attempts) * this.retryDelay;
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }

  _updateStatus(emailId, result) {
    console.log(`Email ${emailId} status: ${JSON.stringify(result)}`);
  }

  _applyRateLimit() {
    const now = Date.now();
    if (now - this.lastSent < this.rateLimitDuration) {
      this.isRateLimited = true;
      setTimeout(() => {
        this.isRateLimited = false;
        this.lastSent = Date.now();
        this._processQueue();
      }, this.rateLimitDuration - (now - this.lastSent));
    } else {
      this.lastSent = Date.now();
      this._processQueue();
    }
  }

  _processQueue() {
    while (this.queue.length > 0 && !this.isRateLimited) {
      const mailOptions = this.queue.shift();
      this.sendMail(mailOptions);
    }
  }
}

module.exports = EmailService;
