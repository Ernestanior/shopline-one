import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import './Contact.css';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        json: formData
      });
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact">
      <div className="container">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div className="contact-content">
          <div className="contact-form-section">
            <h2>Send us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form" id="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting || submitted}>
                {submitting ? 'Sending...' : submitted ? 'Sent!' : 'Send Message'}
              </button>
              
              {error && <div className="error-message">{error}</div>}
              {submitted && <div className="success-message">Message sent successfully! We'll get back to you soon.</div>}
            </form>

            <div className="faq-section" id="faq">
              <h2>FAQ</h2>
              <p className="faq-intro">Quick answers about checkout, shipping, and returns.</p>

              <div className="faq-accordion">
                <details className="faq-details">
                  <summary className="faq-summary">Why is the payment button disabled?</summary>
                  <div className="faq-answer">
                    This site is a demo of the checkout flow. Orders can be created, but payment is intentionally disabled.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">Do I need an account to place an order?</summary>
                  <div className="faq-answer">
                    No. You can checkout as a guest. Creating an account helps you track your orders more easily.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">What payment methods do you accept?</summary>
                  <div className="faq-answer">
                    We support major credit cards (Visa, Mastercard, AMEX) and popular digital wallets. In this demo, no payment is processed.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">How long does shipping take?</summary>
                  <div className="faq-answer">
                    Domestic orders typically arrive within 2-3 business days. International shipping usually takes 7-14 business days depending on destination.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">Do you ship internationally?</summary>
                  <div className="faq-answer">
                    Yes. Shipping costs and delivery times vary by country and will be shown at checkout.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">Can I track my order?</summary>
                  <div className="faq-answer">
                    Yes. After shipment, we will send you a tracking number via email.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">What is your return policy?</summary>
                  <div className="faq-answer">
                    Returns are accepted within 30 days for unused items in original packaging. Contact support to start a return.
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">My package is lost or damaged. What should I do?</summary>
                  <div className="faq-answer">
                    Contact us with your order number and we will help resolve it with the carrier.
                  </div>
                </details>
              </div>

              <div className="faq-footer">
                <p>Still have questions?</p>
                <p className="faq-footer-text">Send us a message and our support team will get back to you.</p>
              </div>
            </div>
          </div>

          <div className="contact-info-section">
            <h2>Other Ways to Reach Us</h2>
            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">📧</div>
                <h3>Email Support</h3>
                <p>support@xyvn.com</p>
                <p className="method-detail">We respond within 24 hours on weekdays</p>
              </div>

              <div className="contact-method">
                <div className="method-icon">💬</div>
                <h3>Social Media</h3>
                <div className="social-links">
                  <a href="https://www.facebook.com/xyvn" target="_blank" rel="noopener noreferrer">Facebook (Arvix)</a>
                  <a href="https://x.com/xyvn" target="_blank" rel="noopener noreferrer">X (Arvix)</a>
                  <a href="https://www.instagram.com/xyvn/" target="_blank" rel="noopener noreferrer">Instagram (Arvix)</a>
                  <a href="https://www.youtube.com/@Arvix" target="_blank" rel="noopener noreferrer">YouTube (Arvix)</a>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">📍</div>
                <h3>Office Location</h3>
                <p>Taipei, Taiwan</p>
                <p className="method-detail">Mon-Fri: 9:00 AM - 6:00 PM</p>
              </div>

              <div className="contact-method">
                <div className="method-icon">📚</div>
                <h3>FAQ</h3>
                <p>Find quick answers to common questions</p>
                <a
                  href="#faq"
                  className="method-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View FAQ
                </a>
              </div>
            </div>
          </div>

          <div className="response-info">
            <h3>What to Expect</h3>
            <div className="expectation-grid">
              <div className="expectation-item">
                <h4>Response Time</h4>
                <p>Within 24 hours for business inquiries</p>
              </div>
              <div className="expectation-item">
                <h4>Support Hours</h4>
                <p>Monday - Friday, 9:00 AM - 6:00 PM (GMT+8)</p>
              </div>
              <div className="expectation-item">
                <h4>Languages</h4>
                <p>English, Chinese (Traditional & Simplified)</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
