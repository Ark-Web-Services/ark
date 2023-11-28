import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, email, subject, message } = req.body;

    // const transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //       user: process.env.GMAIL_USER,
    //       pass: process.env.GMAIL_PASS
    //     }
    //   });

    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      secure: true,
      secureConnection: false, // TLS requires secureConnection to be false
      tls: {
        ciphers: "SSLv3",
      },
      requireTLS: true,
      port: 465,
      debug: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
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
          Pick-a-Pro
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
