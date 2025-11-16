/**
 * Email utility functions for sending authentication emails
 * @module utils/email
 */

import nodemailer from 'nodemailer';
import config from '../config/index.js';

/**
 * Creates and returns a nodemailer transporter
 * @returns {Object} Nodemailer transporter instance
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: config.email.service,
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: config.email.auth,
  });
}

/**
 * Sends an email using the configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.text] - Email plain text content
 * @returns {Promise<Object>} Email send result
 * @throws {Error} If email sending fails
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject || !html) {
    throw new Error('Email requires to, subject, and html fields');
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Sends a welcome email after successful registration
 * @param {string} email - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise<Object>} Email send result
 */
export async function sendWelcomeEmail(email, name) {
  const subject = 'Welcome to Our Platform!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome Aboard!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'there'}!</h2>
          <p>Thank you for joining our platform. We're excited to have you with us!</p>
          <p>You can now access all the features and start exploring.</p>
          <a href="${config.frontendUrl}/dashboard" class="button">Get Started</a>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends an email verification email
 * @param {string} email - Recipient email address
 * @param {string} token - Email verification token
 * @param {string} name - User's name
 * @returns {Promise<Object>} Email send result
 */
export async function sendVerificationEmail(email, token, name) {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const subject = 'Verify Your Email Address';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .code { background-color: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'there'}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <div class="code">${verificationUrl}</div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a password reset email
 * @param {string} email - Recipient email address
 * @param {string} token - Password reset token
 * @param {string} name - User's name
 * @returns {Promise<Object>} Email send result
 */
export async function sendPasswordResetEmail(email, token, name) {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const subject = 'Reset Your Password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .code { background-color: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 16px; }
        .warning { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'there'}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <div class="code">${resetUrl}</div>
          <p>This link will expire in 1 hour.</p>
          <div class="warning">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a password change confirmation email
 * @param {string} email - Recipient email address
 * @param {string} name - User's name
 * @returns {Promise<Object>} Email send result
 */
export async function sendPasswordChangedEmail(email, name) {
  const subject = 'Password Changed Successfully';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .warning { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Changed</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'there'}!</h2>
          <p>This is a confirmation that your password has been changed successfully.</p>
          <p>Changed on: ${new Date().toLocaleString()}</p>
          <div class="warning">
            <strong>Security Alert:</strong> If you didn't make this change, please contact our support team immediately.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a magic link for passwordless authentication
 * @param {string} email - Recipient email address
 * @param {string} token - Magic link token
 * @param {string} name - User's name
 * @returns {Promise<Object>} Email send result
 */
export async function sendMagicLinkEmail(email, token, name) {
  const magicUrl = `${config.frontendUrl}/magic-link?token=${token}`;
  const subject = 'Your Magic Sign-In Link';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .code { background-color: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Magic Sign-In Link</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'there'}!</h2>
          <p>Click the button below to sign in to your account:</p>
          <a href="${magicUrl}" class="button">Sign In</a>
          <p>Or copy and paste this link into your browser:</p>
          <div class="code">${magicUrl}</div>
          <p>This link will expire in 15 minutes and can only be used once.</p>
          <p>If you didn't request this link, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
