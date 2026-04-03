import { useState, useEffect, useRef } from 'react';

// AI trash talk / table chat lines
const AI_LINES = {
  fold: [
    'Smart fold.', 'You had nothing anyway, right?', 'Saved yourself some chips.',
    'Good discipline.', 'I would have done the same.', 'Live to fight another hand.',
  ],
  win: [
    'Nice hand!', 'Well played.', 'Can\'t argue with that.',
    'You got lucky there...', 'I\'ll get you next time.', 'Respect.',
    'That was clean.', 'Okay, okay... good one.',
  ],
  lose: [
    'Better luck next time.', 'Ouch.', 'That\'s poker!',
    'You\'ll bounce back.', 'It happens to everyone.', 'Shake it off.',
  ],
  allin: [
    'Bold move!', 'All the chips in the middle!', 'Brave or crazy?',
    'This is getting interesting...', 'Let\'s see what you\'ve got.',
    'No guts, no glory!', 'BIG bet!',
  ],
  bluff: [
    'Was that a bluff?', 'Show your cards, coward!', 'I knew it!',
    'You got away with one there.', 'Sneaky...',
  ],
  generic: [
    'Good game so far.', 'Anyone else hungry?', 'Dealer, can we speed this up?',
    'I\'m feeling lucky.', 'This table is tough.',
    'Don\'t tap the glass.', 'Poker face: activated.',
  ],
};

function getRandomLine(category) {
  const lines = AI_LINES[category] || AI_LINES.generic;
  return lines[Math.floor(Math.random() * lines.length)];
}

export default function TableChat({ lastAction, handComplete, playerId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  // AI generates chat based on game events
  useEffect(() => {
    if (!lastAction || lastAction.playerId === playerId) return;
    // Only occasionally chat (30% chance)
    if (Math.random() > 0.3) return;

    let category = 'generic';
    if (lastAction.type === 'fold') category = 'fold';
    else if (lastAction.type === 'allin') category = 'allin';

    const line = getRandomLine(category);
    const msg = { sender: lastAction.playerName || 'AI', text: line, ts: Date.now(), isAI: true };
    setMessages(prev => [...prev.slice(-30), msg]);
    if (!open) setUnread(u => u + 1);
  }, [lastAction]);

  // Chat on hand complete
  useEffect(() => {
    if (!handComplete) return;
    const isWinner = handComplete.winners?.some(w => w.playerId === playerId);
    if (Math.random() > 0.5) return;

    const category = isWinner ? 'win' : 'lose';
    const aiName = handComplete.players?.find(p => p.id !== playerId && !p.folded)?.name || 'AI';
    const line = getRandomLine(category);
    const msg = { sender: aiName, text: line, ts: Date.now(), isAI: true };
    setMessages(prev => [...prev.slice(-30), msg]);
    if (!open) setUnread(u => u + 1);
  }, [handComplete]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev.slice(-30), { sender: 'You', text: input.trim(), ts: Date.now() }]);
    setInput('');
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => { setOpen(!open); setUnread(0); }}
        className="absolute bottom-20 right-2 z-30 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">{unread}</span>
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="absolute bottom-20 right-2 z-40 w-64 max-h-60 rounded-xl overflow-hidden animate-fade-in"
          style={{
            background: 'rgba(15,15,25,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Messages */}
          <div className="p-2 overflow-y-auto" style={{ maxHeight: 180 }}>
            {messages.length === 0 && (
              <div className="text-gray-600 text-xs text-center py-4">No messages yet</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="mb-1.5">
                <span className={`text-[10px] font-bold ${msg.isAI ? 'text-blue-400' : 'text-gold'}`}>
                  {msg.sender}:
                </span>
                <span className="text-xs text-gray-300 ml-1">{msg.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex border-t border-gray-800 p-1.5 gap-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type..."
              className="flex-1 bg-gray-800 rounded-lg px-2 py-1 text-xs text-white placeholder-gray-600 outline-none"
              maxLength={100}
            />
            <button
              onClick={sendMessage}
              className="bg-gold text-black font-bold text-xs px-2 py-1 rounded-lg active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
