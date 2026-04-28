import { useState, type FormEvent } from 'react';
import { User, ArrowRight, Scan } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-natural-accent opacity-5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-natural-accent opacity-5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-12 relative z-10"
      >
        <div className="space-y-4">
          <div className="w-16 h-16 bg-natural-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-natural-accent/30 rotate-3">
            <Scan className="w-8 h-8 text-white -rotate-3" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black text-natural-text tracking-tighter leading-[0.9]">
              VIKRAM<br /><span className="text-natural-accent opacity-80">SCAN</span>
            </h1>
            <p className="text-natural-muted font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
              System Access Terminal
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-natural-muted uppercase tracking-[0.2em] ml-4">
              Operator Identity
            </label>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted group-focus-within:text-natural-accent transition-colors" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER STAFF ID / NAME"
                className="w-full pl-14 pr-6 py-5 bg-white rounded-[2rem] border-2 border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text shadow-lg shadow-black/5 font-bold"
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-natural-text text-white p-5 rounded-[2rem] font-bold uppercase tracking-widest shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Authenticate Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-6 px-4">
          <div className="flex-1 h-px bg-natural-border" />
          <div className="text-[9px] font-black text-natural-muted uppercase tracking-[0.3em] whitespace-nowrap">
            Warehouse Ops v2.0
          </div>
          <div className="flex-1 h-px bg-natural-border" />
        </div>
      </motion.div>
    </div>
  );
}
