import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import io from 'socket.io-client';
import axios from 'axios';
import api, { API_BASE_URL, SOCKET_BASE_URL } from '../lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', universityId: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStats(); fetchUsers(); fetchEvents(); fetchFeedback();
    const socket = io(SOCKET_BASE_URL);
    socket.on('activeUsers', (count) => setActiveUsers(count));
    return () => socket.disconnect();
  }, []);

  const fetchStats = async () => {
    try { const res = await api.get('/admin/stats'); setStats(res.data); } catch {}
  };
  const fetchUsers = async () => {
    try { const res = await api.get('/admin/users'); setUsers(Array.isArray(res.data?.users) ? res.data.users : []); } catch {}
  };
  const fetchEvents = async () => {
    try { const res = await api.get('/events/all'); setEvents(Array.isArray(res.data?.events) ? res.data.events : []); } catch {}
  };
  const fetchFeedback = async () => {
    try { const res = await api.get('/admin/feedback'); setFeedback(Array.isArray(res.data?.feedback) ? res.data.feedback : []); } catch {}
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/admin/users/${editUser._id}`, userForm);
        toast.success('User updated!');
      } else {
        await api.post('/admin/users', userForm);
        toast.success('User created!');
      }
      fetchUsers(); setShowUserForm(false); setEditUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'student', department: '', universityId: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleUser = async (id) => {
    try { const res = await api.put(`/admin/users/${id}/toggle-status`); toast.success(res.data.message); fetchUsers(); }
    catch { toast.error('Failed'); }
  };

  const approveEvent = async (id) => {
    try { await api.put(`/events/${id}/approve`); toast.success('Event approved!'); fetchEvents(); fetchStats(); }
    catch { toast.error('Failed to approve'); }
  };

  const rejectEvent = async (id) => {
    try { await api.put(`/events/${id}/reject`); toast.success('Event rejected'); fetchEvents(); }
    catch { toast.error('Failed to reject'); }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.delete(`/events/${id}`); toast.success('Event deleted'); fetchEvents(); fetchStats(); }
    catch { toast.error('Failed to delete'); }
  };

  const exportCSV = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/export-csv`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'unievents-data.csv'; a.click();
      toast.success('CSV exported successfully!');
    } catch { toast.error('Export failed'); }
  };

  const logout = () => { localStorage.clear(); navigate('/'); };
  const statusColor = (s) => ({ 'Draft': '#888', 'Pending Approval': '#f59e0b', 'Published': '#22c55e', 'Registration Closed': '#ef4444', 'Completed': '#8b5cf6', 'Archived': '#666' }[s] || '#888');
  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  // Real chart data from actual events
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = months.map(name => ({
    name,
    events: events.filter(e => new Date(e.createdAt).toLocaleString('en-US', { month: 'short' }) === name).length
  }));

  const pieData = [
    { name: 'Students', value: users.filter(u => u.role === 'student').length },
    { name: 'Organizers', value: users.filter(u => u.role === 'organizer').length },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
  ];
  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', padding: '24px 0', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniEvents</div>
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>Admin Panel</div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: '#ef4444' }}>Super Admin</div>
            </div>
          </div>
        </div>

        {/* Live Users */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 12, color: '#888' }}>Live Users</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginLeft: 'auto' }}>{activeUsers}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'users', icon: '👥', label: 'User Management' },
            { id: 'events', icon: '🎭', label: 'Event Oversight' },
            { id: 'pending', icon: '⏳', label: 'Pending Approval' },
            { id: 'feedback', icon: '⭐', label: 'Feedback Monitor' },
          ].map(item => (
            <motion.button key={item.id} whileHover={{ x: 4 }} onClick={() => setTab(item.id)}
              style={{ width: '100%', padding: '12px 24px', background: tab === item.id ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))' : 'transparent', border: 'none', borderLeft: tab === item.id ? '3px solid #ef4444' : '3px solid transparent', color: tab === item.id ? '#ef4444' : '#888', cursor: 'pointer', textAlign: 'left', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.icon} {item.label}
              {item.id === 'pending' && stats.pendingEvents > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{stats.pendingEvents}</span>
              )}
            </motion.button>
          ))}
        </nav>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <motion.button whileHover={{ scale: 1.02 }} onClick={exportCSV}
            style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            📥 Export CSV
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} onClick={logout}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            🚪 Logout
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32 }}>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#fff' }}>Admin Dashboard</h1>
            <p style={{ color: '#888', marginBottom: 24 }}>System overview and real-time analytics</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Users', value: stats.totalUsers || 0, color: '#3b82f6', icon: '👥' },
                { label: 'Total Events', value: stats.totalEvents || 0, color: '#22c55e', icon: '🎭' },
                { label: 'Registrations', value: stats.totalRegistrations || 0, color: '#8b5cf6', icon: '🎫' },
                { label: 'Pending Events', value: stats.pendingEvents || 0, color: '#f59e0b', icon: '⏳' },
                { label: 'Organizers', value: stats.totalOrganizers || 0, color: '#ef4444', icon: '🎪' },
                { label: 'Live Users', value: activeUsers, color: '#22c55e', icon: '🟢' },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ y: -4, scale: 1.02 }} style={{ background: '#111', borderRadius: 16, padding: 20, border: `1px solid ${stat.color}33` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ background: '#111', borderRadius: 16, padding: 24, border: '1px solid #1a1a1a' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#fff' }}>Event Activity (Real Data)</h3>
                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                    <p>No events yet — chart will populate as events are created</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                      <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ background: '#111', borderRadius: 16, padding: 24, border: '1px solid #1a1a1a' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#fff' }}>User Distribution</h3>
                {users.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                    <p>No users yet</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                          {d.name}: {d.value}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ background: '#111', borderRadius: 16, padding: 24, border: '1px solid #1a1a1a' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>Recent Events</h3>
              {(stats.recentEvents || []).length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No events yet</p>
              ) : (
                (stats.recentEvents || []).map(event => (
                  <div key={event._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <div>
                      <p style={{ fontSize: 14, color: '#fff' }}>{event.title}</p>
                      <p style={{ fontSize: 12, color: '#888' }}>by {event.organizer?.name}</p>
                    </div>
                    <span style={{ padding: '3px 10px', background: `${statusColor(event.status)}22`, color: statusColor(event.status), borderRadius: 20, fontSize: 11 }}>{event.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>User Management</h1>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => { setShowUserForm(true); setEditUser(null); }}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                ➕ Add User
              </motion.button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..."
              style={{ width: '100%', padding: '12px 16px', background: '#111', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }} />
            <div style={{ background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1a1a1a' }}>
                    {['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, color: '#888', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#888' }}>No users yet</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <tr key={u._id} style={{ borderTop: '1px solid #1a1a1a', background: i % 2 === 0 ? '#111' : '#0d0d0d' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#fff' }}>{u.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', background: u.role === 'admin' ? '#3a1a1a' : u.role === 'organizer' ? '#3a2a1a' : '#1a1a3a', color: u.role === 'admin' ? '#ef4444' : u.role === 'organizer' ? '#f59e0b' : '#3b82f6', borderRadius: 20, fontSize: 11, textTransform: 'capitalize' }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#888' }}>{u.department || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', background: u.isActive ? '#1a3a1a' : '#3a1a1a', color: u.isActive ? '#22c55e' : '#ef4444', borderRadius: 20, fontSize: 11 }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setEditUser(u); setUserForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', universityId: u.universityId || '' }); setShowUserForm(true); }}
                            style={{ padding: '4px 10px', background: '#1a3a1a', border: 'none', color: '#22c55e', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Edit</motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => toggleUser(u._id)}
                            style={{ padding: '4px 10px', background: '#3a2a1a', border: 'none', color: '#f59e0b', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>{u.isActive ? 'Deactivate' : 'Activate'}</motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => deleteUser(u._id)}
                            style={{ padding: '4px 10px', background: '#3a1a1a', border: 'none', color: '#ef4444', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Delete</motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Event Oversight</h1>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
                <p>No events yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {events.map(event => (
                  <motion.div key={event._id} whileHover={{ y: -2 }} style={{ background: '#111', borderRadius: 16, padding: 20, border: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{event.title}</h3>
                          <span style={{ padding: '3px 10px', background: `${statusColor(event.status)}22`, color: statusColor(event.status), borderRadius: 20, fontSize: 11 }}>{event.status}</span>
                          <span style={{ padding: '3px 10px', background: '#1a1a3a', color: '#3b82f6', borderRadius: 20, fontSize: 11 }}>{event.category}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#888' }}>by {event.organizer?.name} • {event.registrationCount}/{event.capacityLimit} registered • {new Date(event.startDateTime).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {event.status === 'Pending Approval' && (
                          <>
                            <motion.button whileHover={{ scale: 1.05 }} onClick={() => approveEvent(event._id)}
                              style={{ padding: '6px 14px', background: '#1a3a1a', border: 'none', color: '#22c55e', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✅ Approve</motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} onClick={() => rejectEvent(event._id)}
                              style={{ padding: '6px 14px', background: '#3a1a1a', border: 'none', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>❌ Reject</motion.button>
                          </>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => deleteEvent(event._id)}
                          style={{ padding: '6px 14px', background: '#3a1a1a', border: 'none', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>🗑️ Delete</motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Approval Tab */}
        {tab === 'pending' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Pending Approval</h1>
            {events.filter(e => e.status === 'Pending Approval').length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <p>No events pending approval!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {events.filter(e => e.status === 'Pending Approval').map(event => (
                  <motion.div key={event._id} style={{ background: '#111', borderRadius: 16, padding: 24, border: '1px solid #f59e0b44' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{event.title}</h3>
                    <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{event.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16, fontSize: 12, color: '#666' }}>
                      <span>📅 {new Date(event.startDateTime).toLocaleDateString('en-IN')}</span>
                      <span>📍 {event.venueName}, {event.buildingName}</span>
                      <span>👥 Capacity: {event.capacityLimit}</span>
                      <span>🏷️ {event.category}</span>
                      <span>👤 by {event.organizer?.name}</span>
                      <span>⏰ Deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <motion.button whileHover={{ scale: 1.02 }} onClick={() => approveEvent(event._id)}
                        style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        ✅ Approve Event
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} onClick={() => rejectEvent(event._id)}
                        style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        ❌ Reject Event
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {tab === 'feedback' && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: '#fff' }}>Feedback Monitor</h1>
            {feedback.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                <p>No feedback submitted yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {feedback.map(f => (
                  <motion.div key={f._id} whileHover={{ y: -2 }} style={{ background: '#111', borderRadius: 16, padding: 20, border: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{f.event?.title}</h3>
                        <p style={{ fontSize: 12, color: '#888' }}>by {f.student?.name} • {f.student?.email}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= f.overallRating ? '#f59e0b' : '#333', fontSize: 16 }}>★</span>)}
                      </div>
                    </div>
                    {f.suggestions && <p style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>"{f.suggestions}"</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
        {showUserForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: '#111', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', border: '1px solid #222', maxHeight: '80vh', overflowY: 'auto' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#fff' }}>{editUser ? 'Edit User' : 'Create New User'}</h2>
              <form onSubmit={handleUserSubmit}>
                {[
                  { label: 'Full Name *', key: 'name', type: 'text' },
                  { label: 'Email *', key: 'email', type: 'email' },
                  { label: editUser ? 'New Password (leave blank to keep)' : 'Password *', key: 'password', type: 'password' },
                  { label: 'Department', key: 'department', type: 'text' },
                  { label: 'University ID', key: 'universityId', type: 'text' },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} value={userForm[field.key]} onChange={e => setUserForm({ ...userForm, [field.key]: e.target.value })}
                      required={field.label.includes('*') && !editUser}
                      style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>Role *</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}>
                    {['student', 'organizer', 'admin'].map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button whileHover={{ scale: 1.02 }} type="submit"
                    style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    {editUser ? 'Update User' : 'Create User'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} type="button" onClick={() => { setShowUserForm(false); setEditUser(null); }}
                    style={{ padding: '12px 20px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer' }}>
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
