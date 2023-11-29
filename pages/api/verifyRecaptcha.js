// pages/api/verifyRecaptcha.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
      try {
        const recaptchaResponse = req.body.recaptchaResponse;
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
        const googleVerifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;
        const response = await fetch(googleVerifyURL, {
          method: 'POST',
        });
        const data = await response.json();
  
        if (data.success) {
          res.status(200).json({ message: "Verification successful" });
        } else {
          res.status(400).json({ message: "Verification failed" });
        }
      } catch (error) {
        res.status(500).json({ message: "Internal server error" });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  