import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Play, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';
import { WeddingConfig } from '../../data/weddingConfig';
import { soundEngine } from '../../utils/soundEngine';

interface MiniGameSectionProps {
  config: WeddingConfig;
  earnedTitle: string | null;
  onUnlockTitle: (title: string) => void;
}

interface FallingItem {
  x: number;
  y: number;
  vy: number;
  type: 'bouquet' | 'ring' | 'heart' | 'cloud';
}

export const MiniGameSection: React.FC<MiniGameSectionProps> = ({
  config,
  earnedTitle,
  onUnlockTitle,
}) => {
  const [subTab, setSubTab] = useState<'arcade' | 'quiz'>('arcade');

  // Arcade Game State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  const playerXRef = useRef<number>(150);
  const scoreRef = useRef<number>(0);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const startArcadeGame = () => {
    soundEngine.playSelect();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(20);
    setGameOver(false);
    setIsPlaying(true);
  };

  // Timer countdown while playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsPlaying(false);
          setGameOver(true);
          soundEngine.playFanfare();

          const finalScore = scoreRef.current;
          setHighScore((hs) => Math.max(hs, finalScore));

          let badge = '🌸 축복의 모험가';
          if (finalScore >= 220) {
            badge = '👑 전설의 부케 스나이퍼';
          } else if (finalScore >= 120) {
            badge = '💍 다이아 축복 마스터';
          }
          onUnlockTitle(badge);

          try {
            confetti({
              particleCount: 45,
              spread: 65,
              origin: { y: 0.6 },
            });
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying, onUnlockTitle]);

  // Arcade Canvas Loop
  useEffect(() => {
    if (!isPlaying || subTab !== 'arcade') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 300;
    const H = 240;
    canvas.width = W;
    canvas.height = H;

    const items: FallingItem[] = [];
    let tick = 0;
    let animId: number;

    const render = () => {
      tick++;

      // Spawn falling items
      if (tick % 18 === 0) {
        const rand = Math.random();
        const type: FallingItem['type'] =
          rand < 0.18
            ? 'ring'
            : rand < 0.45
            ? 'bouquet'
            : rand < 0.78
            ? 'heart'
            : 'cloud';

        items.push({
          x: 20 + Math.random() * (W - 40),
          y: -12,
          vy: 1.8 + Math.random() * 1.6,
          type,
        });
      }

      // Draw Sky Background
      ctx.fillStyle = '#18122b';
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = '#ffd541';
      ctx.fillRect(30, 25, 2, 2);
      ctx.fillRect(120, 40, 2, 2);
      ctx.fillRect(240, 20, 2, 2);
      ctx.fillRect(200, 65, 2, 2);

      // Ground
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(0, H - 24, W, 24);
      ctx.fillStyle = '#ffd541';
      ctx.fillRect(0, H - 24, W, 2);

      // Draw Player Basket / Couple Catcher
      const px = playerXRef.current;
      const py = H - 36;

      // Pixel Basket & Couple
      ctx.fillStyle = '#ff5277';
      ctx.fillRect(px - 22, py, 44, 12);
      ctx.strokeStyle = '#ffd541';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 22, py, 44, 12);

      ctx.fillStyle = '#fff8e7';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('♥ CATCH ♥', px, py + 9);

      // Update & Draw Falling Items
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy;

        // Draw item
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        const icon =
          it.type === 'ring'
            ? '💍'
            : it.type === 'bouquet'
            ? '💐'
            : it.type === 'heart'
            ? '💖'
            : '⛈️';
        ctx.fillText(icon, it.x, it.y);

        // Collision check with catcher
        if (it.y >= py - 6 && it.y <= py + 16 && Math.abs(it.x - px) < 28) {
          if (it.type === 'cloud') {
            soundEngine.playDamage();
            scoreRef.current = Math.max(0, scoreRef.current - 15);
          } else {
            soundEngine.playCoin();
            const pts =
              it.type === 'ring' ? 50 : it.type === 'bouquet' ? 30 : 15;
            scoreRef.current += pts;
          }
          setScore(scoreRef.current);
          items.splice(i, 1);
          continue;
        }

        if (it.y > H) {
          items.splice(i, 1);
        }
      }

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animId);
  }, [isPlaying, subTab]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 300;
    playerXRef.current = Math.max(26, Math.min(274, relX));
  };

  return (
    <div className="space-y-4">
      {/* Header & Mode Tabs */}
      <div className="pixel-box p-3.5 bg-[#1f1833] flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#38d9a9] text-[#120d1e]">
            BONUS STAGE · 축복의 분수대
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-[#ffd541] mt-1">
            ⛲ 미니게임 & 신랑·신부 퀴즈 (칭호 획득소)
          </h3>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => {
              soundEngine.playBlip();
              setSubTab('arcade');
            }}
            className={`pixel-btn px-3 py-1.5 text-xs font-extrabold ${
              subTab === 'arcade'
                ? 'bg-[#38d9a9] text-[#120d1e]'
                : 'bg-[#140f21] text-[#a599b8]'
            }`}
          >
            💐 부케 캐치 게임
          </button>
          <button
            onClick={() => {
              soundEngine.playBlip();
              setSubTab('quiz');
            }}
            className={`pixel-btn px-3 py-1.5 text-xs font-extrabold ${
              subTab === 'quiz'
                ? 'bg-[#ffd541] text-[#120d1e]'
                : 'bg-[#140f21] text-[#a599b8]'
            }`}
          >
            💡 커플 TMI 퀴즈
          </button>
        </div>
      </div>

      {/* Earned Title Banner */}
      {earnedTitle && (
        <div className="bg-[#261e3d] border-2 border-[#ffd541] p-2.5 flex items-center justify-between text-xs">
          <span className="text-[#ffd541] font-extrabold flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#ffd541]" /> 현재 획득한 특별 칭호 :
          </span>
          <span className="px-2.5 py-0.5 bg-[#ff5277] text-white font-extrabold">
            {earnedTitle} (방명록 자동 장착!)
          </span>
        </div>
      )}

      {subTab === 'arcade' ? (
        <div className="pixel-box-gold p-4 bg-[#171128] space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-[#38d9a9]">SCORE : {score} PT</span>
            <span className="text-[#ffd541]">HIGH : {highScore} PT</span>
            <span className="text-[#ff5277]">TIME : {timeLeft}s</span>
          </div>

          <div className="text-[11px] text-[#c3b8d9] bg-[#120d1e] px-3 py-1.5 border border-[#362b52] flex flex-wrap justify-between gap-2">
            <span>💍 다이아 반지 (+50)</span>
            <span>💐 부케 (+30)</span>
            <span>💖 하트 (+15)</span>
            <span className="text-[#ff8787]">⛈️ 먹구름 (-15)</span>
          </div>

          {/* Game Viewport */}
          <div className="relative w-full aspect-[300/240] bg-[#120d1e] border-2 border-[#ffd541] overflow-hidden">
            {isPlaying ? (
              <canvas
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerMove}
                className="w-full h-full block touch-none cursor-ew-resize pixelated"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-3 bg-gradient-to-b from-[#1a1330] to-[#120d1e]">
                <div className="text-3xl">💐 💍 💖</div>
                {gameOver ? (
                  <>
                    <div className="text-sm font-extrabold text-[#ffd541]">
                      STAGE CLEAR! 최종 점수 : {score}점
                    </div>
                    <p className="text-xs text-[#38d9a9]">
                      획득 칭호 [{earnedTitle}]가 방명록 캐릭터에 장착되었습니다!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-extrabold text-white">
                      20초 동안 떨어지는 부케와 반지를 받아보세요!
                    </div>
                    <p className="text-xs text-[#a599b8]">
                      화면을 좌우로 드래그하거나 아래 화살표 버튼으로 움직일 수 있습니다.
                    </p>
                  </>
                )}

                <button
                  onClick={startArcadeGame}
                  className="pixel-btn bg-[#ff5277] text-white px-5 py-2.5 text-xs sm:text-sm font-extrabold flex items-center gap-2"
                >
                  {gameOver ? (
                    <>
                      <RotateCcw className="w-4 h-4" /> 다시 도전하기
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> GAME START (20초)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Left / Right Buttons for Mobile Convenience */}
          {isPlaying && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onPointerDown={() => {
                  playerXRef.current = Math.max(26, playerXRef.current - 32);
                }}
                className="pixel-btn bg-[#2e2448] text-[#ffd541] py-2.5 text-xs font-extrabold"
              >
                ◀ 왼쪽으로 이동
              </button>
              <button
                onPointerDown={() => {
                  playerXRef.current = Math.min(274, playerXRef.current + 32);
                }}
                className="pixel-btn bg-[#2e2448] text-[#ffd541] py-2.5 text-xs font-extrabold"
              >
                오른쪽으로 이동 ▶
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Couple TMI Quiz Tab */
        <div className="space-y-3">
          {config.quiz.map((q) => {
            const picked = quizAnswers[q.id];
            const isAnswered = picked !== undefined;
            const isCorrect = picked === q.correctIndex;

            return (
              <div key={q.id} className="pixel-box p-4 bg-[#181229] space-y-2.5">
                <div className="text-xs sm:text-sm font-extrabold text-[#ffd541] flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#ff5277] shrink-0 mt-0.5" />
                  <span>{q.question}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => {
                    const selectedThis = picked === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (idx === q.correctIndex) {
                            soundEngine.playFanfare();
                            onUnlockTitle('🎓 신랑신부 박사님');
                          } else {
                            soundEngine.playBlip(300);
                          }
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: idx }));
                        }}
                        className={`text-left px-3 py-2 text-xs font-bold border transition-all ${
                          selectedThis
                            ? isCorrect
                              ? 'bg-[#2b4c3f] border-[#38d9a9] text-[#38d9a9]'
                              : 'bg-[#4a1c2a] border-[#ff5277] text-[#ff8787]'
                            : 'bg-[#120d1e] border-[#362b52] text-[#e9ecef] hover:border-[#ffd541]'
                        }`}
                      >
                        {idx + 1}. {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className={`p-2.5 text-xs font-bold border ${
                      isCorrect
                        ? 'bg-[#1a332a] border-[#38d9a9] text-[#38d9a9]'
                        : 'bg-[#331a24] border-[#ff5277] text-[#ff87ab]'
                    }`}
                  >
                    {isCorrect ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {q.explanation}
                      </span>
                    ) : (
                      <span>앗, 아쉽네요! 다른 보기를 다시 골라보세요 😊</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
