import { useState } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    recaptchaResponse: '', // Field for reCAPTCHA response
  });

  const [confirmation, setConfirmation] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaChange = (value) => {
    console.log("reCAPTCHA Token:", value); // Log reCAPTCHA token for debugging
    setFormData({ ...formData, recaptchaResponse: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    console.log("Form Data on Submit:", formData); // Log formData for debugging

    if (!formData.recaptchaResponse) {
      console.error('reCAPTCHA verification failed');
      return;
    }

    try {
      const response = await axios.post('/api/sendmail', formData);
      setConfirmation(response.data);
      // Reset the form and reCAPTCHA after successful submission
      setFormData({
        username: '',
        email: '',
        subject: '',
        message: '',
        phone: '',
        recaptchaResponse: '',
      });
    } catch (err) {
      setConfirmation('Error sending message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form row y-gap-40 pt-60 sm:pt-40">
      {/* Full Name Input */}
      <div className="form-group col-md-6">
        <label>Full Name</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      {/* Email Address Input */}
      <div className="form-group col-md-6">
        <label>Your Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      {/* Subject Input */}
      <div className="form-group col-md-6">
        <label>Your Subject</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
        />
      </div>

      {/* Phone Number Input */}
      <div className="form-group col-md-6">
        <label>Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      {/* Message Textarea */}
      <div className="form-group col-lg-12 col-md-12 col-sm-12">
        <label>Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
        ></textarea>
      </div>

      {/* reCAPTCHA widget */}
      <div className="form-group col-lg-12 col-md-12 col-sm-12">
        <ReCAPTCHA
          sitekey="6LcSBR8pAAAAAMg3B-D4JtJZfsWFznXTYTuU4Uqd" // Replace with your actual site key
          onChange={handleCaptchaChange}
        />
      </div>

      {/* Submit button */}
      <div className="form-group col-lg-12 col-md-12 col-sm-12">
        <button className="button -md -accent -uppercase text-white" type="submit">
          Send Message
        </button>
      </div>

      {/* Confirmation message */}
      {confirmation && (
        <div className="form-group col-lg-12 col-md-12 col-sm-12">
          <p>{confirmation}</p>
        </div>
      )}
    </form>
  );
};

export default ContactForm;
