import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { loadPrefs, savePrefs, applyPrefs, type MobilePrefs } from '../lib/prefs';

const THEMES: { value: MobilePrefs['theme']; label: string }[] = [
  { value: 'cream', label: '奶油白天' },
  { value: 'white', label: '纯白' },
  { value: 'system', label: '跟随系统' },
];
const FONT_LABEL = ['小', '标准', '大'];

/** 外观与字号：主题色温 / 字号滑杆（真实生效）/ 功能开关 / 清理缓存。 */
export default function SettingsAppearanceScreen() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<MobilePrefs>(loadPrefs);

  const update = (p: MobilePrefs) => {
    setPrefs(p);
    savePrefs(p);
    applyPrefs(p);
  };

  return (
    <div className="screen screen-immersive">
      <div className="immersive-topbar">
        <button className="back-btn" onClick={() => navigate('/me')}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 18 }}>设置</span>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">外观设置</span>
          <span className="pill" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            当前：{THEMES.find((t) => t.value === prefs.theme)?.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {THEMES.map((t) => (
            <button
              key={t.value}
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => update({ ...prefs, theme: t.value })}
            >
              <div
                style={{
                  height: 64,
                  borderRadius: 14,
                  border: prefs.theme === t.value ? '2.5px solid var(--primary)' : '1.5px solid var(--line)',
                  background: t.value === 'white' ? '#FFFFFF' : '#FAF7F2',
                  position: 'relative',
                }}
              >
                {prefs.theme === t.value && (
                  <Check
                    size={16}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'var(--primary)', color: '#fff',
                      borderRadius: '50%', padding: 2,
                    }}
                  />
                )}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: 'var(--ink-soft)' }}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">字号设置</span>
          <span className="pill" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            当前：{FONT_LABEL[prefs.fontScale]}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={1}
          value={prefs.fontScale}
          onChange={(e) => update({ ...prefs, fontScale: Number(e.target.value) })}
          style={{ width: '100%', marginTop: 16, accentColor: 'var(--primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-faint)' }}>
          <span>小</span><span>标准</span><span>大</span>
        </div>
        <div className="font-preview">
          先想通，才是真的会——AI 只提问，不直接给答案。
        </div>
      </div>

      <div className="card">
        <div className="setting-row">
          <span>学习提醒</span>
          <input
            type="checkbox"
            checked={prefs.remindOn}
            onChange={(e) => update({ ...prefs, remindOn: e.target.checked })}
          />
        </div>
        <div className="setting-row" style={{ borderTop: '1px solid var(--line)' }}>
          <span>语音作答</span>
          <input
            type="checkbox"
            checked={prefs.voiceOn}
            onChange={(e) => update({ ...prefs, voiceOn: e.target.checked })}
          />
        </div>
      </div>

      <div className="card">
        <div className="setting-row">
          <span>清理缓存</span>
          <button
            style={{ color: 'var(--coral)', fontWeight: 700 }}
            onClick={() => { localStorage.clear(); location.reload(); }}
          >
            清除并重置
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', marginTop: 16 }}>
        面霸 v0.1.0 · Cream Pop 设计系统
      </div>
    </div>
  );
}
