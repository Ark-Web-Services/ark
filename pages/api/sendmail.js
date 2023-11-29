import nodemailer from 'nodemailer';
import fetch from 'node-fetch'; // Make sure to install node-fetch if not already installed

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, email, subject, message, recaptchaResponse } = req.body;

    // Verify reCAPTCHA response
    const isRecaptchaValid = await verifyRecaptcha(recaptchaResponse);
    if (!isRecaptchaValid) {
      return res.status(400).json('Invalid reCAPTCHA. Please try again.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
      from: process.env.EMAIL_SUBMIT,
      to: [email, process.env.EMAIL_SUBMIT],
      subject: subject,
      text: `
          Dear ${username},

          Thank you for reaching out to us. We have received your message and appreciate your interest.

          Here's a copy of your message for your reference:
          Subject: ${subject}
          Message: ${message}

          We will review your message and get back to you as soon as possible.

          Best Regards,
          Ark Web Services
        `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json("Thank you! We've received your message and will respond within 24 hours.");
    } catch (error) {
      console.error(error);
      res.status(500).json('Error sending message');
    }
  } else {
    res.status(405).send('Method not allowed');
  }
}

// Helper function to verify reCAPTCHA response
async function verifyRecaptcha(recaptchaResponse) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${recaptchaResponse}`
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}
