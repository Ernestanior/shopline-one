import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Reveal from '../components/Reveal';
import './About.css';

const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero__image">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80" 
            alt="ARVIX Workspace" 
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
              <h1>{t('about.title')}</h1>
              <p>{t('about.subtitle')}</p>
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
                <div className="stat-label">{t('about.stats.products')}</div>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className="stat-item">
                <div className="stat-value">10K+</div>
                <div className="stat-label">{t('about.stats.customers')}</div>
              </div>
            </Reveal>
            <Reveal delayMs={180}>
              <div className="stat-item">
                <div className="stat-value">25+</div>
                <div className="stat-label">{t('about.stats.countries')}</div>
              </div>
            </Reveal>
            <Reveal delayMs={240}>
              <div className="stat-item">
                <div className="stat-value">99%</div>
                <div className="stat-label">{t('about.stats.satisfaction')}</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="about-content">
          <Reveal>
            <div className="about-section">
              <h2>{t('about.story')}</h2>
              <p>
                {t('about.storyText1')}
              </p>
              <p>
                {t('about.storyText2')}
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="about-section">
              <h2>{t('about.philosophy')}</h2>
              <div className="philosophy-grid">
                <Reveal delayMs={60}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">🎯</div>
                    <h3>{t('about.philosophy.purpose')}</h3>
                    <p>{t('about.philosophy.purposeDesc')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">⚡</div>
                    <h3>{t('about.philosophy.minimal')}</h3>
                    <p>{t('about.philosophy.minimalDesc')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">🔧</div>
                    <h3>{t('about.philosophy.craft')}</h3>
                    <p>{t('about.philosophy.craftDesc')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={240}>
                  <div className="philosophy-item">
                    <div className="philosophy-icon">🚀</div>
                    <h3>{t('about.philosophy.innovation')}</h3>
                    <p>{t('about.philosophy.innovationDesc')}</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          {/* Timeline Section */}
          <Reveal>
            <div className="about-section">
              <h2>{t('about.journey')}</h2>
              <div className="timeline">
                <Reveal delayMs={60}>
                  <div className="timeline-item">
                    <div className="timeline-year">2020</div>
                    <div className="timeline-content">
                      <h4>{t('about.journey.2020')}</h4>
                      <p>{t('about.journey.2020desc')}</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="timeline-item">
                    <div className="timeline-year">2021</div>
                    <div className="timeline-content">
                      <h4>{t('about.journey.2021')}</h4>
                      <p>{t('about.journey.2021desc')}</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="timeline-item">
                    <div className="timeline-year">2022</div>
                    <div className="timeline-content">
                      <h4>{t('about.journey.2022')}</h4>
                      <p>{t('about.journey.2022desc')}</p>
                    </div>
                  </div>
                </Reveal>
                <Reveal delayMs={240}>
                  <div className="timeline-item">
                    <div className="timeline-year">2024</div>
                    <div className="timeline-content">
                      <h4>{t('about.journey.2024')}</h4>
                      <p>{t('about.journey.2024desc')}</p>
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
                    <h4>{t('about.commitment.quality')}</h4>
                    <p>{t('about.commitment.qualityDesc')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="commitment-item">
                    <h4>Sustainable Practices</h4>
                    <p>{t('about.commitment.sustainableDesc')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="commitment-item">
                    <h4>{t('about.commitment.customer')}</h4>
                    <p>{t('about.commitment.customerDesc')}</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          {/* Image Gallery */}
          <Reveal>
            <div className="about-section">
              <h2>{t('about.behind')}</h2>
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
              <h2>{t('about.getInTouch')}</h2>
              <div className="contact-info">
                <Reveal delayMs={60}>
                  <div className="contact-item">
                    <h4>{t('about.support')}</h4>
                    <p>{t('about.supportEmail')}</p>
                    <p>{t('about.supportHours')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={120}>
                  <div className="contact-item">
                    <h4>{t('about.media')}</h4>
                    <p>{t('about.mediaEmail')}</p>
                  </div>
                </Reveal>
                <Reveal delayMs={180}>
                  <div className="contact-item">
                    <h4>{t('about.partnerships')}</h4>
                    <p>{t('about.partnershipsEmail')}</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="cta-section">
              <Link to="/collections/productivity" className="btn-primary">
                {t('home.collections.viewAll')}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default About;
