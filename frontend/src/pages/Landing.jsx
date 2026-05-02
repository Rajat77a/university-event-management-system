import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

const eventImages = {
  Technical: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800'],
  Cultural: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800'],
  Sports: ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', 'https://images.unsplash.com/photo-1542652694-40abf526446e?w=800', 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800'],
  Workshop: ['https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800'],
  Academic: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800'],
};

const floatingTags = [
  { label: '🎭 Cultural Events', color: '#ec4899', delay: 0, side: 'left', top: '25%' },
  { label: '💻 Tech Symposium', color: '#3b82f6', delay: 1, side: 'right', top: '30%' },
  { label: '🏆 Sports Meet', color: '#22c55e', delay: 2, side: 'left', top: '55%' },
  { label: '🎓 Academic Fest', color: '#8b5cf6', delay: 0.5, side: 'right', top: '55%' },
  { label: '🔧 Workshops', color: '#f59e0b', delay: 1.5, side: 'left', top: '70%' },
  { label: '🎵 Music Events', color: '#06b6d4', delay: 2.5, side: 'right', top: '70%' },
];

const EventCard = ({ event }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images = eventImages[event.category] || eventImages.Technical;
  useEffect(() => {
    const interval = setInterval(() => setImgIndex(i => (i + 1) % images.length), 2000);
    return () => clearInterval(interval);
  }, [images.length]);
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -10 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{ background: '#111', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid #222' }}>
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        <motion.img src={images[imgIndex]} alt={event.title} animate={{ opacity: [0, 1] }} transition={{ duration: 0.5 }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, background: '#3b82f6', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: '#fff' }}>{event.category}</div>
      </div>
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8, color: '#fff' }}>{event.title}</h3>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{new Date(event.startDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        <p style={{ fontSize: 13, color: '#666' }}>📍 {event.venueName}, {event.buildingName}</p>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#22c55e' }}>🟢 {event.capacityLimit - event.registrationCount} seats left</span>
          <span style={{ fontSize: 12, color: '#3b82f6' }}>{event.status}</span>
        </div>
      </div>
    </motion.div>
  );
};

const ParticlesBackground = ({ mousePos }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 4)],
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        if (mousePos.current) {
          const dx = mousePos.current.x - p.x;
          const dy = mousePos.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) { p.x += dx * 0.003; p.y += dy * 0.003; }
        }
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', handleResize); };
  }, [mousePos]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />;
};

export default function Landing() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('All');
  const mousePos = useRef(null);
  const [orbPos, setOrbPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    api.get('/events')
      .then((response) => setEvents(Array.isArray(response.data?.events) ? response.data.events : []))
      .catch(() => setEvents([]));
  }, [mousePos]);

  const handleMouseMove = (e) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    setOrbPos({ x: (e.clientX / window.innerWidth - 0.5) * 30, y: (e.clientY / window.innerHeight - 0.5) * 30 });
  };

  const categories = ['All', 'Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'];
  const filtered = filter === 'All' ? events : events.filter(e => e.category === filter);
  const publishedEvents = events.filter(e => e.status === 'Published').length;
  const totalRegistrations = events.reduce((a, e) => a + (e.registrationCount || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Navbar */}
      <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <div style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniEvents</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')}
            style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Login</motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Register</motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <div onMouseMove={handleMouseMove}
        style={{ position: 'relative', padding: '120px 60px', textAlign: 'center', overflow: 'hidden', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        <ParticlesBackground mousePos={mousePos} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px', zIndex: 1 }} />

        {/* Orbs */}
        <motion.div animate={{ x: orbPos.x * 1.5, y: orbPos.y * 1.5 }} transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)', filter: 'blur(60px)', top: '-100px', left: '-100px', zIndex: 1 }} />
        <motion.div animate={{ x: -orbPos.x, y: -orbPos.y }} transition={{ type: 'spring', stiffness: 40, damping: 20 }}
          style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent)', filter: 'blur(60px)', bottom: '-100px', right: '-50px', zIndex: 1 }} />
        <motion.div animate={{ x: orbPos.x * 0.5, y: -orbPos.y * 0.5 }} transition={{ type: 'spring', stiffness: 30, damping: 20 }}
          style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1), transparent)', filter: 'blur(60px)', top: '30%', right: '20%', zIndex: 1 }} />

        {/* Floating Tags LEFT */}
        {floatingTags.filter(t => t.side === 'left').map((tag, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
            transition={{ delay: tag.delay, duration: 0.6, y: { duration: 3 + i, repeat: Infinity, ease: 'easeInOut' } }}
            style={{ position: 'absolute', left: '3%', top: tag.top, padding: '10px 16px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${tag.color}66`, borderRadius: 24, color: '#fff', fontSize: 13, backdropFilter: 'blur(10px)', zIndex: 5, boxShadow: `0 0 20px ${tag.color}33`, whiteSpace: 'nowrap' }}>
            {tag.label}
          </motion.div>
        ))}

        {/* Floating Tags RIGHT */}
        {floatingTags.filter(t => t.side === 'right').map((tag, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
            transition={{ delay: tag.delay, duration: 0.6, y: { duration: 3 + i, repeat: Infinity, ease: 'easeInOut' } }}
            style={{ position: 'absolute', right: '3%', top: tag.top, padding: '10px 16px', background: 'rgba(0,0,0,0.6)', border: `1px solid ${tag.color}66`, borderRadius: 24, color: '#fff', fontSize: 13, backdropFilter: 'blur(10px)', zIndex: 5, boxShadow: `0 0 20px ${tag.color}33`, whiteSpace: 'nowrap' }}>
            {tag.label}
          </motion.div>
        ))}

        {/* Hero Content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 800 }}>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, color: '#fff' }}>
            Discover & Join<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              VIT-AP Events
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ fontSize: 20, color: '#888', marginBottom: 40, lineHeight: 1.6 }}>
            Your one-stop platform for all university events.<br />Register, attend, and make memories at VIT-AP.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.5)' }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')}
              style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 18, fontWeight: 600 }}>
              Get Started 🚀
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/login')}
              style={{ padding: '16px 40px', background: 'transparent', border: '2px solid #333', color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: 18 }}>
              Sign In
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Live Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, padding: '40px 60px', background: '#0d0d0d' }}>
        {[
          { label: 'Live Events', value: publishedEvents, icon: '🎭', color: '#3b82f6', sub: 'Currently active' },
          { label: 'Total Registrations', value: totalRegistrations, icon: '🎫', color: '#8b5cf6', sub: 'Across all events' },
          { label: 'Event Categories', value: 5, icon: '🏆', color: '#ec4899', sub: 'Tech, Cultural & more' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
            whileHover={{ y: -4, boxShadow: `0 8px 32px ${s.color}22` }}
            style={{ textAlign: 'center', padding: 32, background: '#111', borderRadius: 16, border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ color: '#fff', marginTop: 8, fontWeight: 600, fontSize: 15 }}>{s.label}</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 12 }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Events Section */}
      <div style={{ padding: '60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Upcoming Events</h2>
          <p style={{ color: '#888', marginBottom: 32 }}>Explore what's happening at VIT-AP</p>
        </motion.div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {categories.map((c, i) => (
            <motion.button key={c} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFilter(c)}
              style={{ padding: '8px 20px', background: filter === c ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#111', border: filter === c ? 'none' : '1px solid #222', color: '#fff', borderRadius: 20, cursor: 'pointer', fontSize: 14 }}>
              {c}
            </motion.button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 60, color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
            <p>No events yet. Check back soon!</p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {filtered.map(event => <EventCard key={event._id} event={event} />)}
          </div>
        )}
      </div>

      {/* Features Section */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ padding: '60px', background: '#0d0d0d' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Why UniEvents?</h2>
        <p style={{ color: '#888', marginBottom: 40, textAlign: 'center' }}>Everything you need for campus events</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
          {[
            { icon: '🎫', title: 'Instant QR Tickets', desc: 'Get a unique QR code instantly after registration for seamless entry', color: '#3b82f6' },
            { icon: '📱', title: 'QR Scanner', desc: 'Organizers can scan attendee QR codes directly from their phone camera', color: '#8b5cf6' },
            { icon: '📊', title: 'Live Analytics', desc: 'Real-time registration tracking and attendance monitoring', color: '#22c55e' },
            { icon: '🔐', title: 'Secure Access', desc: 'Role-based access for Students, Organizers and Admins', color: '#ec4899' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, boxShadow: `0 16px 40px ${f.color}22` }}
              style={{ background: '#111', borderRadius: 16, padding: 28, border: `1px solid ${f.color}22` }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <footer style={{ padding: '40px 60px', borderTop: '1px solid #1a1a1a', textAlign: 'center', color: '#444' }}>
        <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>UniEvents</div>
        <p>© 2026 VIT-AP University. All rights reserved.</p>
      </footer>
    </div>
  );
}
