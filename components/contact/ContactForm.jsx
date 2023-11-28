import { useState } from 'react';
import axios from 'axios';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    subject: '',
    message: ''
  });

  const [confirmation, setConfirmation] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/sendmail', formData);
      setConfirmation(response.data);
    } catch (err) {
      setConfirmation('Error sending message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form row y-gap-40 pt-60 sm:pt-40">
  <div className="form-group col-md-6">
    <label>Full Name</label>
    <input
      type="text"
      name="username"
      value={formData.username}
      onChange={handleChange}
      // placeholder="Your Name*"
      required
    />
  </div>

  <div className="form-group col-md-6">
    <label>Your Email Address</label>
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      // placeholder="Your Email*"
      required
    />
  </div>

  <div className="form-group col-md-6">
    <label>Your Subject</label>
    <input
      type="text"
      name="subject"
      value={formData.subject}
      onChange={handleChange}
      // placeholder="Subject *"
      required
    />
  </div>

  <div className="form-group col-md-6">
    <label>Phone Number</label>
    <input
      type="text"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      // placeholder="Phone Number"
      required
    />
  </div>

  <div className="form-group col-lg-12 col-md-12 col-sm-12">
    <label>Message</label>
    <textarea
      name="message"
      value={formData.message}
      onChange={handleChange}
      // placeholder="Write your message..."
      required
    ></textarea>
  </div>

  <div className="form-group col-lg-12 col-md-12 col-sm-12">
    <button className="button -md -accent -uppercase text-white" type="submit">
      Send Message
    </button>
  </div>

  {confirmation && (
    <div className="form-group col-lg-12 col-md-12 col-sm-12">
      <p>{confirmation}</p>
    </div>
  )}
</form>

  );
};

export default ContactForm;
