<template>
  <div class="page">

  <!-- 
<div v-if="maintenanceMode" class="maintenance-overlay">
  <div class="maintenance-box">
    <div class="warning-top">
      <span class="warning-icon">⚠</span>
    </div>

    <h1>MAINTENANCE MODE</h1>

    <p>
      This system is currently under maintenance.<br />
      Do not access at this time.
    </p>

    <span class="maintenance-sub">
      Please leave the page and come back later.
    </span>

  </div>
</div>
 -->


    <!-- TOP NAVBAR -->

<header 
  class="navbar" 
  :class="{ 'hide': hideNav, 'scrolled': isScrolled }"
>
  <div class="nav-inner">
    <div class="nav-left">
      <img 
        :src="isScrolled ? logoScrolled : logoDefault" 
        class="logo" 
        alt="PWD EAP Logo"
        @click="scrollTop" 
      />
    </div>

    
    <nav class="nav-center">
      <div 
        v-for="item in navItems" 
        :key="item.id" 
        class="nav-item"
        @mouseenter="openDropdown = item.id"
        @mouseleave="openDropdown = null"
      >
        <a href="#" class="nav-link" @click.prevent="onNavClick(item)">
          {{ item.label }}
          <svg 
            v-if="item.children" 
            class="dropdown-arrow" 
            :class="{ rotate: openDropdown === item.id }"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </a>

        <transition name="dropdown-slide">
          <div 
            v-if="item.children && openDropdown === item.id" 
            class="dropdown-menu"
          >
            <a 
              v-for="child in item.children" 
              :key="child.id" 
              href="#" 
              class="dropdown-item"
              @click.prevent="scrollTo(child.id)"
            >
              {{ child.label }}
            </a>
          </div>
        </transition>
      </div>
    </nav>

    <div class="nav-right">
      <div class="nav-actions">
        <router-link to="/find-jobs" class="btn btn-find">
          Find Job
        </router-link>
        <router-link to="/login" class="btn btn-login">
          Login
        </router-link>
      </div>
      
      <button class="mobile-toggle" @click="isMobileMenuOpen = !isMobileMenuOpen">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</header>

    <!-- HERO -->
    <section id="home" class="hero">
      <div class="hero-content">

        <h1>
          Employment Assistance Platform for PWD in The City of
          Dasmarinas with Decision Support System
        </h1>
        <p class="hero-desc">
          Connecting PWDs to inclusive job opportunities through smart decision support.
        </p>
        <div class="hero-actions">
          <router-link to="/find-jobs" class="btn hero-btn primary">Find a Job</router-link>
        </div>
      </div>
    </section>

    <!-- ABOUT -->
    <section id="about" class="section">
      <h2>About the Platform</h2>

      <div class="card-grid">
        <div class="info-card">
          <i class="bi bi-people-fill info-icon" aria-hidden="true"></i>
          <h3>Inclusive Hiring</h3>
          <p>Designed to help PWDs find fair and accessible employment.</p>
        </div>

        <div class="info-card">
          <i class="bi bi-graph-up-arrow info-icon" aria-hidden="true"></i>
          <h3>Decision Support</h3>
          <p>Helps employers choose the right candidate effectively.</p>
        </div>

        <div class="info-card">
          <i class="bi bi-geo-alt-fill info-icon" aria-hidden="true"></i>
          <h3>Community Focus</h3>
          <p>Built specifically for the City of Dasmarinas.</p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="contact" class="faq-section">
      <div class="faq-header">
        <span class="faq-badge">Frequently Asked Questions</span>
        <h2>Common Questions & Answers</h2>
        <p>Everything you need to know about our platform</p>
      </div>

      <div
        v-for="(faq, index) in faqs"
        :key="index"
        class="faq-item"
      >
        <div class="faq-question" @click="toggleFaq(index)">
          {{ faq.q }}
          <span class="arrow" :class="{ open: activeFaq === index }">⌄</span>
        </div>

   <transition name="faq-slide">
  <div v-show="activeFaq === index" class="faq-answer">
    {{ faq.a }}
  </div>
</transition>

      </div>
    </section>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-brand">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h2 class="logo-type">PWD <span>EAP</span></h2>
        </div>
        <p class="brand-text">
          A Decision Support System-powered platform bridging the gap between talent and inclusive opportunity.
        </p>
        <div class="social-wrapper">
          <a href="#" class="social-link" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#" class="social-link" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="#" class="social-link" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
        </div>
      </div>

      <div class="footer-nav">
        <div class="nav-group">
          <h3>Services</h3>
          <ul>
            <li><a href="#">Job Matching</a></li>
            <li><a href="#">DSS Analysis</a></li>
            <li><a href="#">Employer Portal</a></li>
          </ul>
        </div>

        <div class="nav-group">
          <h3>Information</h3>
          <ul>
            <li><a href="#">Accessibility Guide</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Documentation</a></li>
          </ul>
        </div>

        <div class="nav-group">
          <h3>Contact Us</h3>
          <ul>
            <li><a href="mailto:contact@pwdeap.ph">contact@pwdeap.ph</a></li>
            <li><a href="tel:+6328000000">+63 (2) 800-0000</a></li>
            <li><a href="#">Support Ticket</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="bottom-inner">
        <p>&copy; 2026 PWD Employment Assistance Platform. Developed for Research Purposes.</p>
        <div class="status-indicator">
          <span class="status-dot"></span> System Operational
        </div>
      </div>
    </div>
  </footer>
  </div>
</template>

<script>
import logoDefault from "@/assets/titlelogo.png";
import logoScrolled from "@/assets/titlelogo-white.png";

export default {
  name: "LandingPage",

  data() {
    return {
      logoDefault,
      logoScrolled,
        maintenanceMode: true, // 🔥 toggle mo lang to false pag live na
      openDropdown: null,
      lastY: 0,
      hideNav: false,
      isScrolled: false,
      activeFaq: null,

      navItems: [
        { id: "home", label: "Home" },
        {
          id: "about",
          label: "About",
          children: [
            { id: "about", label: "Overview" },
            { id: "mission", label: "Mission" }
          ]
        },
        {
          id: "jobs",
          label: "Jobs",
          children: [
            { id: "find-jobs", label: "Find Jobs" },
            { id: "post-job", label: "Post Job" }
          ]
        },
        { id: "contact", label: "Contact" }
      ],

     faqs: [
  {
    q: "What is this system all about?",
    a: "This system is a web-based job employment assistance platform developed to help Persons with Disabilities (PWDs) find suitable and inclusive employment opportunities in the City of Dasmarinas using a Decision Support System."
  },
  {
    q: "Who are the intended users of the system?",
    a: "The system is intended for Persons with Disabilities (PWDs), employers, and administrators who manage job postings and applicant matching."
  },
  {
    q: "What is the purpose of the Decision Support System?",
    a: "The Decision Support System helps analyze applicants’ skills, qualifications, and preferences to recommend the most suitable job opportunities."
  },
  {
    q: "How does the system help PWD job seekers?",
    a: "The system allows PWD job seekers to create profiles, upload resumes, and receive job recommendations based on their abilities and skills."
  },
  {
    q: "How does the system help employers?",
    a: "Employers can post job vacancies and view recommended PWD applicants who best match their job requirements."
  },
  {
    q: "Is the system free to use?",
    a: "Yes. The system is free to use for PWD job seekers and registered employers."
  }
]

    };
  },
mounted() {
  window.addEventListener("scroll", this.onScroll, { passive: true });
},
beforeUnmount() {
  window.removeEventListener("scroll", this.onScroll);
},

methods: {
toggleFaq(i) {
  if (this.activeFaq === i) {
    // Start the closing animation transition first
    // We wait 200ms before setting to null so Vue doesn't 
    // unmount the content before the slide-up finishes.
    setTimeout(() => {
      if (this.activeFaq === i) {
        this.activeFaq = null;
      }
    }, 200); 
  } else {
    this.activeFaq = i;
  }
},


  onNavClick(item) {
    if (item.children) {
      this.openDropdown =
        this.openDropdown === item.id ? null : item.id;
    } else {
      this.scrollTo(item.id);
    }
  },

  scrollTo(id) {
    this.openDropdown = null;
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth"
    });
  },

  scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  onScroll() {
    const y = window.scrollY;
    this.hideNav = y > this.lastY && y > 120;
    this.isScrolled = y > 10;
    this.lastY = y;
  },

  closeDropdown(e) {
    if (!e.target.closest(".nav-item")) {
      this.openDropdown = null;
    }
  }
}

};
</script>

<style scoped>
/* GLOBAL */
:global(html),
:global(body),
:global(#app){
  height:auto;
  overflow-y:auto;
  overflow-x:hidden;
}

.page{
  background:#f6f7fb;
}
/* NAVBAR BASE */
/* NAVBAR CONTAINER */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 85px;
  color: black;
  background-color: #ffffff; /* Solid Slate for initial visibility */
  display: flex;
  align-items: center;
  transition: all 0.3s ease-in-out;
  z-index: 1000;
  padding: 0 4%;
  box-sizing: border-box;
}

/* SCROLLED STATE (Glassmorphism) */
.navbar.scrolled {
  height: 75px;
  background-color: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.navbar.hide {
  transform: translateY(-100%);
}

.nav-inner {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 1. LEFT SIDE: LOGO */
.nav-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.logo {
  height: 78px;
  cursor: pointer;
}

/* 2. CENTER: NAVIGATION LINKS (CRITICAL FIX) */
.nav-center {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-link {
  color: #000000;              /* default = black (white navbar) */
  text-decoration: none;
  font-size: 0.95rem;
  font-weight:500;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 0;
  transition: color 0.3s ease;
}
.nav-link:hover {
  color: #2563eb; /* blue hover sa white navbar */
}

.navbar.scrolled .nav-link:hover {
  color: #93c5fd; /* light blue hover sa dark navbar */
}

.navbar.scrolled .nav-link{
  color:#fff;                /* white text */
}

.dropdown-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

/* 3. DROPDOWN MENU (WHITE THEME FIX) */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff; /* WHITE BACKGROUND */
  min-width: 180px;
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  z-index: 1100;
  margin-top: 5px;
}

.dropdown-item {
  color: #1e293b; /* DARK TEXT */
  text-decoration: none;
  display: block;
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
  color: #38bdf8;
  padding-left: 20px;
}

/* 4. RIGHT SIDE: ACTION BUTTONS */
.nav-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.nav-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 12px 28px;
  border-radius: 999px;
  font-size: 0.9rem;
  min-width: 170px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
  white-space: nowrap;
}

.btn-find {
  background: #38bdf8;
  
  color: #0f172a;
  border: 1px solid #38bdf8;
  box-shadow: 0 10px 24px rgba(56, 189, 248, 0.35);
}

.btn-find:hover {
  background: #0ea5e9;
  transform: translateY(-2px);
}

.btn-login {
  color: #ffffff;
}

.btn-login:hover {
  background: rgba(26, 82, 0, 0.877);
   transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 179, 255, 0.3);
}

/* TRANSITIONS */
.dropdown-slide-enter-active, .dropdown-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-slide-enter-from, .dropdown-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

/* RESPONSIVE TOGGLE */
.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 15px;
}

.mobile-toggle span {
  width: 26px;
  height: 2px;
  background: #ffffff;
  border-radius: 2px;
}

/* MEDIA QUERIES */
@media (max-width: 1024px) {
  .nav-center {
    display: none; /* Hide for mobile menu logic */
  }
  .mobile-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .btn-login {
    display: none;
    
  }
  .navbar {
    padding: 0 20px;
    height: 70px;
  }
  .logo {
    height: 35px;
  }
}
/* HERO */
.hero{
  min-height:100vh;
  background:
    linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.65) 100%),
    url("@/assets/bg.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display:flex;
  justify-content:center;
  position: relative;
  align-items:center;
  text-align:center;
}

.hero::before{
  content:"";
  position:absolute;
  inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.7) 100%);
  pointer-events:none;
}

.hero-content{
  position:relative;
  z-index:1;
}

.hero-content{
  max-width:900px;
  padding:0 20px;
  text-align: center;
}

.hero-content h1{
  font-size:50px;
  color:#f8fafc;
  margin-bottom:20px;
}

.hero-desc{
  font-size:18px;
  color:#e2e8f0;
  line-height:1.6;
}

.hero-actions{
  margin-top:24px;
  display:flex;
  justify-content:center;
}

.hero-btn{
  
  border-radius:999px;
  font-size:0.85rem;
  font-weight:700;
  text-decoration:none;
  transition:all 0.25s ease;
  min-width:px;
  text-align:center;
  white-space:nowrap;
}

.hero-btn.primary{
  background:#38bdf8;
  color:#0f172a;
  box-shadow:0 10px 24px rgba(56, 189, 248, 0.35);
}

.hero-btn.primary:hover{
  background:#0ea5e9;
  transform:translateY(-2px);
}

/* SECTIONS */
.section{
  padding:140px 20px;
  background:white;
  text-align:center;
}

/* About section border */
#about.section{
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  margin: 0 6%;
}

.section.alt{
  background:#eef1f7;
}

h2{
  font-size:36px;
  margin-bottom:40px;
  color:#111;
}

/* CARD GRID */
.card-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit, minmax(250px,1fr));
  gap:30px;
  max-width:1100px;
  margin:auto;
}

/* INFO CARD */
.info-card,
.job-card{
  background:#fff;
  padding:30px;
  border-radius:16px;
  box-shadow:0 10px 25px rgba(0,0,0,.06);
  transition:.3s;
  cursor:pointer;
}

.info-card:hover,
.job-card:hover{
  transform:translateY(-8px);
  box-shadow:0 20px 40px rgba(0,0,0,.12);
}

.info-card h3,
.job-card h3{
  margin-bottom:10px;
  color:#0d6efd;
}

.info-icon{
  font-size:28px;
  color:#0d6efd;
  display:inline-flex;
  margin-bottom:12px;
}

/* MISSION */
.mission-box{
  max-width:800px;
  margin:auto;
  background:#fff;
  padding:40px;
  border-radius:20px;
  box-shadow:0 15px 35px rgba(0,0,0,.08);
  transition:.3s;
}

.mission-box:hover{
  transform:scale(1.02);
}

/* CTA */
.cta-box{
  max-width:600px;
  margin:auto;
  background:#fff;
  padding:40px;
  border-radius:20px;
  box-shadow:0 15px 35px rgba(0,0,0,.08);
  transition:.3s;
}

.cta-box:hover{
  transform:translateY(-6px);
}

/* CONTACT */
.contact-box{
  max-width:500px;
  margin:auto;
  background:#fff;
  padding:30px;
  border-radius:16px;
  box-shadow:0 12px 30px rgba(0,0,0,.08);
  transition:.3s;
}

.contact-box:hover{
  transform:translateY(-5px);
}

/* Main Layout & Dark Theme */
.footer {
  background: linear-gradient(165deg, #0a0c12 0%, #161b2a 100%);
  color: #e2e8f0;
  padding: 100px 5% 40px;
  font-family: 'Inter', -apple-system, sans-serif;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 80px;
}

/* Brand & Logo Section */
.footer-brand {
  flex: 0 1 400px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: #3b82f6;
  color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.logo-type {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -1px;
  color: #fff;
  margin: 0;
}

.logo-type span {
  color: #3b82f6;
}

.brand-text {
  color: #94a3b8;
  line-height: 1.8;
  font-size: 0.95rem;
  margin-bottom: 30px;
}

/* Link Columns */
.footer-nav {
  display: flex;
  flex: 1;
  justify-content: space-between;
  gap: 40px;
}

.nav-group h3 {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 25px;
}

.nav-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-group li {
  margin-bottom: 15px;
}

.nav-group a {
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-group a:hover {
  color: #3b82f6;
  padding-left: 8px;
}

/* Social Media Section */
.social-wrapper {
  display: flex;
  gap: 12px;
}

.social-link {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.social-link svg {
  width: 18px;
  height: 18px;
}

.social-link:hover {
  background: #3b82f6;
  color: #fff;
  transform: translateY(-5px);
  border-color: #3b82f6;
}

/* Bottom Copyright Bar */
.footer-bottom {
  margin-top: 80px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.bottom-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #64748b;
  font-size: 0.85rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .footer-container {
    flex-direction: column;
    gap: 60px;
  }
  .footer-brand {
    max-width: 100%;
    text-align: center;
  }
  .logo-wrapper, .social-wrapper {
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .footer-nav {
    flex-direction: column;
    gap: 40px;
    text-align: center;
  }
  .bottom-inner {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}




















.faq-section{
  padding:140px 200px;
  background:#fff;

}
.faq-header{
  text-align:center;
  margin-bottom:50px;
}

.faq-badge{
  background:#e8f0ff;
  color:#0d6efd;
  padding:6px 14px;
  border-radius:20px;
  font-size:13px;
}

.faq-header h2{
  font-size:42px;
  margin:20px 0 10px;
}

.faq-header p{
  color:#555;
}

/* FAQ LIST */

.faq-list{
  max-width:800px;
  margin:auto;
}


.faq-question{
  padding:22px;
  font-weight:600;
  cursor:pointer;
  display:flex;
  justify-content:space-between;
  align-items:center;

  border:1px solid #e5e7eb;     /* ✅ BORDER */
  border-radius:8px;            /* ✅ ROUNDED CORNER */

  transition:
    background-color .15s ease,
    border-color .15s ease;
}

.faq-question:hover{
  background:#f8fafc;
  border-color:#c7d2fe;         /* subtle hover */
}

/* ARROW */
.arrow{
  transition:transform .2s ease;
}

.arrow.open{
  transform:rotate(180deg);
}

/* ANSWER */
.faq-answer{
  padding:12px 22px 22px;
  color:#555;
}

/* This ensures the FAQ item doesn't collapse the layout instantly */
.faq-item {
  overflow: hidden;
  backface-visibility: hidden; /* Helps with GPU rendering lag */
}

/* The transition configuration */
.faq-slide-enter-active,
.faq-slide-leave-active {
  transition: max-height 0.4s ease, opacity 0.3s ease, padding 0.4s ease;
  max-height: 500px; /* Set higher than your tallest answer */
}

/* The 'Closed' state */
.faq-slide-enter-from,
.faq-slide-leave-to {
  max-height: 0 !important;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin: 0 !important;
}

/* Prevent Footer lag by isolating the section */
.faq-section {
  contain: content; /* Tells the browser this section's changes don't affect global layout */
  min-height: 400px; /* Optional: keeps the section from shrinking too much */
}

/* ================= MAINTENANCE OVERLAY ================= */

.maintenance-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.95); /* dark blur */
  backdrop-filter: blur(6px);
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.maintenance-box {
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 60px 70px;
  border-radius: 20px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.6);
  animation: fadeInUp .5s ease;
}

.maintenance-box h1 {
  font-size: 42px;
  color: #facc15; /* warning yellow */
  margin-bottom: 20px;
  letter-spacing: 1px;
}

.maintenance-box p {
  font-size: 18px;
  color: #e5e7eb;
  line-height: 1.6;
}

.maintenance-sub {
  display: block;
  margin-top: 18px;
  font-size: 14px;
  color: #94a3b8;
  letter-spacing: .5px;
}

/* subtle entrance animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* WARNING BLINK */

.warning-wrap{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:14px;
  margin-bottom:20px;
}

.warning-icon{
  font-size:46px;
  color:#facc15;
  animation: blink 1.2s infinite;
}

/* subtle blink only (not flashy) */
@keyframes blink{
  0%{ opacity:1; }
  50%{ opacity:.3; }
  100%{ opacity:1; }
}

</style>
