import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(`Welcome back, ${res.data.user.name}!`);
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'organizer') navigate('/organizer');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420, padding: 40, background: '#111', borderRadius: 20, border: '1px solid #1a1a1a' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>UniEvents</div>
          <h2 style={{ fontSize: 22, color: '#fff' }}>Welcome Back</h2>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required
              style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required
              style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 24 }}>
          Don't have an account? <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none' }}>Register here</Link>
        </p>
        <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 12 }}>
          <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}
