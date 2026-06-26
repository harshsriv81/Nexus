import React from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function CallControls({
  isConnected,
  micMuted,
  cameraOff,
  onToggleMic,
  onToggleCamera,
  onHangup,
}) {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-4 px-4 md:px-6 py-4 md:py-5 border-t border-border-faint bg-surface">
      {/* Mic */}
      <button
        onClick={onToggleMic}
        title={micMuted ? 'Unmute' : 'Mute'}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          border transition-all duration-150 hover:scale-105
          ${micMuted
            ? 'bg-electric/15 border-border-accent text-electric-400'
            : 'bg-overlay border-border-mid text-text-primary hover:bg-hover'
          }
        `}
      >
        {micMuted ? <MicOff size={19} /> : <Mic size={19} />}
      </button>

      {/* Hang up — always center, biggest */}
      <button
        onClick={onHangup}
        title="End Call"
        className="w-14 h-14 rounded-full flex items-center justify-center
                   bg-rose text-white border border-rose shadow-red
                   hover:brightness-110 hover:scale-105 transition-all duration-150"
      >
        <PhoneOff size={22} />
      </button>

      {/* Camera */}
      <button
        onClick={onToggleCamera}
        title={cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          border transition-all duration-150 hover:scale-105
          ${cameraOff
            ? 'bg-electric/15 border-border-accent text-electric-400'
            : 'bg-overlay border-border-mid text-text-primary hover:bg-hover'
          }
        `}
      >
        {cameraOff ? <VideoOff size={19} /> : <Video size={19} />}
      </button>
    </div>
  );
}
