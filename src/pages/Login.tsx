import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock login
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } else {
      alert('Invalid credentials. Use admin / admin123');
    }
  };

  return (
    <div className="min-h-screen bg-srcc-portalNavy font-outfit flex justify-center items-center p-4 relative">
      <div className="w-full max-w-[420px] mx-auto text-white bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold tracking-wide">SRCC ADMIN</h1>
          <p className="text-sm mt-2 text-white/70 tracking-wider">ENTERPRISE PORTAL</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent border border-[#DADADA] rounded-[5px] h-[45px] text-white px-4 pt-2 pb-1 focus:ring-0 focus:border-white transition-colors peer"
            />
            <label className="absolute left-4 top-[14px] text-[13px] tracking-[2px] text-[#DADADA] transition-all pointer-events-none peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-[11px] peer-focus:bg-srcc-portalNavy peer-focus:px-1 peer-valid:top-[-8px] peer-valid:left-3 peer-valid:text-[11px] peer-valid:bg-srcc-portalNavy peer-valid:px-1">
              USERNAME
            </label>
          </div>

          <div className="relative group">
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-[#DADADA] rounded-[5px] h-[45px] text-white px-4 pt-2 pb-1 focus:ring-0 focus:border-white transition-colors peer"
            />
            <label className="absolute left-4 top-[14px] text-[13px] tracking-[2px] text-[#DADADA] transition-all pointer-events-none peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-[11px] peer-focus:bg-srcc-portalNavy peer-focus:px-1 peer-valid:top-[-8px] peer-valid:left-3 peer-valid:text-[11px] peer-valid:bg-srcc-portalNavy peer-valid:px-1">
              PASSCODE
            </label>
          </div>

          <button
            type="submit"
            className="w-full mt-8 h-[45px] flex justify-center items-center rounded-[5px] text-sm font-bold tracking-widest text-srcc-portalNavy bg-srcc-yellow hover:bg-white focus:outline-none transition-colors"
          >
            AUTHENTICATE
          </button>
        </form>
      </div>
    </div>
  );
}
