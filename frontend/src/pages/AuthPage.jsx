import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Zap, MessageSquare, Video, Shield, Lock, Globe } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, label: 'Real-time messaging',  desc: 'Instant delivery with WebSocket' },
  { icon: Video,         label: 'HD video calls',       desc: 'Peer-to-peer via WebRTC' },
  { icon: Shield,        label: 'Secured by Clerk',     desc: 'Enterprise-grade auth' },
];

const STATS = [
  { value: '<50ms', label: 'Latency' },
  { value: 'E2E',   label: 'Encrypted' },
  { value: '4K',    label: 'Video' },
];

export default function AuthPage() {
  return (
    <div className="relative min-h-screen flex bg-void overflow-hidden">

      {/* ── Aurora blobs ─────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-aurora-violet rounded-full blur-3xl animate-aurora opacity-60" />
        <div className="absolute -bottom-32 -right-32 w-[250px] h-[250px] md:w-[450px] md:h-[450px] bg-aurora-blue rounded-full blur-3xl animate-aurora-slow opacity-40" />
        <div className="absolute top-1/3 right-1/4 w-[180px] h-[180px] md:w-[300px] md:h-[300px] bg-aurora-green rounded-full blur-3xl animate-aurora opacity-15" />
      </div>

      {/* ── Grid lines ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(124,58,237,1) 1px, transparent 1px),
                            linear-gradient(to right, rgba(124,58,237,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT — stacked, compact, scrollable
          ══════════════════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 flex flex-col items-center w-full min-h-dvh px-4 py-6 pt-safe pb-safe overflow-y-auto overscroll-contain">
        {/* Brand — compact */}
        <div className="flex flex-col items-center gap-3 animate-fade-up text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-accent-grad flex items-center justify-center shadow-glow-sm">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight gradient-text-white">Nexus</h1>
            <p className="text-xs text-text-second mt-1 font-medium">
              Real-time chat & HD video — elevated.
            </p>
          </div>
        </div>

        {/* Clerk SignIn — compact */}
        <div className="w-full max-w-sm animate-scale-in">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-elevated/80 backdrop-blur-glass border border-border-mid rounded-2xl shadow-float !py-4 !px-5',
                headerTitle: 'text-text-bright font-bold !text-base',
                headerSubtitle: 'text-text-second !text-xs',
                socialButtonsBlockButton: 'bg-overlay border-border-mid hover:bg-hover !py-2',
                formFieldInput: 'bg-overlay border-border-soft text-text-primary rounded-xl !py-2',
                formButtonPrimary: 'bg-accent-grad shadow-glow-sm hover:shadow-glow !py-2.5',
                footerActionLink: 'text-electric-400 hover:text-electric-300',
                formFieldRow: '!mb-2',
                footer: '!pt-2',
                dividerRow: '!my-2',
                socialButtons: '!mb-0',
              },
            }}
          />
        </div>

        {/* Feature pills — mobile */}
        <div className="flex flex-wrap gap-1.5 justify-center mt-4">
          {FEATURES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold
                         bg-electric/10 border border-border-accent text-electric-300"
            >
              <Icon size={10} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT — side-by-side split
          ══════════════════════════════════════════════════════ */}
      <div className="hidden md:flex relative z-10 w-full min-h-screen">

        {/* ── Left: Brand / Hero panel ─────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 lg:px-16 py-12 relative">
          {/* Brand */}
          <div className="flex flex-col items-center lg:items-start gap-5 animate-fade-up max-w-md text-center lg:text-left">
            <div className="w-16 h-16 rounded-2xl bg-accent-grad flex items-center justify-center shadow-glow">
              <Zap size={30} className="text-white" />
            </div>

            <div>
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight gradient-text-white leading-[1.1]">
                Nexus
              </h1>
              <p className="text-base text-text-second mt-3 font-medium leading-relaxed max-w-sm">
                Real-time chat & HD video calling.
                <br className="hidden lg:block" />
                Built for speed, designed to impress.
              </p>
            </div>

            {/* Feature cards */}
            <div className="flex flex-col gap-3 mt-4 w-full max-w-sm">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-2xl
                             bg-elevated/40 backdrop-blur-sm border border-border-soft
                             hover:border-border-accent hover:bg-electric/5
                             transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-electric/10 border border-border-accent
                                  flex items-center justify-center flex-shrink-0
                                  group-hover:bg-electric/20 transition-colors duration-200">
                    <Icon size={16} className="text-electric-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-bright">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 mt-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="text-lg font-extrabold gradient-text">{value}</p>
                  <p className="text-2xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Auth card panel ───────────────────────── */}
        <div className="w-[440px] lg:w-[480px] flex-shrink-0 flex items-center justify-center
                        px-8 py-12 relative
                        border-l border-border-faint bg-abyss/50 backdrop-blur-sm">
          {/* Subtle glow behind the card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-80 h-80 bg-aurora-violet rounded-full blur-3xl opacity-30 pointer-events-none" />

          <div className="relative w-full max-w-sm animate-scale-in">
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
    </div>
  );
}
