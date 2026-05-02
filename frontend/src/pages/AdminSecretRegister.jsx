import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function AdminSecretRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', secretKey: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-secret-register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Admin account created!');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420, padding: 40, background: '#111', borderRadius: 20, border: '1px solid #dc2626' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h2 style={{ fontSize: 22, color: '#fff' }}>Admin Registration</h2>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Restricted Access Only</p>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Admin Name' },
            { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'admin@example.com' },
            { label: 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password *', key: 'confirmPassword', type: 'password', placeholder: '••••••••' },
            { label: 'Secret Key *', key: 'secretKey', type: 'password', placeholder: 'Enter secret key' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>{field.label}</label>
              <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })} required
                style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>Secret Key: UNIEVENTS_ADMIN_2026</p>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
            {loading ? 'Creating...' : 'Create Admin Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 24 }}>
          <Link to="/login" style={{ color: '#666', textDecoration: 'none' }}>← Back to Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
