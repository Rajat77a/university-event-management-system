import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

const eventImages = {
  Technical: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
  Cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  Workshop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
  Academic: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ overallRating: 0, contentRating: 0, organizationRating: 0, suggestions: '', likedMost: '', improvements: '' });
  const [showFeedback, setShowFeedback] = useState(null);

  const getEntityId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      // Handle nested ObjectId formats: { _id: "..." } or { _id: { $oid: "..." } }
      if (value._id) {
        const id = value._id;
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id.$oid) return id.$oid;
        return String(id);
      }
      if (value.$oid) return value.$oid;
    }
    if (typeof value.toString === 'function') return value.toString();
    return '';
  };

  const normalizeRegistration = (registration) => {
    const event =
      registration?.event && typeof registration.event === 'object'
        ? registration.event
        : registration?.eventId && typeof registration.eventId === 'object'
          ? registration.eventId
          : null;

    const student =
      registration?.student && typeof registration.student === 'object'
        ? registration.student
        : registration?.userId && typeof registration.userId === 'object'
          ? registration.userId
          : null;

    return {
      ...registration,
      event,
      student,
      eventRef: getEntityId(event || registration?.eventId || registration?.event),
      studentRef: getEntityId(student || registration?.userId || registration?.student),
      attendanceStatus: registration?.attendanceStatus || registration?.status || 'Registered',
    };
  };

  useEffect(() => { fetchEvents(); fetchMyRegistrations(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(Array.isArray(res.data?.events) ? res.data.events : []);
    } catch { setEvents([]); }
  };

  const fetchMyRegistrations = async () => {
    try {
      const res = await api.get('/registrations/my');
      const registrations = Array.isArray(res.data?.registrations) ? res.data.registrations.map(normalizeRegistration) : [];
      setMyRegistrations(registrations);
    } catch { setMyRegistrations([]); }
  };

  const registerForEvent = async (eventId) => {
    setLoading(true);
    try {
      await api.post(`/registrations/${eventId}`);
      toast.success('🎉 Successfully registered! Check your QR code in My Events');
      fetchEvents();
      fetchMyRegistrations();
      setSelectedEvent(null);
    } catch (err) {
      if (err.response?.data?.message === 'You have already registered for this event') {
        fetchEvents();
        fetchMyRegistrations();
      }
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const cancelRegistration = async (eventId) => {
    try {
      await api.delete(`/registrations/${eventId}`);
      toast.success('Registration cancelled');
      fetchMyRegistrations();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const submitFeedback = async (eventId, registrationId) => {
    try {
      await api.post(`/registrations/${registrationId}/feedback`, { ...feedbackForm, eventId });
      toast.success('Feedback submitted successfully!');
      setShowFeedback(null);
      setFeedbackForm({ overallRating: 0, contentRating: 0, organizationRating: 0, suggestions: '', likedMost: '', improvements: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const logout = () => { localStorage.clear(); navigate('/'); };
  const isRegistered = (eventId) => {
    const targetId = getEntityId(eventId);
    return targetId !== '' && myRegistrations.some(r => r.eventRef === targetId);
  };
  const categories = ['All', 'Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'];
  const filtered = events.filter(e => (filter === 'All' || e.category === filter) && (search === '' || e.title.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', padding: '24px 0', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniEvents</div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { id: 'events', icon: '🎭', label: 'Browse Events' },
            { id: 'myevents', icon: '🎫', label: 'My Events' },
            { id: 'profile', icon: '👤', label: 'Profile' },
          ].map(item => (
            <motion.button key={item.id} whileHover={{ x: 4 }} onClick={() => setTab(item.id)}
              style={{ width: '100%', padding: '12px 24px', background: tab === item.id ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))' : 'transparent', border: 'none', borderLeft: tab === item.id ? '3px solid #3b82f6' : '3px solid transparent', color: tab === item.id ? '#3b82f6' : '#888', cursor: 'pointer', textAlign: 'left', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.icon} {item.label}
            </motion.button>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1a1a1a' }}>
          <motion.button whileHover={{ scale: 1.02 }} onClick={logout}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            🚪 Logout
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        {/* Browse Events Tab */}
        {tab === 'events' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Browse Events</h1>
            <p style={{ color: '#888', marginBottom: 24 }}>Discover and register for upcoming events</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search events..."
                style={{ flex: 1, minWidth: 200, padding: '10px 16px', background: '#111', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }} />
              {categories.map(c => (
                <motion.button key={c} whileHover={{ scale: 1.05 }} onClick={() => setFilter(c)}
                  style={{ padding: '10px 16px', background: filter === c ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#111', border: filter === c ? 'none' : '1px solid #222', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                  {c}
                </motion.button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
                <p>No events found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {filtered.map(event => (
                  <motion.div key={event._id} whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(59,130,246,0.15)' }}
                    style={{ background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #1a1a1a', cursor: 'pointer' }}
                    onClick={() => setSelectedEvent(event)}>
                    <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                      <img src={eventImages[event.category] || eventImages.Technical} alt={event.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: 10, right: 10, background: '#3b82f6', padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>{event.category}</div>
                      {isRegistered(event._id) && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: '#22c55e', padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>✓ Registered</div>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#fff' }}>{event.title}</h3>
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>📅 {new Date(event.startDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>📍 {event.venueName}, {event.buildingName}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: event.registrationCount >= event.capacityLimit ? '#ef4444' : '#22c55e' }}>
                          {event.registrationCount >= event.capacityLimit ? '🔴 Full' : `🟢 ${event.capacityLimit - event.registrationCount} seats left`}
                        </span>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); if (!isRegistered(event._id)) registerForEvent(event._id); }}
                          disabled={isRegistered(event._id) || event.registrationCount >= event.capacityLimit || loading}
                          style={{ padding: '6px 14px', background: isRegistered(event._id) ? '#1a3a1a' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: isRegistered(event._id) ? '#22c55e' : '#fff', borderRadius: 6, cursor: isRegistered(event._id) ? 'default' : 'pointer', fontSize: 12 }}>
                          {isRegistered(event._id) ? '✓ Registered' : 'Register'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Events Tab */}
        {tab === 'myevents' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>My Events</h1>
            <p style={{ color: '#888', marginBottom: 24 }}>Your registered events and QR codes</p>
            {myRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
                <p>No registrations yet. Browse events to register!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {myRegistrations.map(reg => (
                  <motion.div key={reg._id} whileHover={{ y: -4 }} style={{ background: '#111', borderRadius: 16, padding: 24, border: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{reg.event?.title}</h3>
                        <p style={{ fontSize: 12, color: '#888' }}>📅 {reg.event?.startDateTime ? new Date(reg.event.startDateTime).toLocaleDateString('en-IN') : 'N/A'}</p>
                        <p style={{ fontSize: 12, color: '#888' }}>📍 {reg.event?.venueName}</p>
                      </div>
                      <span style={{ padding: '4px 10px', background: reg.attendanceStatus === 'Checked-in' ? '#1a3a1a' : '#1a1a3a', color: reg.attendanceStatus === 'Checked-in' ? '#22c55e' : '#3b82f6', borderRadius: 20, fontSize: 11 }}>
                        {reg.attendanceStatus}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, background: '#fff', borderRadius: 12, marginBottom: 16 }}>
                      <QRCodeSVG value={reg.qrData || reg._id} size={150} />
                      <p style={{ fontSize: 11, color: '#333', marginTop: 8 }}>Scan this code for entry</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {reg.event?.status === 'Completed' && (
                        <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowFeedback(reg)}
                          style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                          ⭐ Give Feedback
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.02 }} onClick={() => cancelRegistration(reg.eventRef)}
                        style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                        Cancel
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>My Profile</h1>
            <div style={{ background: '#111', borderRadius: 16, padding: 32, border: '1px solid #1a1a1a', maxWidth: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 600 }}>{user.name}</h2>
                  <p style={{ color: '#888', textTransform: 'capitalize' }}>{user.role}</p>
                </div>
              </div>
              {[['Email', user.email], ['Role', user.role], ['Registrations', myRegistrations.length + ' events']].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <span style={{ color: '#888' }}>{label}</span>
                  <span style={{ color: '#fff', textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={() => setSelectedEvent(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: '#111', borderRadius: 20, padding: 32, maxWidth: 560, width: '100%', border: '1px solid #222', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <img src={eventImages[selectedEvent.category]} alt={selectedEvent.title}
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>{selectedEvent.title}</h2>
                <span style={{ background: '#3b82f6', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>{selectedEvent.category}</span>
              </div>
              <p style={{ color: '#888', marginBottom: 16, lineHeight: 1.6 }}>{selectedEvent.description}</p>
              {[
                ['📅 Start', new Date(selectedEvent.startDateTime).toLocaleString('en-IN')],
                ['🏁 End', new Date(selectedEvent.endDateTime).toLocaleString('en-IN')],
                ['📍 Venue', `${selectedEvent.venueName}, ${selectedEvent.buildingName}`],
                ['👥 Capacity', `${selectedEvent.registrationCount}/${selectedEvent.capacityLimit} registered`],
                ['⏰ Deadline', new Date(selectedEvent.registrationDeadline).toLocaleString('en-IN')],
                ...(selectedEvent.guestSpeaker?.name ? [['🎤 Speaker', `${selectedEvent.guestSpeaker.name} - ${selectedEvent.guestSpeaker.designation}`]] : []),
                ...(selectedEvent.prerequisites ? [['📋 Prerequisites', selectedEvent.prerequisites]] : []),
                ...(selectedEvent.contactEmail ? [['📧 Contact', selectedEvent.contactEmail]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a', fontSize: 14 }}>
                  <span style={{ color: '#888', minWidth: 120 }}>{label}</span>
                  <span style={{ color: '#fff' }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => registerForEvent(selectedEvent._id)}
                  disabled={isRegistered(selectedEvent._id) || selectedEvent.registrationCount >= selectedEvent.capacityLimit || loading}
                  style={{ flex: 1, padding: '14px', background: isRegistered(selectedEvent._id) ? '#1a3a1a' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: isRegistered(selectedEvent._id) ? '#22c55e' : '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
                  {isRegistered(selectedEvent._id) ? '✓ Already Registered' : loading ? 'Registering...' : 'Register Now'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setSelectedEvent(null)}
                  style={{ padding: '14px 20px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 10, cursor: 'pointer' }}>
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: '#111', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', border: '1px solid #222', maxHeight: '80vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Event Feedback</h2>
              <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>{showFeedback.event?.title}</p>
              {[
                { label: 'Overall Experience *', key: 'overallRating' },
                { label: 'Content Quality *', key: 'contentRating' },
                { label: 'Organization *', key: 'organizationRating' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 8 }}>{f.label}</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} onClick={() => setFeedbackForm({...feedbackForm, [f.key]: s})}
                        style={{ fontSize: 28, cursor: 'pointer', color: s <= feedbackForm[f.key] ? '#f59e0b' : '#333' }}>★</span>
                    ))}
                  </div>
                </div>
              ))}
              {[
                { label: 'What did you like most?', key: 'likedMost' },
                { label: 'Suggestions for improvement', key: 'improvements' },
                { label: 'Additional comments', key: 'suggestions' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>{f.label}</label>
                  <textarea value={feedbackForm[f.key]} onChange={e => setFeedbackForm({...feedbackForm, [f.key]: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12 }}>
                <motion.button whileHover={{ scale: 1.02 }}
                  onClick={() => submitFeedback(showFeedback.eventRef, showFeedback._id)}
                  disabled={!feedbackForm.overallRating || !feedbackForm.contentRating || !feedbackForm.organizationRating}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  Submit Feedback
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} onClick={() => setShowFeedback(null)}
                  style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
