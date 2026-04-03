import { useEffect, useState } from 'react';

export default function AchievementToast({ achievement, onDone }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!achievement) return;
    setShow(true);
    const t = setTimeout(() => { setShow(false); setTimeout(onDone, 400); }, 3500);
    return () => clearTimeout(t);
  }, [achievement]);

  if (!achievement) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none transition-all duration-400"
      style={{
        opacity: show ? 1 : 0,
        transform: `translateX(-50%) translateY(${show ? 0 : -20}px)`,
      }}
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,50,0.97), rgba(20,20,35,0.97))',
          border: '1px solid rgba(212,175,55,0.4)',
          boxShadow: '0 8px 32px rgba(212,175,55,0.2), 0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <div className="text-3xl">{achievement.icon}</div>
        <div>
          <div className="text-gold font-black text-sm tracking-wide">ACHIEVEMENT UNLOCKED</div>
          <div className="text-white font-bold text-base">{achievement.name}</div>
          <div className="text-gray-400 text-xs">{achievement.desc}</div>
        </div>
      </div>
    </div>
  );
}
