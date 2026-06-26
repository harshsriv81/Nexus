import React from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';

export default function DeploymentBanner({ configError, socketError, isConnected }) {
  if (!configError && !socketError && isConnected) return null;

  return (
    <div className="flex-shrink-0 px-3 py-2.5 bg-rose/10 border-b border-rose/30">
      <div className="flex items-start gap-2 max-w-3xl mx-auto">
        <AlertTriangle size={16} className="text-rose flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          {configError ? (
            <>
              <p className="text-xs font-bold text-rose">Backend not configured</p>
              <p className="text-xs text-text-second mt-0.5 leading-relaxed">{configError}</p>
            </>
          ) : socketError ? (
            <>
              <p className="text-xs font-bold text-rose flex items-center gap-1.5">
                <WifiOff size={12} /> Cannot reach Render backend
              </p>
              <p className="text-xs text-text-second mt-0.5 leading-relaxed">
                {socketError}. Check VITE_SOCKET_URL on Vercel and FRONTEND_URL on Render match your live URLs, then redeploy both.
              </p>
            </>
          ) : !isConnected ? (
            <p className="text-xs text-amber font-medium">
              Connecting to server… (Render free tier may take ~30s to wake up)
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
