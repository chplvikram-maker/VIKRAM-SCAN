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
    <div className="min-h-screen flex items-center justify-center p-6 bg-natural-bg">
      <div className="w-full max-w-sm space-y-12 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto w-24 h-24 bg-natural-accent rounded-[32px] flex items-center justify-center shadow-2xl shadow-natural-accent/20"
        >
          <Scan className="w-12 h-12 text-white" />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-5xl font-black text-natural-text tracking-tight">
            VIKRAM<br /><span className="text-natural-accent opacity-80">SCAN</span>
          </h1>
          <p className="text-natural-muted font-bold uppercase tracking-[0.2em] text-[10px]">
            System Access Terminal
          </p>
        </div>

        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black text-natural-muted uppercase tracking-widest ml-4">
              Authorized Operator
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-natural-muted group-focus-within:text-natural-accent transition-colors" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Full Name"
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-2 border-natural-border focus:border-natural-accent outline-none transition-all text-natural-text shadow-sm font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-natural-accent hover:bg-natural-text text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-natural-accent/30 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            Authenticate
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.form>

        <div className="pt-8 border-t border-natural-border/50">
          <p className="text-[10px] text-natural-muted uppercase tracking-[0.25em] font-black">
            Master Data Sync Mode Active
          </p>
        </div>
      </div>
    </div>
  );
}
