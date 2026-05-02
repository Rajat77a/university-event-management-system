import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader } from '@zxing/library';
import api from '../lib/api';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab, setTab] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [, setShowCreateForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Technical', startDateTime: '', endDateTime: '',
    venueName: '', buildingName: '', capacityLimit: '', registrationDeadline: '',
    guestSpeakerName: '', guestSpeakerDesignation: '', prerequisites: '', contactEmail: '', contactPhone: '', tags: ''
  });

  const normalizeRegistration = (registration) => {
    const student =
      registration?.student && typeof registration.student === 'object'
        ? registration.student
        : registration?.userId && typeof registration.userId === 'object'
          ? registration.userId
          : null;

    return {
      ...registration,
      student,
      attendanceStatus: registration?.attendanceStatus || registration?.status || 'Registered',
    };
  };

  useEffect(() => { fetchEvents(); }, []);

  const stopScanner = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      setScanResult(null);
      setScanning(true);
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0]?.deviceId;
      await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, async (result, err) => {
        if (result) {
          stopScanner();
          setScanning(false);
          try {
            const res = await api.post('/registrations/scan', { qrData: result.getText() });
            setScanResult({ success: true, message: res.data.message, student: res.data.student });
            toast.success(res.data.message);
          } catch (err) {
            setScanResult({ success: false, message: err.response?.data?.message || 'Scan failed' });
            toast.error(err.response?.data?.message || 'Scan failed');
          }
        }
      });
    } catch (err) {
      toast.error('Camera access denied or not available');
      setScanning(false);
    }
  }, [stopScanner]);

  useEffect(() => {
    if (tab === 'scanner') {
      startScanner();
    } else {
      stopScanner();
    }

    return () => stopScanner();
  }, [tab, startScanner, stopScanner]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/my-events');
      setEvents(Array.isArray(res.data?.events) ? res.data.events : []);
    } catch { setEvents([]); }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await api.get(`/registrations/event/${eventId}`);
      const data = Array.isArray(res.data?.registrations) ? res.data.registrations.map(normalizeRegistration) : [];
      setRegistrations(data);
    } catch { setRegistrations([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        capacityLimit: parseInt(form.capacityLimit),
        guestSpeaker: form.guestSpeakerName ? { name: form.guestSpeakerName, designation: form.guestSpeakerDesignation } : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };
      if (editEvent) {
        await api.put(`/events/${editEvent._id}`, payload);
        toast.success('Event updated successfully!');
      } else {
        await api.post('/events', payload);
        toast.success('Event submitted for approval!');
      }
      fetchEvents();
      setShowCreateForm(false);
      setEditEvent(null);
      resetForm();
      setTab('events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch { toast.error('Failed to delete event'); }
  };

  const resetForm = () => setForm({
    title: '', description: '', category: 'Technical', startDateTime: '', endDateTime: '',
    venueName: '', buildingName: '', capacityLimit: '', registrationDeadline: '',
    guestSpeakerName: '', guestSpeakerDesignation: '', prerequisites: '', contactEmail: '', contactPhone: '', tags: ''
  });

  const openEdit = (event) => {
    setEditEvent(event);
    setForm({
      title: event.title, description: event.description, category: event.category,
      startDateTime: event.startDateTime?.slice(0, 16), endDateTime: event.endDateTime?.slice(0, 16),
      venueName: event.venueName, buildingName: event.buildingName, capacityLimit: event.capacityLimit,
      registrationDeadline: event.registrationDeadline?.slice(0, 16),
      guestSpeakerName: event.guestSpeaker?.name || '', guestSpeakerDesignation: event.guestSpeaker?.designation || '',
      prerequisites: event.prerequisites || '', contactEmail: event.contactEmail || '', contactPhone: event.contactPhone || '',
      tags: event.tags?.join(', ') || ''
    });
    setShowCreateForm(true);
    setTab('create');
  };

  const logout = () => { localStorage.clear(); navigate('/'); };
  const statusColor = (s) => ({ 'Draft': '#888', 'Pending Approval': '#f59e0b', 'Published': '#22c55e', 'Registration Closed': '#ef4444', 'Completed': '#8b5cf6' }[s] || '#888');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', padding: '24px 0', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniEvents</div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#f59e0b' }}>Organizer</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'events', icon: '🎭', label: 'My Events' },
            { id: 'create', icon: '➕', label: 'Create Event' },
            { id: 'scanner', icon: '📷', label: 'QR Scanner' },
          ].map(item => (
            <motion.button key={item.id} whileHover={{ x: 4 }}
              onClick={() => { setTab(item.id); if (item.id === 'create') { setShowCreateForm(true); setEditEvent(null); resetForm(); } }}
              style={{ width: '100%', padding: '12px 24px', background: tab === item.id ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))' : 'transparent', border: 'none', borderLeft: tab === item.id ? '3px solid #f59e0b' : '3px solid transparent', color: tab === item.id ? '#f59e0b' : '#888', cursor: 'pointer', textAlign: 'left', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
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

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Organizer Dashboard</h1>
            <p style={{ color: '#888', marginBottom: 24 }}>Welcome back, {user.name}!</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Events', value: events.length, color: '#3b82f6', icon: '🎭' },
                { label: 'Published', value: events.filter(e => e.status === 'Published').length, color: '#22c55e', icon: '✅' },
                { label: 'Pending Approval', value: events.filter(e => e.status === 'Pending Approval').length, color: '#f59e0b', icon: '⏳' },
                { label: 'Total Registrations', value: events.reduce((a, e) => a + (e.registrationCount || 0), 0), color: '#8b5cf6', icon: '👥' },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} style={{ background: '#111', borderRadius: 16, padding: 20, border: `1px solid ${stat.color}22` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Recent Events</h2>
            {events.slice(0, 3).map(event => (
              <motion.div key={event._id} whileHover={{ x: 4 }} style={{ background: '#111', borderRadius: 12, padding: 16, border: '1px solid #1a1a1a', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{event.title}</h3>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{event.category} • {event.registrationCount}/{event.capacityLimit} registered</p>
                </div>
                <span style={{ padding: '4px 12px', background: `${statusColor(event.status)}22`, color: statusColor(event.status), borderRadius: 20, fontSize: 12 }}>{event.status}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* My Events */}
        {tab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Events</h1>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setTab('create'); setShowCreateForm(true); setEditEvent(null); resetForm(); }}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                ➕ Create New Event
              </motion.button>
            </div>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
                <p>No events yet. Create your first event!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {events.map(event => (
                  <motion.div key={event._id} whileHover={{ y: -2 }} style={{ background: '#111', borderRadius: 16, padding: 24, border: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{event.title}</h3>
                          <span style={{ padding: '3px 10px', background: `${statusColor(event.status)}22`, color: statusColor(event.status), borderRadius: 20, fontSize: 11 }}>{event.status}</span>
                          <span style={{ padding: '3px 10px', background: '#1a1a3a', color: '#3b82f6', borderRadius: 20, fontSize: 11 }}>{event.category}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{event.description?.slice(0, 100)}...</p>
                        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#666' }}>
                          <span>📅 {new Date(event.startDateTime).toLocaleDateString('en-IN')}</span>
                          <span>📍 {event.venueName}</span>
                          <span>👥 {event.registrationCount}/{event.capacityLimit} registered</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#1a1a1a', borderRadius: 4, height: 6, marginBottom: 16 }}>
                      <div style={{ width: `${Math.min((event.registrationCount / event.capacityLimit) * 100, 100)}%`, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 4, height: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <motion.button whileHover={{ scale: 1.02 }} onClick={() => { setSelectedEvent(event); fetchRegistrations(event._id); setTab('registrations'); }}
                        style={{ padding: '8px 16px', background: '#1a1a3a', border: 'none', color: '#3b82f6', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                        👥 View Registrations
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} onClick={() => openEdit(event)}
                        style={{ padding: '8px 16px', background: '#1a3a1a', border: 'none', color: '#22c55e', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                        ✏️ Edit
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} onClick={() => deleteEvent(event._id)}
                        style={{ padding: '8px 16px', background: '#3a1a1a', border: 'none', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                        🗑️ Delete
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registrations */}
        {tab === 'registrations' && selectedEvent && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setTab('events')}
                style={{ padding: '8px 16px', background: '#111', border: '1px solid #222', color: '#888', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                ← Back
              </motion.button>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Registrations: {selectedEvent.title}</h1>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Registered', value: registrations.length, color: '#3b82f6' },
                { label: 'Checked In', value: registrations.filter(r => r.attendanceStatus === 'Checked-in').length, color: '#22c55e' },
                { label: 'Seats Left', value: selectedEvent.capacityLimit - registrations.length, color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#111', borderRadius: 12, padding: 16, border: `1px solid ${s.color}22`, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {registrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>No registrations yet</div>
            ) : (
              <div style={{ background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a1a1a' }}>
                      {['Name', 'Email', 'Department', 'University ID', 'Status', 'Registered At'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, i) => (
                      <tr key={reg._id} style={{ borderTop: '1px solid #1a1a1a', background: i % 2 === 0 ? '#111' : '#0d0d0d' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#fff' }}>{reg.student?.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{reg.student?.email}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{reg.student?.department || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{reg.student?.universityId || '-'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', background: reg.attendanceStatus === 'Checked-in' ? '#1a3a1a' : '#1a1a3a', color: reg.attendanceStatus === 'Checked-in' ? '#22c55e' : '#3b82f6', borderRadius: 20, fontSize: 11 }}>
                            {reg.attendanceStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#666' }}>{new Date(reg.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Event */}
        {tab === 'create' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>{editEvent ? 'Edit Event' : 'Create New Event'}</h1>
            <div style={{ background: '#111', borderRadius: 20, padding: 32, border: '1px solid #1a1a1a', maxWidth: 700 }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Event Title *', key: 'title', type: 'text', placeholder: 'e.g. Tech Symposium 2026', full: true },
                    { label: 'Venue Name *', key: 'venueName', type: 'text', placeholder: 'e.g. Main Auditorium' },
                    { label: 'Building Name *', key: 'buildingName', type: 'text', placeholder: 'e.g. Tech Block A' },
                    { label: 'Capacity Limit *', key: 'capacityLimit', type: 'number', placeholder: '200' },
                    { label: 'Start Date & Time *', key: 'startDateTime', type: 'datetime-local' },
                    { label: 'End Date & Time *', key: 'endDateTime', type: 'datetime-local' },
                    { label: 'Registration Deadline *', key: 'registrationDeadline', type: 'datetime-local' },
                    { label: 'Guest Speaker Name', key: 'guestSpeakerName', type: 'text', placeholder: 'Dr. John Doe' },
                    { label: 'Speaker Designation', key: 'guestSpeakerDesignation', type: 'text', placeholder: 'Professor, IIT' },
                    { label: 'Contact Email', key: 'contactEmail', type: 'email', placeholder: 'contact@vitap.ac.in' },
                    { label: 'Contact Phone', key: 'contactPhone', type: 'tel', placeholder: '+91 9999999999' },
                    { label: 'Tags (comma separated)', key: 'tags', type: 'text', placeholder: 'AI, ML, Tech' },
                  ].map(field => (
                    <div key={field.key} style={{ gridColumn: field.full ? '1 / -1' : 'auto' }}>
                      <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        required={field.label.includes('*')}
                        style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>Event Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}>
                      {['Technical', 'Cultural', 'Academic', 'Sports', 'Workshop'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>Description *</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required
                      placeholder="Describe your event in detail..."
                      style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 100, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>Prerequisites</label>
                    <textarea value={form.prerequisites} onChange={e => setForm({ ...form, prerequisites: e.target.value })}
                      placeholder="Any prerequisites for attending..."
                      style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <motion.button whileHover={{ scale: 1.02 }} type="submit"
                    style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
                    {editEvent ? '💾 Update Event' : '🚀 Submit for Approval'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} type="button" onClick={() => { setTab('events'); setShowCreateForm(false); setEditEvent(null); resetForm(); }}
                    style={{ padding: '14px 20px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 10, cursor: 'pointer' }}>
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Scanner */}
        {tab === 'scanner' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>QR Code Scanner</h1>
            <p style={{ color: '#888', marginBottom: 24 }}>Point camera at attendee QR code to verify entry</p>
            <div style={{ maxWidth: 500 }}>
              <div style={{ background: '#111', borderRadius: 20, padding: 24, border: '1px solid #1a1a1a', marginBottom: 20 }}>
                {!scanResult && (
                  <div style={{ position: 'relative' }}>
                    <video ref={videoRef} style={{ width: '100%', borderRadius: 12, background: '#000' }} autoPlay muted playsInline />
                    {scanning && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: 200, height: 200, border: '3px solid #3b82f6', borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', animation: 'scan 2s linear infinite' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!scanning && !scanResult && (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
                    <p>Initializing camera...</p>
                  </div>
                )}
              </div>

              {scanResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: scanResult.success ? '#0d2a0d' : '#2a0d0d', borderRadius: 16, padding: 24, border: `1px solid ${scanResult.success ? '#22c55e' : '#ef4444'}` }}>
                  <div style={{ fontSize: 48, marginBottom: 12, textAlign: 'center' }}>{scanResult.success ? '✅' : '❌'}</div>
                  <p style={{ fontSize: 18, fontWeight: 600, color: scanResult.success ? '#22c55e' : '#ef4444', marginBottom: 12, textAlign: 'center' }}>{scanResult.message}</p>
                  {scanResult.student && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, fontSize: 14, color: '#888' }}>
                      <p style={{ marginBottom: 4 }}>👤 <span style={{ color: '#fff' }}>{scanResult.student.name}</span></p>
                      <p style={{ marginBottom: 4 }}>📧 {scanResult.student.email}</p>
                      {scanResult.student.department && <p>🏛️ {scanResult.student.department}</p>}
                    </div>
                  )}
                  <motion.button whileHover={{ scale: 1.02 }}
                    onClick={() => { setScanResult(null); startScanner(); }}
                    style={{ marginTop: 16, width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    📷 Scan Another QR Code
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
