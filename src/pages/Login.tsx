import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passcode: password })
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (res.ok && data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('adminUser', username);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Identity verification failed.');
      }
    } catch (err) {
      setError('Network synchronization error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-srcc-portalNavy font-outfit flex justify-center items-center p-4 relative">
      {/* Background decoration elements could go here */}
      <div className="w-full max-w-[420px] mx-auto text-white bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8 px-4">
          <img src="/SRCC.svg" alt="SRCC Logo" className="w-20 h-20 mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-4xl font-serif font-black tracking-widest text-[#FCEB08] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">SRCC</h1>
          <div className="h-0.5 w-16 bg-[#FCEB08]/40 mx-auto my-3 rounded-full"></div>
          <p className="text-[10px] font-bold text-white/60 tracking-[4px] uppercase">SRCC Admin Assist</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-xs text-red-200 text-center font-bold animate-in fade-in duration-300">
              {error}
            </div>
          )}

          <div className="relative group">
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-srcc-portalNavy/30 border border-white/20 rounded-xl h-[52px] text-white px-4 pt-2 pb-1 focus:ring-2 focus:ring-[#FCEB08]/50 focus:border-[#FCEB08] transition-all peer outline-none text-sm"
              placeholder=" "
            />
            <label className="absolute left-4 top-[17px] text-[11px] font-bold tracking-[2px] text-white/40 transition-all pointer-events-none peer-focus:top-[-9px] peer-focus:left-3 peer-focus:text-[10px] peer-focus:text-[#FCEB08] peer-focus:bg-srcc-portalNavy peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-9px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#FCEB08] peer-[:not(:placeholder-shown)]:bg-srcc-portalNavy peer-[:not(:placeholder-shown)]:px-2 uppercase">
              USERNAME
            </label>
          </div>

          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-srcc-portalNavy/30 border border-white/20 rounded-xl h-[52px] text-white pl-4 pr-12 pt-2 pb-1 focus:ring-2 focus:ring-[#FCEB08]/50 focus:border-[#FCEB08] transition-all peer outline-none text-sm"
              placeholder=" "
            />
            <label className="absolute left-4 top-[17px] text-[11px] font-bold tracking-[2px] text-white/40 transition-all pointer-events-none peer-focus:top-[-9px] peer-focus:left-3 peer-focus:text-[10px] peer-focus:text-[#FCEB08] peer-focus:bg-srcc-portalNavy peer-focus:px-2 peer-[:not(:placeholder-shown)]:top-[-9px] peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-[#FCEB08] peer-[:not(:placeholder-shown)]:bg-srcc-portalNavy peer-[:not(:placeholder-shown)]:px-2 uppercase">
              PASSCODE
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#FCEB08] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 h-[55px] flex justify-center items-center rounded-xl text-xs font-black tracking-[3px] text-srcc-portalNavy bg-[#FCEB08] hover:bg-white hover:text-srcc-portalNavy focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_-8px_rgba(252,235,8,0.5)] active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-srcc-portalNavy/30 border-t-srcc-portalNavy rounded-full animate-spin"></div>
            ) : (
              "AUTHENTICATE SYSTEM"
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[2px]">
                SRCC Admin Assist
            </p>
            <p className="mt-2 text-[9px] text-white/20">
                Developed with Curiosity by <span className="text-white/40">Keshav Singal (24BC702)</span>
            </p>
        </div>
      </div>
    </div>
  );
}
