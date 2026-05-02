import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', universityId: '', department: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Account created successfully!');
      const role = res.data.user.role;
      if (role === 'organizer') navigate('/organizer');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 480, padding: 40, background: '#111', borderRadius: 20, border: '1px solid #1a1a1a' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>UniEvents</div>
          <h2 style={{ fontSize: 22, color: '#fff' }}>Create Account</h2>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Join VIT-AP's event platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 8 }}>I am a *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {['student', 'organizer'].map(r => (
                <motion.button key={r} type="button" whileHover={{ scale: 1.02 }} onClick={() => setForm({ ...form, role: r })}
                  style={{ padding: '10px', background: form.role === r ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : '#1a1a1a', border: form.role === r ? 'none' : '1px solid #222', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
                  {r === 'student' ? 'Student' : 'Organizer'}
                </motion.button>
              ))}
            </div>
          </div>

          {[
            { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Doe' },
            { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'name@example.com' },
            { label: 'University ID', key: 'universityId', type: 'text', placeholder: '21BCE1234' },
            { label: 'Department', key: 'department', type: 'text', placeholder: 'Computer Science' },
            { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 9999999999' },
            { label: 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password *', key: 'confirmPassword', type: 'password', placeholder: '••••••••' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 13, marginBottom: 6 }}>{field.label}</label>
              <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                required={field.label.includes('*')}
                style={{ width: '100%', padding: '12px 16px', background: '#1a1a1a', border: '1px solid #222', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 24 }}>
          Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Sign in</Link>
        </p>
        <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 12 }}>
          <Link to="/" style={{ color: '#666', textDecoration: 'none' }}>← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}
