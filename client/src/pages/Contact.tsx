import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import './Contact.css';

const Contact: React.FC = () => {
  const { t } = useLanguage();
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
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>

        <div className="contact-content">
          <div className="contact-form-section">
            <h2>{t('contact.send')}</h2>
            <form onSubmit={handleSubmit} className="contact-form" id="contact-form">
              <div className="form-group">
                <label htmlFor="name">{t('contact.name')} *</label>
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
                <label htmlFor="email">{t('auth.email')} *</label>
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
                <label htmlFor="subject">{t('contact.subject')}</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={t('contact.subjectPlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">{t('contact.message')} *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting || submitted}>
                {submitting ? t('common.loading') : submitted ? t('contact.success') : t('contact.send')}
              </button>
              
              {error && <div className="error-message">{error}</div>}
              {submitted && <div className="success-message">{t('contact.success')}</div>}
            </form>

            <div className="faq-section" id="faq">
              <h2>{t('contact.faq')}</h2>
              <p className="faq-intro">{t('contact.faqIntro')}</p>

              <div className="faq-accordion">
                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q1')}</summary>
                  <div className="faq-answer">
                    {t('faq.a1')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q2')}</summary>
                  <div className="faq-answer">
                    {t('faq.a2')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q3')}</summary>
                  <div className="faq-answer">
                    {t('faq.a3')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q4')}</summary>
                  <div className="faq-answer">
                    {t('faq.a4')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q5')}</summary>
                  <div className="faq-answer">
                    {t('faq.a5')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q6')}</summary>
                  <div className="faq-answer">
                    {t('faq.a6')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q7')}</summary>
                  <div className="faq-answer">
                    {t('faq.a7')}
                  </div>
                </details>

                <details className="faq-details">
                  <summary className="faq-summary">{t('faq.q8')}</summary>
                  <div className="faq-answer">
                    {t('faq.a8')}
                  </div>
                </details>
              </div>

              <div className="faq-footer">
                <p>{t('faq.stillQuestions')}</p>
                <p className="faq-footer-text">{t('faq.contactSupport')}</p>
              </div>
            </div>
          </div>

          <div className="contact-info-section">
            <h2>{t('contact.info')}</h2>
            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">📧</div>
                <h3>{t('contact.emailSupport')}</h3>
                <p>{t('about.supportEmail')}</p>
                <p className="method-detail">{t('contact.emailSupportDesc')}</p>
              </div>

              <div className="contact-method">
                <div className="method-icon">💬</div>
                <h3>{t('contact.socialMedia')}</h3>
                <div className="social-links">
                  <a href="https://www.facebook.com/xyvn" target="_blank" rel="noopener noreferrer">Facebook (ARVIX)</a>
                  <a href="https://x.com/xyvn" target="_blank" rel="noopener noreferrer">X (ARVIX)</a>
                  <a href="https://www.instagram.com/xyvn/" target="_blank" rel="noopener noreferrer">Instagram (ARVIX)</a>
                  <a href="https://www.youtube.com/@ARVIX" target="_blank" rel="noopener noreferrer">YouTube (ARVIX)</a>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">📍</div>
                <h3>{t('contact.office')}</h3>
                <p>{t('contact.officeLocation')}</p>
                <p className="method-detail">{t('contact.officeHours')}</p>
              </div>

              <div className="contact-method">
                <div className="method-icon">📚</div>
                <h3>{t('contact.faq')}</h3>
                <p>{t('contact.faqDesc')}</p>
                <a
                  href="#faq"
                  className="method-link"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('contact.viewFaq')}
                </a>
              </div>
            </div>
          </div>

          <div className="response-info">
            <h3>{t('contact.expect')}</h3>
            <div className="expectation-grid">
              <div className="expectation-item">
                <h4>{t('contact.responseTime')}</h4>
                <p>{t('contact.responseTimeDesc')}</p>
              </div>
              <div className="expectation-item">
                <h4>{t('contact.supportHours')}</h4>
                <p>{t('contact.supportHoursDesc')}</p>
              </div>
              <div className="expectation-item">
                <h4>{t('contact.languages')}</h4>
                <p>{t('contact.languagesDesc')}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
