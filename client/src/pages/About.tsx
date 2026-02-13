import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero__image">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80" 
            alt="Arvix Workspace" 
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
            }}
          />
          <div className="about-hero__overlay" />
        </div>
        <div className="container">
          <Reveal>
            <div className="about-hero__content">
              <h1>About Arvix</h1>
              <p>Designing tools that enhance everyday life through minimalist innovation</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            <Reveal delayMs={60}>
              <div className="stat-item">
                <div className="stat-value">50+</div>
                <div className="stat-label">Products</div>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="stat-item">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
            </Reveal>
            <Reveal delayMs={180}>
              <div className="stat-item">
                <div className="stat-value">25+</div>
                <div className="stat-label">Countries</div>
              </div>
            </Reveal>
            <Reveal delayMs={240}>
              <div className="stat-item">
                <div className="stat-value">99%</div>
                <div className="stat-label">Satisfaction</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="about-content">
          <Reveal>
            <div className="about-section">
              <h2>Our Story</h2>
              <p>
                Arvix began with a simple question: How can we make everyday tools better? 
                From this question grew a commitment to minimalist design, functional innovation, and exceptional quality.
              </p>
              <p>
                We believe that the best tools are those that disappear into your daily routine, 
                working seamlessly until you forget they're even there. That's why every Arvix product 
                is designed with purpose, precision, and an unwavering attention to detail.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="about-section">
              <h2>Our Philosophy</h2>
              <div className="philosophy-grid">
                <Reveal delayMs={60}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">🎯</div>
                    <h3>Purpose-Driven Design</h3>
                    <p>Every product starts with a clear purpose and solves a real problem</p>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">⚡</div>
                    <h3>Minimalist Efficiency</h3>
                    <p>Less complexity, more functionality in every interaction</p>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">🔧</div>
                    <h3>Craftsmanship</h3>
                    <p>Premium materials and precision manufacturing</p>
                  </div>
                </Reveal>
                <Reveal delayMs={240}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">🚀</div>
                    <h3>Innovation</h3>
                    <p>Pushing boundaries of what everyday tools can be</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          {/* Timeline Section */}
          <Reveal>
            <div className="about-section">
              <h2>Our Journey</h2>
              <div className="timeline">
                <Reveal delayMs={60}>
                  <div className="timeline-item">
                    <div className="timeline-year">2020</div>
                    <div className="timeline-content">
                      <h4>Founded</h4>
                      <p>Arvix was born from a passion for minimalist design</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="timeline-item">
                    <div className="timeline-year">2021</div>
                    <div className="timeline-content">
                      <h4>First Product Launch</h4>
                      <p>Introduced our flagship productivity tools</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="timeline-item">
                    <div className="timeline-year">2022</div>
                    <div className="timeline-content">
                      <h4>Global Expansion</h4>
                      <p>Reached customers in 25+ countries</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={240}>
                  <div className="timeline-item">
                    <div className="timeline-year">2024</div>
                    <div className="timeline-content">
                      <h4>Innovation Continues</h4>
                      <p>50+ products and growing</p>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="about-section">
              <h2>Our Commitment</h2>
              <div className="commitment-list">
                <Reveal delayMs={60}>
                  <div className="commitment-item">
                    <h4>Quality Assurance</h4>
                    <p>Every product undergoes rigorous testing to ensure reliability and durability</p>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="commitment-item">
                    <h4>Sustainable Practices</h4>
                    <p>Environmentally conscious materials and responsible manufacturing processes</p>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="commitment-item">
                    <h4>Customer Focus</h4>
                    <p>Your satisfaction drives our innovation and improvement</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          {/* Image Gallery */}
          <Reveal>
            <div className="about-section">
              <h2>Behind the Scenes</h2>
              <div className="gallery-grid">
                <Reveal delayMs={60}>
                  <div className="gallery-item gallery-item--large">
                    <img 
                      src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" 
                      alt="Workspace" 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                    />
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="gallery-item">
                    <img 
                      src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80" 
                      alt="Products" 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                    />
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="gallery-item">
                    <img 
                      src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80" 
                      alt="Design" 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                    />
                  </div>
                </Reveal>
                <Reveal delayMs={240}>
                  <div className="gallery-item gallery-item--wide">
                    <img 
                      src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80" 
                      alt="Studio" 
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
                      }}
                    />
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="about-section">
              <h2>Get in Touch</h2>
              <div className="contact-info">
                <Reveal delayMs={60}>
                  <div className="contact-item">
                    <h4>Customer Support</h4>
                    <p>support@xyvn.com</p>
                    <p>Mon-Fri: 9:00 AM - 6:00 PM (GMT+8)</p>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="contact-item">
                    <h4>Media Inquiries</h4>
                    <p>media@xyvn.com</p>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="contact-item">
                    <h4>Business Partnerships</h4>
                    <p>partnerships@xyvn.com</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="cta-section">
              <Link to="/collections/productivity" className="btn-primary">
                Explore Our Products
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default About;
