import React from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useMessages } from '../../hooks/useMessages';

export default function ChatPanel({ convo, currentUser, onBack, onVideoCall }) {
  const {
    messages,
    typingUser,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
  } = useMessages(convo._id, currentUser?._id);

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-void bg-chat-mesh relative">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-aurora-violet rounded-full blur-3xl opacity-40 animate-aurora" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-aurora-blue rounded-full blur-3xl opacity-30 animate-aurora-slow" />
      </div>

      <ChatHeader
        convo={convo}
        currentUserId={currentUser?._id}
        onBack={onBack}
        onVideoCall={() => {
          const other = convo.participants.find(p => p._id !== currentUser?._id);
          onVideoCall?.(other);
        }}
      />

      <MessageList
        messages={messages}
        typingUser={typingUser}
        isLoading={isLoading}
        currentUserId={currentUser?._id}
        isGroup={convo.isGroup}
      />

      <ChatInput
        onSend={sendMessage}
        onTyping={startTyping}
        onStopTyping={stopTyping}
        username={currentUser?.username}
      />
    </div>
  );
}
