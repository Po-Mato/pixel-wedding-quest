import React, { useEffect, useState } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Copy,
  Check,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Upload,
  Download,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import {
  WeddingConfig,
  DEFAULT_WEDDING_CONFIG,
  BankAccount,
  GalleryItem,
} from '../data/weddingConfig';
import { soundEngine } from '../utils/soundEngine';
import { syncAccountHolderNames } from '../utils/configSync';
import {
  adminLogin,
  fetchAdminOverview,
  saveCloudWeddingConfig,
  adminDeleteGuestbookEntry,
  adminToggleGuestbookHidden,
  adminChangePassword,
  AdminGuestbookRow,
  AdminOverviewStats,
} from '../utils/weddingCloudSync';

interface CustomizerModalProps {
  config: WeddingConfig;
  onUpdateConfig: (newConfig: WeddingConfig) => void;
  onClose: () => void;
}

type AdminTabId = 'couple' | 'venue' | 'accounts' | 'gallery' | 'guestbook' | 'security';

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<AdminTabId>('couple');
  const [draft, setDraft] = useState<WeddingConfig>(config);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string>('');

  const [adminEntries, setAdminEntries] = useState<AdminGuestbookRow[]>([]);
  const [rsvpSummary, setRsvpSummary] = useState<AdminOverviewStats | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(false);

  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [pwChangeNotice, setPwChangeNotice] = useState<string>('');
  const [copiedLinkType, setCopiedLinkType] = useState<string | null>(null);

  const handleCopyShareLink = (kind: 'friends' | 'parents' | 'groom_parents' | 'bride_parents') => {
    soundEngine.playCoin();
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    if (kind === 'parents') {
      url.searchParams.set('mode', 'parents');
    } else if (kind === 'groom_parents') {
      url.searchParams.set('mode', 'parents');
      url.searchParams.set('side', 'groom');
    } else if (kind === 'bride_parents') {
      url.searchParams.set('mode', 'parents');
      url.searchParams.set('side', 'bride');
    }
    navigator.clipboard?.writeText(url.toString()).catch(() => {});
    setCopiedLinkType(kind);
    setTimeout(() => setCopiedLinkType(null), 2500);
  };

  const loadCloudOverview = async (tokenOverride?: string) => {
    const tokenToUse = tokenOverride || adminToken;
    if (!tokenToUse) return;
    setIsLoadingOverview(true);
    try {
      const overview = await fetchAdminOverview(tokenToUse);
      if (overview) {
        setAdminEntries(overview.entries);
        setRsvpSummary(overview.stats);
      }
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (isUnlocked && adminToken) {
      loadCloudOverview(adminToken);
    }
  }, [isUnlocked, adminToken]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setPasswordError('');
    try {
      const pw = passwordInput.trim();
      const loginRes = await adminLogin(pw);
      if (loginRes.ok && loginRes.token) {
        soundEngine.playFanfare();
        setAdminToken(loginRes.token);
        setIsUnlocked(true);
        setPasswordError('');
      } else if (loginRes.error === 'too_many_login_attempts') {
        soundEngine.playBlip(220);
        setPasswordError(
          `로그인 시도가 너무 많습니다. ${loginRes.retryAfterSec || 900}초 후 다시 시도해 주세요.`
        );
      } else {
        soundEngine.playBlip(260);
        setPasswordError('비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCloud(true);
    setCloudSaveMessage('');
    const synced = syncAccountHolderNames(config, draft);
    onUpdateConfig(synced);
    const savedToCloud = adminToken
      ? await saveCloudWeddingConfig(adminToken, synced)
      : false;
    setIsSavingCloud(false);
    soundEngine.playFanfare();
    if (savedToCloud) {
      setCloudSaveMessage('✓ Cloudflare D1 데이터베이스에 실시간 저장되었습니다!');
      setTimeout(() => onClose(), 600);
    } else {
      onClose();
    }
  };

  const handleReset = () => {
    if (!window.confirm('모든 청첩장 정보를 초기 기본값으로 되돌리시겠습니까?')) return;
    soundEngine.playBlip(400);
    setDraft(DEFAULT_WEDDING_CONFIG);
    onUpdateConfig(DEFAULT_WEDDING_CONFIG);
  };

  const handleCopyJson = () => {
    soundEngine.playCoin();
    const synced = syncAccountHolderNames(config, draft);
    navigator.clipboard?.writeText(JSON.stringify(synced, null, 2)).catch(() => {});
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleDownloadJson = () => {
    soundEngine.playCoin();
    const synced = syncAccountHolderNames(config, draft);
    const blob = new Blob([JSON.stringify(synced, null, 2) + '\n'], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compress uploaded photo into a lightweight Data URL so it saves cleanly in localStorage / JSON
  const handlePhotoFileUpload = (index: number, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 760;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const nextGallery = [...draft.gallery];
          nextGallery[index] = { ...nextGallery[index], imageUrl: dataUrl };
          setDraft({ ...draft, gallery: nextGallery });
          soundEngine.playCoin();
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const updateAccount = (
    side: 'groomSide' | 'brideSide',
    idx: number,
    patch: Partial<BankAccount>
  ) => {
    const list = [...draft.accounts[side]];
    list[idx] = { ...list[idx], ...patch };
    setDraft({
      ...draft,
      accounts: { ...draft.accounts, [side]: list },
    });
  };

  const addAccount = (side: 'groomSide' | 'brideSide') => {
    soundEngine.playBlip(640);
    const nextItem: BankAccount = {
      role: side === 'groomSide' ? '신랑측' : '신부측',
      name: '',
      bank: '',
      accountNumber: '',
      kakaoPayUrl: '',
    };
    setDraft({
      ...draft,
      accounts: {
        ...draft.accounts,
        [side]: [...draft.accounts[side], nextItem],
      },
    });
  };

  const removeAccount = (side: 'groomSide' | 'brideSide', idx: number) => {
    const list = draft.accounts[side].filter((_, i) => i !== idx);
    setDraft({
      ...draft,
      accounts: { ...draft.accounts, [side]: list },
    });
  };

  const updateGalleryItem = (idx: number, patch: Partial<GalleryItem>) => {
    const list = [...draft.gallery];
    list[idx] = { ...list[idx], ...patch };
    setDraft({ ...draft, gallery: list });
  };

  const addGalleryItem = () => {
    soundEngine.playBlip(640);
    const nextItem: GalleryItem = {
      id: `photo-${Date.now()}`,
      title: '새로운 웨딩 스냅',
      subtitle: '소중한 순간의 기록',
      seasonTag: 'SPRING SNAP',
      questExp: 'MEMORY +100',
      imageUrl: draft.gallery[0]?.imageUrl || '',
      pixelTheme: 'cherry_blossom',
      description: '두 사람의 따뜻한 추억이 담긴 웨딩 사진입니다.',
      initialLikes: 24,
    };
    setDraft({ ...draft, gallery: [...draft.gallery, nextItem] });
  };

  const removeGalleryItem = (idx: number) => {
    if (draft.gallery.length <= 1) return;
    setDraft({
      ...draft,
      gallery: draft.gallery.filter((_, i) => i !== idx),
    });
  };

  const handleChangePassword = async () => {
    const pw = newPasswordInput.trim();
    if (pw.length < 8) {
      setPwChangeNotice('보안을 위해 비밀번호는 8자 이상 입력해 주세요.');
      return;
    }
    if (!adminToken) {
      setPwChangeNotice('관리자 세션이 유효하지 않습니다. 다시 로그인해 주세요.');
      return;
    }
    try {
      const res = await adminChangePassword(adminToken, pw);
      if (res.ok) {
        if (res.token) {
          setAdminToken(res.token);
        }
        soundEngine.playFanfare();
        setPwChangeNotice(
          '✓ 관리자 비밀번호가 PBKDF2-SHA256 암호화로 안전하게 변경되었으며 이전 세션 토큰은 폐기되었습니다.'
        );
        setNewPasswordInput('');
      } else {
        setPwChangeNotice('비밀번호 변경에 실패했습니다.');
      }
    } catch {
      setPwChangeNotice('비밀번호 저장에 실패했습니다.');
    }
  };

  const handleToggleEntryHidden = async (entry: AdminGuestbookRow) => {
    if (!adminToken) return;
    soundEngine.playSelect();
    const nextHidden = !entry.isHidden;
    const ok = await adminToggleGuestbookHidden(adminToken, entry.id, nextHidden);
    if (ok) {
      await loadCloudOverview();
    }
  };

  const handleAdminDeleteEntry = async (entry: AdminGuestbookRow) => {
    if (!adminToken) return;
    if (!window.confirm(`'${entry.name}'님의 방명록을 삭제하시겠습니까?`)) return;
    soundEngine.playBlip(360);
    const ok = await adminDeleteGuestbookEntry(adminToken, entry.id);
    if (ok) {
      await loadCloudOverview();
    }
  };

  // 1. LOCKED PASSWORD GATE VIEW
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
        <div className="pixel-card w-full max-w-sm bg-[#fffdf9] overflow-hidden animate-fadeIn">
          <div className="p-4 bg-[#faf5ec] border-b border-[#e6d5b8] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#3b2f2f]">
              <Lock className="w-4 h-4 text-[#d97b84]" />
              <span>관리자 전용 페이지 잠금</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#fffdf9] border border-[#e2d4c0] text-[#7d6e65]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUnlockSubmit} className="p-5 space-y-4">
            <div className="text-xs text-[#5c4d47] leading-relaxed bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8]">
              🔒 신랑·신부 정보, 웨딩홀, 계좌번호, 웨딩 사진, <strong>방명록 · 참석 여부(RSVP) DB</strong>를
              실시간 관리할 수 있는 관리자 콘솔입니다.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3b2f2f] mb-1">
                관리자 비밀번호 입력
              </label>
              <input
                type="password"
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="관리자 비밀번호를 입력하세요"
                className="w-full bg-[#fffdf9] border-2 border-[#d4b48c] focus:border-[#d97b84] outline-none rounded-xl px-3.5 py-2.5 text-sm text-[#3b2f2f]"
              />
              {passwordError && (
                <p className="text-[11px] text-[#c94a56] font-bold mt-1.5">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#faf5ec] border border-[#e2d4c0] text-xs font-bold text-[#7d6e65]"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="px-5 py-2 rounded-xl bg-[#3b2f2f] hover:bg-[#2a2020] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Unlock className="w-3.5 h-3.5 text-[#e6d5b8]" />
                <span>{isAuthenticating ? '인증 중...' : '관리자 인증하기'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. UNLOCKED 6-TAB ADMIN CONSOLE VIEW
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto font-sans">
      <div className="pixel-card w-full max-w-xl bg-[#fffdf9] max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Top Header */}
        <div className="p-3.5 bg-[#3b2f2f] text-[#fffdf9] border-b border-[#c59b6d] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold min-w-0">
            <Cloud className="w-4 h-4 text-[#93c9a2] shrink-0" />
            <span className="truncate">청첩장 클라우드 DB 관리자 콘솔</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded-lg bg-[#faf5ec] text-[#3b2f2f] hover:bg-[#f3e9d8] text-[11px] font-bold"
            >
              {copiedJson ? '✓ 복사됨' : '📋 JSON 복사'}
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-2.5 py-1 rounded-lg bg-[#d97b84] text-white hover:bg-[#c56770] text-[11px] font-bold"
            >
              💾 wedding.json 저장
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#4e3f3f] text-[#fffdf9] hover:bg-[#d97b84]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Banner & Target Audience Link Copy Bar */}
        <div className="px-3.5 py-2 bg-[#f2f9f4] border-b border-[#c3dfc8] text-[11px] text-[#355e40] leading-snug space-y-1.5">
          <div>
            ☁️ <strong>Cloudflare D1 DB 실시간 연동됨:</strong> 하단 [변경사항 저장하기]를 누르면 신랑·신부 지인용과 부모님 지인용 청첩장 모두에 즉시 반영됩니다.
          </div>
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="font-bold text-[#284b31] mr-1">🔗 청첩장 주소 복사:</span>
            {[
              { id: 'friends' as const, label: '👫 신랑·신부 지인용' },
              { id: 'parents' as const, label: '👴👵 부모님용(통합)' },
              { id: 'groom_parents' as const, label: '🤵 신랑측 혼주용' },
              { id: 'bride_parents' as const, label: '👰 신부측 혼주용' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleCopyShareLink(btn.id)}
                className="px-2 py-0.5 rounded bg-white hover:bg-[#e5f3e8] border border-[#9ac4a3] text-[#284b31] text-[10px] font-bold transition-colors"
              >
                {copiedLinkType === btn.id ? '✓ 주소 복사됨!' : btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Admin Category Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-2 bg-[#faf5ec] border-b border-[#e6d5b8] text-[11px] font-bold">
          {[
            { id: 'couple' as const, label: '👫 신랑·신부' },
            { id: 'venue' as const, label: '🏛️ 웨딩홀' },
            { id: 'accounts' as const, label: '💝 계좌번호' },
            { id: 'gallery' as const, label: '🖼️ 웨딩사진' },
            { id: 'guestbook' as const, label: '📊 방명록·RSVP' },
            { id: 'security' as const, label: '🔐 보안·백업' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                setActiveTab(tab.id);
              }}
              className={`py-2 px-1 rounded-lg border text-center truncate transition-all ${
                activeTab === tab.id
                  ? 'bg-[#d97b84] text-white border-[#b85d67] shadow-xs'
                  : 'bg-[#fffdf9] text-[#5c4d47] border-[#e2d4c0] hover:border-[#c59b6d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: GROOM & BRIDE & PARENTS & INVITATION MESSAGE */}
          {activeTab === 'couple' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Groom Card */}
                <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2">
                  <div className="font-bold text-[#3b2f2f] border-b border-[#e6d5b8] pb-1">
                    🤵 신랑 & 신랑측 혼주 정보
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">이름(약칭)</label>
                      <input
                        type="text"
                        value={draft.groom.name}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, name: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">전체 성함</label>
                      <input
                        type="text"
                        value={draft.groom.fullName}
                        onChange={(e) => {
                          const nextFull = e.target.value;
                          const prevAutoShort = draft.groom.fullName.slice(-2);
                          const shouldSyncShort =
                            !draft.groom.name ||
                            draft.groom.name === prevAutoShort;
                          setDraft({
                            ...draft,
                            groom: {
                              ...draft.groom,
                              fullName: nextFull,
                              name:
                                shouldSyncShort && nextFull.length >= 2
                                  ? nextFull.slice(-2)
                                  : draft.groom.name,
                            },
                          });
                        }}
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">가족 관계 (예: 장남)</label>
                      <input
                        type="text"
                        value={draft.groom.relation}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, relation: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">신랑 연락처</label>
                      <input
                        type="text"
                        value={draft.groom.phone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, phone: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">아버님 성함</label>
                      <input
                        type="text"
                        value={draft.groom.fatherName}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, fatherName: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">아버님 연락처</label>
                      <input
                        type="text"
                        value={draft.groom.fatherPhone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, fatherPhone: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">어머님 성함</label>
                      <input
                        type="text"
                        value={draft.groom.motherName}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, motherName: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">어머님 연락처</label>
                      <input
                        type="text"
                        value={draft.groom.motherPhone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            groom: { ...draft.groom, motherPhone: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Bride Card */}
                <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2">
                  <div className="font-bold text-[#b85d67] border-b border-[#e6d5b8] pb-1">
                    👰 신부 & 신부측 혼주 정보
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">이름(약칭)</label>
                      <input
                        type="text"
                        value={draft.bride.name}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, name: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">전체 성함</label>
                      <input
                        type="text"
                        value={draft.bride.fullName}
                        onChange={(e) => {
                          const nextFull = e.target.value;
                          const prevAutoShort = draft.bride.fullName.slice(-2);
                          const shouldSyncShort =
                            !draft.bride.name ||
                            draft.bride.name === prevAutoShort;
                          setDraft({
                            ...draft,
                            bride: {
                              ...draft.bride,
                              fullName: nextFull,
                              name:
                                shouldSyncShort && nextFull.length >= 2
                                  ? nextFull.slice(-2)
                                  : draft.bride.name,
                            },
                          });
                        }}
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">가족 관계 (예: 장녀)</label>
                      <input
                        type="text"
                        value={draft.bride.relation}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, relation: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">신부 연락처</label>
                      <input
                        type="text"
                        value={draft.bride.phone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, phone: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">아버님 성함</label>
                      <input
                        type="text"
                        value={draft.bride.fatherName}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, fatherName: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">아버님 연락처</label>
                      <input
                        type="text"
                        value={draft.bride.fatherPhone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, fatherPhone: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">어머님 성함</label>
                      <input
                        type="text"
                        value={draft.bride.motherName}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, motherName: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8c7a70]">어머님 연락처</label>
                      <input
                        type="text"
                        value={draft.bride.motherPhone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            bride: { ...draft.bride, motherPhone: e.target.value },
                          })
                        }
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invitation Headline & Body */}
              <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2">
                <div className="font-bold text-[#3b2f2f]">💌 모시는 글 (초대장 인사말)</div>
                <div>
                  <label className="block text-[10px] text-[#8c7a70]">메인 제목 (Headline)</label>
                  <input
                    type="text"
                    value={draft.invitationMessage.headline}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        invitationMessage: {
                          ...draft.invitationMessage,
                          headline: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8c7a70]">
                    본문 단락 (빈 줄로 문단 구분)
                  </label>
                  <textarea
                    rows={5}
                    value={draft.invitationMessage.paragraphs.join('\n\n')}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        invitationMessage: {
                          ...draft.invitationMessage,
                          paragraphs: e.target.value
                            .split(/\n{2,}/)
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2.5 py-1.5 mt-0.5 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENUE & DIRECTIONS */}
          {activeTab === 'venue' && (
            <div className="space-y-3">
              <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2.5">
                <div className="font-bold text-[#3b2f2f]">🗓️ 예식 일시 & 웨딩홀 기본 정보</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8c7a70]">예식 날짜 표기</label>
                    <input
                      type="text"
                      value={draft.wedding.dateDisplay}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wedding: { ...draft.wedding, dateDisplay: e.target.value },
                        })
                      }
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8c7a70]">예식 시간 표기</label>
                    <input
                      type="text"
                      value={draft.wedding.timeDisplay}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wedding: { ...draft.wedding, timeDisplay: e.target.value },
                        })
                      }
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8c7a70]">웨딩홀 이름</label>
                    <input
                      type="text"
                      value={draft.wedding.venueName}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wedding: { ...draft.wedding, venueName: e.target.value },
                        })
                      }
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8c7a70]">단독홀/층수</label>
                    <input
                      type="text"
                      value={draft.wedding.hallName}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wedding: { ...draft.wedding, hallName: e.target.value },
                        })
                      }
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8c7a70]">도로명 주소</label>
                  <input
                    type="text"
                    value={draft.wedding.addressRoad}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        wedding: { ...draft.wedding, addressRoad: e.target.value },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#8c7a70]">지번 주소</label>
                    <input
                      type="text"
                      value={draft.wedding.addressJibun}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wedding: { ...draft.wedding, addressJibun: e.target.value },
                        })
                      }
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8c7a70]">웨딩홀 전화번호</label>
                    <input
                      type="text"
                      value={draft.wedding.tel}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wedding: { ...draft.wedding, tel: e.target.value },
                        })
                      }
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2">
                <div className="font-bold text-[#3b2f2f]">🚇 대중교통 · 주차 · 셔틀 안내</div>
                <div>
                  <label className="block text-[10px] text-[#8c7a70]">
                    지하철 안내 (줄바꿈으로 구분)
                  </label>
                  <textarea
                    rows={2}
                    value={draft.wedding.subwayGuide.join('\n')}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        wedding: {
                          ...draft.wedding,
                          subwayGuide: e.target.value.split('\n').filter(Boolean),
                        },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8c7a70]">
                    버스 안내 (줄바꿈으로 구분)
                  </label>
                  <textarea
                    rows={2}
                    value={draft.wedding.busGuide.join('\n')}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        wedding: {
                          ...draft.wedding,
                          busGuide: e.target.value.split('\n').filter(Boolean),
                        },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8c7a70]">
                    주차 안내 (줄바꿈으로 구분)
                  </label>
                  <textarea
                    rows={2}
                    value={draft.wedding.parkingGuide.join('\n')}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        wedding: {
                          ...draft.wedding,
                          parkingGuide: e.target.value.split('\n').filter(Boolean),
                        },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8c7a70]">셔틀버스/전세버스 안내</label>
                  <input
                    type="text"
                    value={draft.wedding.shuttleGuide}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        wedding: { ...draft.wedding, shuttleGuide: e.target.value },
                      })
                    }
                    className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 mt-0.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BANK ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              {/* Groom Side Accounts */}
              <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3b2f2f]">🤵 신랑측 계좌번호 목록</span>
                  <button
                    type="button"
                    onClick={() => addAccount('groomSide')}
                    className="px-2.5 py-1 rounded-lg bg-[#3b2f2f] text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 계좌 추가
                  </button>
                </div>

                {draft.accounts.groomSide.map((acc, idx) => (
                  <div
                    key={`groom-acc-${idx}`}
                    className="p-2.5 bg-[#fffdf9] rounded-lg border border-[#e2d4c0] space-y-2"
                  >
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        placeholder="구분 (예: 신랑)"
                        value={acc.role}
                        onChange={(e) =>
                          updateAccount('groomSide', idx, { role: e.target.value })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        placeholder="예금주 성함"
                        value={acc.name}
                        onChange={(e) =>
                          updateAccount('groomSide', idx, { name: e.target.value })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="은행명"
                          value={acc.bank}
                          onChange={(e) =>
                            updateAccount('groomSide', idx, { bank: e.target.value })
                          }
                          className="w-full bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeAccount('groomSide', idx)}
                          className="p-1.5 rounded bg-[#fcf0f1] text-[#c94a56] border border-[#e2a3a9]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="계좌번호"
                        value={acc.accountNumber}
                        onChange={(e) =>
                          updateAccount('groomSide', idx, {
                            accountNumber: e.target.value,
                          })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        placeholder="카카오페이 송금 링크 (선택)"
                        value={acc.kakaoPayUrl || ''}
                        onChange={(e) =>
                          updateAccount('groomSide', idx, { kakaoPayUrl: e.target.value })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bride Side Accounts */}
              <div className="bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#b85d67]">👰 신부측 계좌번호 목록</span>
                  <button
                    type="button"
                    onClick={() => addAccount('brideSide')}
                    className="px-2.5 py-1 rounded-lg bg-[#d97b84] text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> 계좌 추가
                  </button>
                </div>

                {draft.accounts.brideSide.map((acc, idx) => (
                  <div
                    key={`bride-acc-${idx}`}
                    className="p-2.5 bg-[#fffdf9] rounded-lg border border-[#e2d4c0] space-y-2"
                  >
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="text"
                        placeholder="구분 (예: 신부)"
                        value={acc.role}
                        onChange={(e) =>
                          updateAccount('brideSide', idx, { role: e.target.value })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        placeholder="예금주 성함"
                        value={acc.name}
                        onChange={(e) =>
                          updateAccount('brideSide', idx, { name: e.target.value })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="은행명"
                          value={acc.bank}
                          onChange={(e) =>
                            updateAccount('brideSide', idx, { bank: e.target.value })
                          }
                          className="w-full bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeAccount('brideSide', idx)}
                          className="p-1.5 rounded bg-[#fcf0f1] text-[#c94a56] border border-[#e2a3a9]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        placeholder="계좌번호"
                        value={acc.accountNumber}
                        onChange={(e) =>
                          updateAccount('brideSide', idx, {
                            accountNumber: e.target.value,
                          })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        placeholder="카카오페이 송금 링크 (선택)"
                        value={acc.kakaoPayUrl || ''}
                        onChange={(e) =>
                          updateAccount('brideSide', idx, { kakaoPayUrl: e.target.value })
                        }
                        className="bg-[#faf5ec] border border-[#d4b48c] rounded px-2 py-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY PHOTOS */}
          {activeTab === 'gallery' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#faf5ec] p-3 rounded-xl border border-[#e6d5b8]">
                <div>
                  <div className="font-bold text-[#3b2f2f]">
                    🖼️ 웨딩 갤러리 사진 관리 ({draft.gallery.length}장)
                  </div>
                  <div className="text-[10px] text-[#8c7a70]">
                    내 폰/PC에서 사진을 직접 업로드하거나 이미지 URL을 입력할 수 있습니다
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addGalleryItem}
                  className="px-2.5 py-1.5 rounded-lg bg-[#d97b84] text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> 사진 추가
                </button>
              </div>

              {draft.gallery.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#faf5ec] rounded-xl border border-[#e6d5b8] flex gap-3 items-start"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-20 h-24 rounded-lg object-cover border border-[#d4b48c] bg-[#fffdf9] shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          updateGalleryItem(idx, { title: e.target.value })
                        }
                        placeholder="사진 제목"
                        className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(idx)}
                        className="p-1.5 rounded bg-[#fcf0f1] text-[#c94a56] border border-[#e2a3a9]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={item.subtitle}
                        onChange={(e) =>
                          updateGalleryItem(idx, { subtitle: e.target.value })
                        }
                        placeholder="부제"
                        className="bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        value={item.seasonTag}
                        onChange={(e) =>
                          updateGalleryItem(idx, { seasonTag: e.target.value })
                        }
                        placeholder="계절 태그 (예: 2026 SPRING)"
                        className="bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1"
                      />
                    </div>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateGalleryItem(idx, { description: e.target.value })
                      }
                      placeholder="사진 설명"
                      className="w-full bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1"
                    />

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.imageUrl}
                        onChange={(e) =>
                          updateGalleryItem(idx, { imageUrl: e.target.value })
                        }
                        placeholder="이미지 URL 또는 우측 업로드"
                        className="flex-1 bg-[#fffdf9] border border-[#d4b48c] rounded px-2 py-1 text-[10px]"
                      />
                      <label className="px-2.5 py-1 rounded bg-[#3b2f2f] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0">
                        <Upload className="w-3 h-3" />
                        <span>파일선택</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handlePhotoFileUpload(idx, e.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: GUESTBOOK & RSVP REAL-TIME CLOUD DB MANAGEMENT */}
          {activeTab === 'guestbook' && (
            <div className="space-y-3">
              <div className="bg-[#faf5ec] p-3.5 rounded-xl border border-[#e6d5b8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#3b2f2f]">
                      📊 실시간 참석 의사(RSVP) · 방명록 집계 현황
                    </div>
                    <div className="text-[10px] text-[#8c7a70]">
                      Cloudflare D1 데이터베이스(pixel-wedding-quest-db)에 저장된 전체 하객 데이터입니다
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadCloudOverview()}
                    disabled={isLoadingOverview}
                    className="px-2.5 py-1.5 rounded-lg bg-[#fffdf9] border border-[#c59b6d] text-[#3b2f2f] text-[11px] font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOverview ? 'animate-spin' : ''}`} />
                    <span>새로고침</span>
                  </button>
                </div>

                {rsvpSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <div className="bg-[#fffdf9] p-2.5 rounded-lg border border-[#e2d4c0] text-center">
                      <div className="text-[10px] text-[#8c7a70]">전체 방명록</div>
                      <div className="text-base font-bold text-[#3b2f2f]">
                        {rsvpSummary.totalEntries}건
                      </div>
                    </div>
                    <div className="bg-[#f2f9f4] p-2.5 rounded-lg border border-[#c3dfc8] text-center">
                      <div className="text-[10px] text-[#355e40]">참석 총인원</div>
                      <div className="text-base font-bold text-[#355e40]">
                        {rsvpSummary.attendingGuests}명
                      </div>
                    </div>
                    <div className="bg-[#fffdf9] p-2.5 rounded-lg border border-[#e2d4c0] text-center">
                      <div className="text-[10px] text-[#8c7a70]">식사 예정</div>
                      <div className="text-base font-bold text-[#d97b84]">
                        {rsvpSummary.mealYesGuests}명
                      </div>
                    </div>
                    <div className="bg-[#fffdf9] p-2.5 rounded-lg border border-[#e2d4c0] text-center">
                      <div className="text-[10px] text-[#8c7a70]">🤵 신랑측 인원</div>
                      <div className="text-base font-bold text-[#3b2f2f]">
                        {rsvpSummary.groomSideGuests}명
                      </div>
                    </div>
                    <div className="bg-[#fffdf9] p-2.5 rounded-lg border border-[#e2d4c0] text-center">
                      <div className="text-[10px] text-[#8c7a70]">👰 신부측 인원</div>
                      <div className="text-base font-bold text-[#b85d67]">
                        {rsvpSummary.brideSideGuests}명
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Guestbook Entries Table / List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {adminEntries.length === 0 ? (
                  <div className="p-6 text-center text-[#8c7a70] bg-[#faf5ec] rounded-xl border border-[#e6d5b8]">
                    {isLoadingOverview
                      ? 'Cloudflare D1 데이터베이스에서 방명록을 불러오는 중...'
                      : '등록된 방명록이 없습니다.'}
                  </div>
                ) : (
                  adminEntries.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-2 ${
                        item.isHidden
                          ? 'bg-[#f5efe6] border-[#d6c7b2] opacity-70'
                          : 'bg-[#fffdf9] border-[#e6d5b8]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-[#3b2f2f]">{item.name}</span>
                          {item.titleBadge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#faf5ec] border border-[#e2d4c0] text-[#7d6e65]">
                              {item.titleBadge}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fcf3f4] border border-[#f2d0d4] text-[#b85d67] font-bold">
                            {item.side === 'bride' ? '신부측' : item.side === 'both' ? '공통' : '신랑측'} ·{' '}
                            {item.attendance === 'attend'
                              ? `참석(${item.companions || 1}명)`
                              : item.attendance === 'unable'
                              ? '마음전달'
                              : '미정'}{' '}
                            · 식사:{item.meal === 'yes' ? '예정' : item.meal === 'no' ? '안함' : '미정'}
                          </span>
                          {item.isHidden && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3b2f2f] text-white font-bold">
                              숨김 처리됨
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4a3c36] break-words">{item.message}</p>
                        <div className="text-[10px] text-[#9c8b80]">{item.createdAt}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleEntryHidden(item)}
                          title={item.isHidden ? '표시하기' : '숨기기'}
                          className="px-2 py-1 rounded bg-[#faf5ec] hover:bg-[#f0e6d6] border border-[#d4b48c] text-[#5c4d47] text-[10px] font-bold flex items-center gap-1"
                        >
                          {item.isHidden ? (
                            <>
                              <Eye className="w-3 h-3" /> 표시
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> 숨김
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteEntry(item)}
                          title="방명록 삭제"
                          className="p-1.5 rounded bg-[#fcf0f1] hover:bg-[#f8dfe1] border border-[#e2a3a9] text-[#c94a56]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & JSON BACKUP */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-[#faf5ec] p-3.5 rounded-xl border border-[#e6d5b8] space-y-2.5">
                <div className="font-bold text-[#3b2f2f] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#d97b84]" />
                  <span>관리자 비밀번호 변경 (Cloudflare D1 동기화)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="새로운 관리자 비밀번호 (8자 이상)"
                    className="flex-1 bg-[#fffdf9] border border-[#d4b48c] rounded-lg px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    className="px-3.5 py-1.5 rounded-lg bg-[#3b2f2f] text-white font-bold shrink-0"
                  >
                    비밀번호 변경
                  </button>
                </div>
                {pwChangeNotice && (
                  <p className="text-[11px] font-bold text-[#6b9071]">{pwChangeNotice}</p>
                )}
              </div>

              <div className="bg-[#faf5ec] p-3.5 rounded-xl border border-[#e6d5b8] space-y-2.5">
                <div className="font-bold text-[#3b2f2f]">
                  📦 설정 데이터 백업 & 코드 파일(src/data/wedding.json) 안내
                </div>
                <p className="text-[11px] text-[#5c4d47] leading-relaxed">
                  • 여기에서 수정 후 <strong>[변경사항 저장하기]</strong>를 누르면 <strong>Cloudflare D1 DB</strong>에 즉시 저장되어 모든 하객에게 실시간으로 반영됩니다.
                  <br />• 정적 저장소 파일에도 함께 백업해 두시려면 아래 <strong>[wedding.json 다운로드]</strong> 후 <code>src/data/wedding.json</code> 파일을 교체하시면 됩니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-3 py-2 rounded-lg bg-[#fffdf9] border border-[#c59b6d] text-[#3b2f2f] font-bold flex items-center gap-1.5"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#6b9071]" /> JSON 복사 완료
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#c59b6d]" /> 전체 JSON 복사
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-3 py-2 rounded-lg bg-[#fffdf9] border border-[#c59b6d] text-[#3b2f2f] font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d97b84]" /> wedding.json 다운로드
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 rounded-lg bg-[#fcf0f1] border border-[#e2a3a9] text-[#b85d67] font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> 초기 기본값 복원
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e6d5b8]">
            <span className="text-[11px] text-[#8c7a70]">
              {cloudSaveMessage ? (
                <strong className="text-[#355e40]">{cloudSaveMessage}</strong>
              ) : (
                <>
                  💡 팁: 하단 부부 이름 5회 연속 터치 또는 <code>?admin=1</code> 접속으로 열 수 있습니다
                </>
              )}
            </span>
            <button
              type="submit"
              disabled={isSavingCloud}
              className="px-5 py-2.5 rounded-xl bg-[#d97b84] hover:bg-[#c56871] disabled:opacity-60 text-white font-bold flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingCloud ? 'DB 저장 중...' : '변경사항 저장하기 (DB 동기화)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
