import React from 'react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header Section */}
      <header className="header">
        <div className="logo">
          <span className="logo-text">Curely</span>
        </div>
        <nav className="nav">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="#about">About</a>
          <div className="auth-buttons">
            <a href="/login" className="btn btn-outline">Login</a>
            <a href="/signup" className="btn btn-filled">Sign Up</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Your Health, Unified.</h1>
          <p className="subtitle">One secure platform for all your healthcare needs.</p>
          <div className="hero-buttons">
            <a href="/signup" className="btn btn-primary">Get Started</a>
            <a href="#learn-more" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-image">
          {/* You can add an image here */}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Why Choose Curely?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="icon-centralized"></i>
            </div>
            <h3>Centralized Records</h3>
            <p>All your medical history in one place - no more fragmented care.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="icon-access"></i>
            </div>
            <h3>Instant Access</h3>
            <p>Access your health data anytime, anywhere from any device.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <i className="icon-collaboration"></i>
            </div>
            <h3>Provider Collaboration</h3>
            <p>Enable seamless communication between all your healthcare providers.</p>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="security">
        <div className="security-content">
          <h2>Your Data's Safety Is Our Priority</h2>
          <div className="security-features">
            <div className="security-item">
              <h3>End-to-End Encryption</h3>
              <p>Your health information is encrypted using military-grade protocols, ensuring only you and your authorized providers can access it.</p>
            </div>
            <div className="security-item">
              <h3>HIPAA Compliant</h3>
              <p>We adhere to all healthcare privacy regulations to protect your sensitive information.</p>
            </div>
            <div className="security-item">
              <h3>Full Transparency</h3>
              <p>Complete audit trails show you exactly who accessed your information and when.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Centralization Benefits */}
      <section className="centralization">
        <h2>The Power of Healthcare Centralization</h2>
        <div className="centralization-grid">
          <div className="centralization-item">
            <h3>Reduced Medical Errors</h3>
            <p>When providers have access to your complete medical history, they make more informed decisions.</p>
          </div>
          <div className="centralization-item">
            <h3>Better Health Outcomes</h3>
            <p>Coordinated care leads to better treatment plans and improved patient outcomes.</p>
          </div>
          <div className="centralization-item">
            <h3>Lower Healthcare Costs</h3>
            <p>Avoid duplicate tests and procedures by sharing results across providers.</p>
          </div>
          <div className="centralization-item">
            <h3>Personalized Care</h3>
            <p>Data-driven insights help create customized healthcare plans tailored to your needs.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <div className="testimonial-container">
          <div className="testimonial">
            <p>"Curely has transformed how I manage my family's healthcare. Everything we need is in one secure place."</p>
            <div className="testimonial-author">- Sarah M.</div>
          </div>
          <div className="testimonial">
            <p>"As a physician, I can now see my patients' complete history, helping me make better clinical decisions."</p>
            <div className="testimonial-author">- Dr. James Wilson</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to Take Control of Your Healthcare?</h2>
        <p>Join thousands of users who've simplified their healthcare journey with Curely.</p>
        <a href="/signup" className="btn btn-primary btn-large">Sign Up Free</a>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Curely</h3>
            <p>Your unified healthcare platform for secure, centralized medical data management.</p>
          </div>
          <div className="footer-section">
            <h3>Links</h3>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: support@curely.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Curely. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
