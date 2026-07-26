import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, Lock, User } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
           <ShieldAlert size={48} className="text-primary" />
        </div>
        <h2>MBS Analyst Portal</h2>
        <p className="subtitle">Malware Behavior Sandbox</p>
        
        {error && (
          <div className="badge badge-danger" style={{ width: '100%', justifyContent: 'center', marginBottom: 24, padding: '10px 12px', fontSize: '13px' }}>
             {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                style={{ paddingLeft: '36px' }}
                placeholder="Enter your username"
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
               <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-text-muted)' }} />
               <input 
                 type="password" 
                 value={password} 
                 onChange={e => setPassword(e.target.value)} 
                 required 
                 style={{ paddingLeft: '36px' }}
                 placeholder="Enter your password"
               />
            </div>
          </div>
          <button className="btn btn-primary btn-icon-text" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : <><LogIn size={16} /> Sign In to Dashboard</>}
          </button>
        </form>
      </div>
    </div>
  );
}