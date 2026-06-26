import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Zap, MessageSquare, Video, Shield } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, label: 'Real-time messaging' },
  { icon: Video,         label: 'HD video calls' },
  { icon: Shield,        label: 'Clerk-secured auth' },
];

export default function AuthPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-void overflow-hidden px-4 py-10">

      {/* ── Aurora blobs ─────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-aurora-violet rounded-full blur-3xl animate-aurora opacity-70" />
        <div className="absolute -bottom-40 -right-40 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-aurora-blue rounded-full blur-3xl animate-aurora-slow opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-aurora-green rounded-full blur-3xl animate-aurora opacity-20" />
      </div>

      {/* ── Grid lines ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,1) 1px, transparent 1px),
                            linear-gradient(to right, rgba(124,58,237,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Main card layout ─────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm">

        {/* Brand */}
        <div className="flex flex-col items-center gap-4 animate-fade-up text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-grad flex items-center justify-center shadow-glow">
            <Zap size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight gradient-text-white">Nexus</h1>
            <p className="text-sm text-text-second mt-2 font-medium">
              Real-time chat & HD video — elevated.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                           bg-electric/10 border border-border-accent text-electric-300"
              >
                <Icon size={12} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Clerk SignIn card */}
        <div className="w-full animate-scale-in" style={{ animationDelay: '0.15s' }}>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-elevated/80 backdrop-blur-glass border border-border-mid rounded-3xl shadow-float',
                headerTitle: 'text-text-bright font-bold',
                headerSubtitle: 'text-text-second',
                socialButtonsBlockButton: 'bg-overlay border-border-mid hover:bg-hover',
                formFieldInput: 'bg-overlay border-border-soft text-text-primary rounded-xl',
                formButtonPrimary: 'bg-accent-grad shadow-glow-sm hover:shadow-glow',
                footerActionLink: 'text-electric-400 hover:text-electric-300',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
