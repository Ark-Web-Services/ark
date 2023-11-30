import nodemailer from 'nodemailer';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, email, subject, message, recaptchaResponse } = req.body;

    // Log the received data for debugging
    console.log("Received form data:", { username, email, subject, message, recaptchaResponse });

    // Verify the reCAPTCHA token
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    try {
      const verificationResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      const verificationData = await verificationResponse.json();

      // Log the verification response for debugging
      console.log("Verification Response from Google:", verificationData);

      if (!verificationData.success) {
        // reCAPTCHA verification failed
        return res.status(400).json({ message: 'Invalid reCAPTCHA. Please try again.', details: verificationData });
      }

      // Set up nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      // Email options
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

      // Send email
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Thank you! We've received your message and will respond within 24 hours." });

    } catch (error) {
      console.error("Error occurred:", error);
      res.status(500).json({ message: 'Error sending message', error: error.message });
    }
  } else {
    res.status(405).send('Method not allowed');
  }
}
