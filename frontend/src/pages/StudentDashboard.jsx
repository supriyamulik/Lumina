import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LuminaLogo } from '../components/BrandLogo';
import EnlightenmentScene from '../components/EnlightenmentScene';
import DiyaGuru from '../components/DiyaGuru';
import Companion from '../components/interactive/Companion';
import reactionService from '../services/reactionService';
import { useAccessibility } from '../contexts/AccessibilityContext';

// 🎨 Dyslexia-Friendly Pure Neutral Palette
const C = {
  navy: '#0F172A',
  blue: '#2563EB', // Fixed Primary Blue (Accessible contrast)
  slate: '#F8FAFC', // Near-white Slate background
  white: '#FFFFFF',
  text: '#1E293B',
  textSoft: '#64748B',
  border: '#E2E8F0',
  amber: '#F59E0B'
};

const Fonts = {
  heading: "'Fraunces', serif",
  body: "'Nunito', sans-serif"
};

const Icons = {
  Home: () => <span>🏠</span>,
  Book: () => <span>📖</span>,
  Game: () => <span>🎮</span>,
  Flask: () => <span>🧪</span>,
  Settings: () => <span>⚙️</span>,
  EBook: () => <span>📚</span>,
  Language: () => <span>🌐</span>,
  Font: () => <span>🔤</span>
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile() || { profile: null };
  const { logoutChild } = useAuth();
  const { t, i18n } = useTranslation();
  const { isDyslexiaMode, toggleDyslexiaMode } = useAccessibility();

  const [currentView, setCurrentView] = useState('home'); // 'home', 'labs', 'settings'
  const [companionState, setCompanionState] = useState('idle');
  const [companionMsg, setCompanionMsg] = useState('');

  const [hoveredAction, setHoveredAction] = useState(null);

  useEffect(() => {
    const greetTimer = setTimeout(() => {
      setCompanionState('happy');
      setCompanionMsg(t('dashboard.companion_greeting', { name: profile?.name || 'Explorer' }));
      setTimeout(() => { setCompanionState('idle'); setCompanionMsg(''); }, 5000);
    }, 1500);
    return () => clearTimeout(greetTimer);
  }, [profile?.name, t]);

  const navItems = [
    { id: 'lessons', label: t('dashboard.lessons'), path: '/subjects', icon: Icons.Home },
    { id: 'games', label: t('dashboard.games'), path: '/games', icon: Icons.Game },
    { id: 'ebooks', label: t('dashboard.ebooks'), path: '/library', icon: Icons.EBook },
    { id: 'resources', label: 'Resources', action: () => setCurrentView('resources'), icon: Icons.Book },
    { id: 'labs', label: t('dashboard.labs'), action: () => setCurrentView('labs'), icon: Icons.Flask },
    { id: 'settings', label: t('dashboard.settings'), action: () => setCurrentView('settings'), icon: Icons.Settings }
  ];

  const assignments = [
    { id: 1, title: 'Math Adventures: Level 1', type: 'PDF', url: 'https://www.math-drills.com/addition/addition_0109_001.pdf', icon: '➕' },
    { id: 2, title: 'The Story Explorer: Worksheet', type: 'PDF', url: 'https://www.k5learning.com/free-reading-worksheets/first-grade-1/reading-comprehension/gr1-reading-comprehension-exercise-1.pdf', icon: '📝' },
    { id: 3, title: 'Dino-Phonics Weekly Practice', type: 'PDF', url: 'https://www.k5learning.com/free-phonics-worksheets/second-grade-2/vowels/vowel-sounds-of-y.pdf', icon: '🦖' }
  ];

  const videos = [
    { id: 1, title: 'Believe In Yourself 🚀', videoUrl: 'https://www.youtube-nocookie.com/embed/zN9XzB9B6Q0?autoplay=0&rel=0' },
    { id: 2, title: 'Never Give Up! ✨', videoUrl: 'https://www.youtube-nocookie.com/embed/GxDIsB9L_Sg?autoplay=0&rel=0' }
  ];

  const labs = [
    { id: 'math', label: t('labs.math'), icon: '➕', color: '#F59E0B', path: '/labs/math' },
    { id: 'sky-writer', label: t('labs.sky_writer'), icon: '✍️', color: '#EC4899', path: '/labs/sky-writer' },
    { id: 'forest-phonics', label: t('labs.forest_phonics'), icon: '🌳', color: '#10B981', path: '/labs/forest-phonics' },
    { id: 'sound-buttons', label: t('labs.sound_buttons'), icon: '🔘', color: '#3B82F6', path: '/labs/sound-buttons' },
    { id: 'dino-decoder', label: t('labs.dino_decoder'), icon: '🦖', color: '#8B5CF6', path: '/labs/dino-decoder' }
  ];

  const mainAreaStyle = {
    minHeight: '100vh',
    backgroundColor: C.slate,
    fontFamily: isDyslexiaMode ? "'OpenDyslexic', sans-serif" : Fonts.body,
  };

  const topBarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 40px',
    height: '80px',
    backgroundColor: C.white,
    borderBottom: `2.5px solid ${C.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const navLinkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 24px',
    borderRadius: '16px',
    color: isActive ? C.blue : C.textSoft,
    backgroundColor: isActive ? `${C.blue}08` : 'transparent',
    fontWeight: '900',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    fontFamily: 'inherit'
  });

  const guidedButtonStyle = (isPrimary, isHovered) => ({
    width: isPrimary ? '100%' : '100%',
    padding: isPrimary ? '60px 40px' : '40px 30px',
    backgroundColor: isPrimary ? C.blue : C.white,
    color: isPrimary ? C.white : C.text,
    border: isPrimary ? 'none' : `3px solid ${C.border}`,
    borderRadius: '32px',
    fontSize: isPrimary ? '2rem' : '1.5rem',
    fontWeight: '900',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
    textAlign: 'center'
  });

  const floatingControlStyle = {
    position: 'fixed',
    bottom: '40px',
    right: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 1000
  };

  const controlButtonStyle = {
    backgroundColor: C.white,
    border: `2.5px solid ${C.border}`,
    padding: '14px 24px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '900',
    color: C.text,
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  };

  return (
    <div style={mainAreaStyle}>
      {/* 🚥 TOP NAVIGATION */}
      <header style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => setCurrentView('home')}>
          <LuminaLogo size={32} color={C.blue} />
          <h1 style={{ fontFamily: Fonts.heading, fontSize: '1.8rem', fontWeight: 'bold', color: C.navy, margin: 0 }}>Lumina</h1>
        </div>

        <nav style={{ display: 'flex', gap: '10px' }}>
          {navItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                style={navLinkStyle(isActive)}
                onClick={() => item.action ? item.action() : navigate(item.path)}
              >
                <item.icon />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '8px 16px', backgroundColor: `${C.amber}15`, borderRadius: '14px', border: `2px solid ${C.amber}44`, color: C.amber, fontWeight: '900', fontSize: '0.9rem' }}>
          ✨ {profile?.name || 'Explorer'}
        </div>
      </header>

      {/* 🖼️ MAIN GUIDED AREA */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

        <DiyaGuru state={companionState} message={companionMsg} />

        {currentView === 'home' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <button
              style={guidedButtonStyle(true, hoveredAction === 'continue')}
              onMouseEnter={() => setHoveredAction('continue')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => navigate('/subjects')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ fontSize: '3.5rem' }}>🗺️</span>
                <span style={{ flex: 1 }}>{t('dashboard.continue_learning')}</span>
              </div>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <button
                style={guidedButtonStyle(false, hoveredAction === 'practice')}
                onMouseEnter={() => setHoveredAction('practice')}
                onMouseLeave={() => setHoveredAction(null)}
                onClick={() => setCurrentView('labs')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2.5rem' }}>🧪</span>
                  <span>{t('dashboard.practice')}</span>
                </div>
              </button>

              <button
                style={guidedButtonStyle(false, hoveredAction === 'story')}
                onMouseEnter={() => setHoveredAction('story')}
                onMouseLeave={() => setHoveredAction(null)}
                onClick={() => navigate('/library')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2.5rem' }}>📖</span>
                  <span>{t('dashboard.story')}</span>
                </div>
              </button>
            </div>
          </div>
        ) : currentView === 'labs' ? (
          /* 🧪 LABS ONE-BY-ONE GALLERY */
          <div>
            <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setCurrentView('home')} style={{ color: C.textSoft, background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '1.2rem' }}>← {t('common.back')}</button>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: Fonts.heading, margin: 0 }}>{t('dashboard.labs')}</h2>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {labs.map(lab => (
                <button
                  key={lab.id}
                  onClick={() => navigate(lab.path)}
                  style={{
                    padding: '32px',
                    borderRadius: '24px',
                    backgroundColor: C.white,
                    border: `3px solid ${lab.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = lab.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = `${lab.color}22`;
                  }}
                >
                  <div style={{ fontSize: '3rem', width: '80px', height: '80px', backgroundColor: `${lab.color}15`, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {lab.icon}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: C.navy }}>{lab.label}</h3>
                    <p style={{ color: C.textSoft, fontWeight: 700, margin: '4px 0 0 0' }}>Explore and learn in one click!</p>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '1.5rem', color: lab.color }}>→</div>
                </button>
              ))}
            </div>
          </div>
        ) : currentView === 'resources' ? (
          /* 📚 RESOURCES VIEW */
          <div>
            <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setCurrentView('home')} style={{ color: C.textSoft, background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '1.2rem' }}>← {t('common.back')}</button>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: Fonts.heading, margin: 0 }}>Resources</h2>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px' }}>
              {/* Video Section */}
              <section>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  📺 Motivational Videos
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                  {videos.map(v => (
                    <div key={v.id} style={{ backgroundColor: C.white, padding: '20px', borderRadius: '24px', border: `2.5px solid ${C.border}`, boxShadow: '0 8px 16px -4px rgba(0,0,0,0.05)' }}>
                      <iframe
                        width="100%"
                        height="240"
                        src={v.videoUrl.replace('youtube.com', 'youtube-nocookie.com')}
                        title={v.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ borderRadius: '16px', marginBottom: '16px' }}
                      ></iframe>
                      <p style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>{v.title}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Assignments Section */}
              <section>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  📙 Home Assignments
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {assignments.map(a => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '24px',
                        borderRadius: '20px',
                        backgroundColor: C.white,
                        border: `2.5px solid ${C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = C.blue;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = C.border;
                      }}
                    >
                      <span style={{ fontSize: '2rem' }}>{a.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 900, fontSize: '1rem', color: C.text, margin: 0 }}>{a.title}</p>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.textSoft }}>View PDF Assignment</span>
                      </div>
                      <span style={{ color: C.blue, fontWeight: 900 }}>↓</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : (
          /* ⚙️ SETTINGS VIEW */
          <div style={{ backgroundColor: C.white, borderRadius: '32px', padding: '40px', border: `3px solid ${C.border}` }}>
            <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setCurrentView('home')} style={{ color: C.textSoft, background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: '1.2rem' }}>← {t('common.back')}</button>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: Fonts.heading, margin: 0 }}>{t('dashboard.settings')}</h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontWeight: 700, color: C.textSoft }}>Manage your profile and learning preferences here.</p>
              <button onClick={logoutChild} style={{ backgroundColor: '#EF4444', color: '#fff', padding: '15px 30px', borderRadius: '14px', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
                {t('common.logout')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 🔤 FIXED ACCESSIBILITY CONTROLS */}
      <div style={floatingControlStyle}>
        {/* Language Selection Pop-up / Button */}
        <div style={{ position: 'relative' }}>
          <select
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            value={i18n.language}
            style={controlButtonStyle}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="hi">🇮🇳 HI</option>
            <option value="mr">🇮🇳 MR</option>
            <option value="kn">🇮🇳 KN</option>
          </select>
        </div>

        <button
          onClick={toggleDyslexiaMode}
          style={{
            ...controlButtonStyle,
            backgroundColor: isDyslexiaMode ? C.blue : C.white,
            color: isDyslexiaMode ? C.white : C.text,
            borderColor: isDyslexiaMode ? C.blue : C.border
          }}
        >
          <Icons.Font />
          {isDyslexiaMode ? 'DYSLEXIC FONT: ON' : 'DYSLEXIC FONT: OFF'}
        </button>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        button:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}
