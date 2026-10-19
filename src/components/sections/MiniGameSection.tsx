import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, Play, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  const playerXRef = useRef<number>(150);
  const scoreRef = useRef<number>(0);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const startArcadeGame = () => {
    soundEngine.playSelect();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(20);
    setGameOver(false);
    setIsPlaying(true);
  };

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

          let badge = '🌸 봄날의 하객';
          if (finalScore >= 200) {
            badge = '💐 부케의 주인공';
          } else if (finalScore >= 110) {
            badge = '💍 축복의 메신저';
          }
          onUnlockTitle(badge);

          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.65 },
              colors: ['#e899a0', '#d4af7a', '#84a98c'],
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

  useEffect(() => {
    if (!isPlaying || subTab !== 'arcade') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 300;
    const H = 220;
    canvas.width = W;
    canvas.height = H;

    const items: FallingItem[] = [];
    let tick = 0;
    let animId: number;

    const render = () => {
      tick++;

      if (tick % 19 === 0) {
        const rand = Math.random();
        const type: FallingItem['type'] =
          rand < 0.2
            ? 'ring'
            : rand < 0.5
            ? 'bouquet'
            : rand < 0.82
            ? 'heart'
            : 'cloud';

        items.push({
          x: 24 + Math.random() * (W - 48),
          y: -12,
          vy: 1.6 + Math.random() * 1.4,
          type,
        });
      }

      // Soft Sunlit Cream Sky
      ctx.fillStyle = '#fdf8f2';
      ctx.fillRect(0, 0, W, H);

      // Sage Garden Lawn
      ctx.fillStyle = '#bdd2b6';
      ctx.fillRect(0, H - 24, W, 24);
      ctx.fillStyle = '#d4b48c';
      ctx.fillRect(0, H - 24, W, 1.5);

      // Catcher Basket
      const px = playerXRef.current;
      const py = H - 36;

      ctx.fillStyle = '#d97b84';
      ctx.fillRect(px - 24, py, 48, 12);
      ctx.strokeStyle = '#fffdf9';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 24, py, 48, 12);

      ctx.fillStyle = '#fffdf9';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('♥ BOUQUET ♥', px, py + 9);

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy;

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        const icon =
          it.type === 'ring'
            ? '💍'
            : it.type === 'bouquet'
            ? '💐'
            : it.type === 'heart'
            ? '🌸'
            : '🌧️';
        ctx.fillText(icon, it.x, it.y);

        if (it.y >= py - 6 && it.y <= py + 16 && Math.abs(it.x - px) < 28) {
          if (it.type === 'cloud') {
            soundEngine.playDamage();
            scoreRef.current = Math.max(0, scoreRef.current - 10);
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
    <div className="pixel-card p-5 sm:p-6 bg-[#fffdf9] space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#efe6d8] pb-4">
        <div className="text-center sm:text-left">
          <div className="text-[11px] tracking-[0.25em] text-[#c59b6d] font-engSerif uppercase">
            GARDEN EVENT
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#3b2f2f] mt-0.5">
            정원의 작은 이벤트 (부케 캐치 & 커플 퀴즈)
          </h3>
        </div>

        <div className="flex items-center justify-center gap-1.5 font-sans">
          <button
            onClick={() => {
              soundEngine.playBlip();
              setSubTab('arcade');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              subTab === 'arcade'
                ? 'bg-[#d97b84] text-white border-[#d97b84]'
                : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
            }`}
          >
            💐 부케 받기
          </button>
          <button
            onClick={() => {
              soundEngine.playBlip();
              setSubTab('quiz');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              subTab === 'quiz'
                ? 'bg-[#3b2f2f] text-white border-[#3b2f2f]'
                : 'bg-[#faf5ec] text-[#7d6e65] border-[#e2d4c0]'
            }`}
          >
            💡 신랑·신부 퀴즈
          </button>
        </div>
      </div>

      {earnedTitle && (
        <div className="bg-[#fcf5f5] border border-[#e2a3a9] rounded-lg p-3 flex items-center justify-between text-xs font-sans">
          <span className="text-[#5c4d47] font-semibold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#d97b84]" /> 방명록 기념 뱃지 획득 :
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#d97b84] text-white font-bold">
            {earnedTitle}
          </span>
        </div>
      )}

      {subTab === 'arcade' ? (
        <div className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs font-bold text-[#5c4d47]">
            <span>현재 점수 : {score}점</span>
            <span>최고 기록 : {highScore}점</span>
            <span className="text-[#d97b84]">남은 시간 : {timeLeft}초</span>
          </div>

          <div className="relative w-full aspect-[300/220] bg-[#fdf8f2] rounded-lg border border-[#d4b48c] overflow-hidden">
            {isPlaying ? (
              <canvas
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerMove}
                className="w-full h-full block touch-none cursor-ew-resize pixelated"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center space-y-3">
                <div className="text-2xl">💐 💍 🌸</div>
                {gameOver ? (
                  <>
                    <div className="text-sm font-bold text-[#3b2f2f] font-serif">
                      참여해 주셔서 감사합니다! 최종 점수 : {score}점
                    </div>
                    <p className="text-xs text-[#7d6e65]">
                      방명록 작성 시 [{earnedTitle}] 타이틀이 함께 기록됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-[#3b2f2f] font-serif">
                      흩날리는 봄꽃과 부케를 받아보세요
                    </div>
                    <p className="text-xs text-[#7d6e65]">
                      화면을 좌우로 터치·드래그하여 부케(💐)와 반지(💍)를 모으는 작은 미니게임입니다.
                    </p>
                  </>
                )}

                <button
                  onClick={startArcadeGame}
                  className="px-5 py-2.5 rounded-full bg-[#d97b84] hover:bg-[#c96a73] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {gameOver ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> 다시 해보기
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> 부케 받기 시작 (20초)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 font-sans">
          {config.quiz.map((q) => {
            const picked = quizAnswers[q.id];
            const isAnswered = picked !== undefined;
            const isCorrect = picked === q.correctIndex;

            return (
              <div
                key={q.id}
                className="bg-[#faf5ec] border border-[#e6d5b8] rounded-xl p-4 space-y-2.5"
              >
                <div className="text-xs sm:text-sm font-bold text-[#3b2f2f] font-serif flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#d97b84] shrink-0 mt-0.5" />
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
                            onUnlockTitle('🌿 두 사람의 지기');
                          } else {
                            soundEngine.playBlip(360);
                          }
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: idx }));
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          selectedThis
                            ? isCorrect
                              ? 'bg-[#edf3ee] border-[#6b9071] text-[#3b5249] font-bold'
                              : 'bg-[#f9ebea] border-[#d97b84] text-[#b85d67]'
                            : 'bg-[#fffdf9] border-[#e2d4c0] text-[#5c4d47] hover:border-[#c59b6d]'
                        }`}
                      >
                        {idx + 1}. {opt}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className={`p-2.5 rounded-lg text-xs border ${
                      isCorrect
                        ? 'bg-[#edf3ee] border-[#a3bfa8] text-[#3b5249]'
                        : 'bg-[#f9ebea] border-[#e2a3a9] text-[#b85d67]'
                    }`}
                  >
                    {isCorrect ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {q.explanation}
                      </span>
                    ) : (
                      <span>다른 보기를 한 번 더 선택해 보세요 😊</span>
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
