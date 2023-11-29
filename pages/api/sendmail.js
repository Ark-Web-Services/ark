import nodemailer from 'nodemailer';
import fetch from 'node-fetch'; // Ensure node-fetch is installed

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, email, subject, message, recaptchaResponse } = req.body;

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

      if (!verificationData.success) {
        // reCAPTCHA verification failed
        return res.status(400).json({ message: 'Invalid reCAPTCHA. Please try again.' });
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
            ...
            Best Regards,
            Ark Web Services
          `,
      };

      // Send email
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Thank you! We've received your message and will respond within 24 hours." });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error sending message' });
    }
  } else {
    res.status(405).send('Method not allowed');
  }
}
