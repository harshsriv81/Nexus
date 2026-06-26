import React from 'react';
import Avatar from '../ui/Avatar';
import { VideoOff } from 'lucide-react';

export default function VideoGrid({ localVideoRef, remoteVideoRef, session, cameraOff }) {
  const remoteName = session.isIncoming ? session.callerName : session.targetName;

  const localPreview = cameraOff ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-overlay">
      <VideoOff size={22} className="text-text-muted" />
      <span className="text-2xs text-text-muted">Camera off</span>
    </div>
  ) : (
    <video
      ref={localVideoRef}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover scale-x-[-1] bg-surface"
    />
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-3 p-3 md:p-4 bg-abyss overflow-hidden">
      {/* Remote — full area on mobile */}
      <div className="relative flex-1 min-h-[200px] bg-surface rounded-2xl overflow-hidden border border-border-soft">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-surface"
        />
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-void/70 backdrop-blur-sm text-xs font-semibold text-text-primary border border-border-soft">
          {remoteName}
        </div>

        {/* Local PiP on mobile */}
        <div className="md:hidden absolute bottom-3 right-3 w-28 h-36 rounded-xl overflow-hidden border-2 border-border-accent shadow-float bg-surface">
          {localPreview}
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-electric/60 text-2xs font-semibold text-white">
            You
          </div>
        </div>
      </div>

      {/* Local — side panel on desktop */}
      <div className="hidden md:block relative bg-surface rounded-2xl overflow-hidden border border-border-soft aspect-video">
        {cameraOff ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-overlay">
            <VideoOff size={28} className="text-text-muted" />
            <span className="text-xs text-text-muted">Camera off</span>
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1] bg-surface"
          />
        )}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-electric/50 backdrop-blur-sm text-xs font-semibold text-white border border-border-accent">
          You
        </div>
      </div>
    </div>
  );
}
