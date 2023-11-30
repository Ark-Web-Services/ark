import { useState } from 'react';
import axios from 'axios';

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
    console.log("Received reCAPTCHA value:", value); // Add this log
    setFormData({ ...formData, recaptchaResponse: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
  
    // Check if reCAPTCHA is loaded
    if (window.grecaptcha) {
      // Ready to execute reCAPTCHA
      window.grecaptcha.ready(async () => {
        try {
          // Execute reCAPTCHA and get the token
          const recaptchaResponse = await window.grecaptcha.execute('6Lem8CApAAAAAG__QpiKaanzep4uw7BrJ_0lwZFV', { action: 'submit' });
  
          // Construct the data to send, including the reCAPTCHA response
          const dataToSend = { ...formData, recaptchaResponse };
  
          // Make the POST request to your backend with the form data
          const response = await axios.post('/api/sendmail', dataToSend);
  
          // Check if the response contains a message and set it
          if (response.data && typeof response.data.message === 'string') {
            setConfirmation(response.data.message);
          } else {
            // Handle cases where the message is not in the expected format
            setConfirmation('Thank you! Your message has been sent.');
          }
  
          // Reset the form state after successful submission
          setFormData({
            username: '',
            email: '',
            subject: '',
            message: '',
            phone: '',
            recaptchaResponse: '',
          });
        } catch (err) {
          // Handle any errors here
          console.error('Error during form submission:', err);
  
          // Check if the error response contains a message and set it
          if (err.response && err.response.data && typeof err.response.data.message === 'string') {
            setConfirmation(err.response.data.message);
          } else {
            // Handle cases where the error message is not in the expected format
            setConfirmation('Error sending message');
          }
        }
      });
    } else {
      // Handle case where reCAPTCHA is not loaded
      console.error('reCAPTCHA not loaded');
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
