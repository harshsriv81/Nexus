import React from 'react';
import Avatar from '../ui/Avatar';
import { VideoOff } from 'lucide-react';

export default function VideoGrid({ localVideoRef, remoteVideoRef, session, cameraOff }) {
  const remoteName = session.isIncoming ? session.callerName : session.targetName;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 p-3 md:p-4 bg-abyss min-h-[200px] md:min-h-[340px]">
      {/* Remote — main */}
      <div className="relative bg-surface rounded-2xl overflow-hidden border border-border-soft aspect-video col-span-1">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Placeholder if no remote stream yet */}
        <div className="absolute inset-0 flex items-center justify-center bg-overlay opacity-0 peer-placeholder:opacity-100">
          <Avatar name={remoteName} size="lg" />
        </div>
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-void/70 backdrop-blur-sm text-xs font-semibold text-text-primary border border-border-soft">
          {remoteName}
        </div>
      </div>

      {/* Local — self */}
      <div className="relative bg-surface rounded-2xl overflow-hidden border border-border-soft aspect-video col-span-1">
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
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-electric/50 backdrop-blur-sm text-xs font-semibold text-white border border-border-accent">
          You
        </div>
      </div>
    </div>
  );
}
