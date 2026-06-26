import React from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { PhoneCall, PhoneOff } from 'lucide-react';

export default function RingingPanel({ session, callStatus, onAccept, onDecline, onCancel }) {
  const name = session.isIncoming ? session.callerName : session.targetName;

  return (
    <div className="relative flex flex-col items-center px-6 md:px-10 py-10 md:py-14 text-center overflow-hidden">
      {/* Background aurora glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-aurora-violet rounded-full blur-3xl opacity-50" />
      </div>

      {/* Pulsing avatar ring */}
      <div className="relative mb-6 z-10">
        <div className="absolute inset-0 rounded-full animate-pulse-ring" />
        <Avatar
          name={name}
          size="xl"
          className="border-4 border-electric shadow-glow"
        />
      </div>

      {/* Name + status */}
      <h2 className="text-2xl font-extrabold text-text-bright tracking-tight mb-2 z-10">{name}</h2>
      <p className="text-sm text-text-second mb-10 z-10 font-medium">{callStatus}</p>

      {/* Actions */}
      <div className="flex gap-4 z-10">
        {session.isIncoming ? (
          <>
            <Button variant="success" size="lg" icon={<PhoneCall size={18} />} onClick={onAccept}>
              Accept
            </Button>
            <Button variant="danger" size="lg" icon={<PhoneOff size={18} />} onClick={onDecline}>
              Decline
            </Button>
          </>
        ) : (
          <Button variant="danger" size="lg" icon={<PhoneOff size={18} />} onClick={onCancel}>
            Cancel Call
          </Button>
        )}
      </div>
    </div>
  );
}
