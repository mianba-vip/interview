import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Frame21579 from '../frames/Frame21579';
import { applyPrefs, loadPrefs, savePrefs, type MobilePrefs } from '../lib/prefs';

const THEME_LABEL: Record<MobilePrefs['theme'], string> = {
  cream: '奶油白天',
  white: '纯白',
  system: '跟随系统',
};
const FONT_LABEL = ['小', '标准', '大'];

/** 设置 · 外观与字号：视觉 = Frame21579（Pixso 直迁），逻辑 = prefs（localStorage 即时生效）。 */
export default function SettingsAppearanceScreen() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<MobilePrefs>(loadPrefs);

  const update = (p: MobilePrefs) => {
    setPrefs(p);
    savePrefs(p);
    applyPrefs(p);
  };

  return (
    <Frame21579
      themeLabel={THEME_LABEL[prefs.theme]}
      fontLabel={FONT_LABEL[prefs.fontScale]}
      theme={prefs.theme}
      fontScale={prefs.fontScale}
      remindOn={prefs.remindOn}
      voiceOn={prefs.voiceOn}
      setTheme={(t) => update({ ...prefs, theme: t })}
      setFont={(n) => update({ ...prefs, fontScale: n })}
      toggleRemind={() => update({ ...prefs, remindOn: !prefs.remindOn })}
      toggleVoice={() => update({ ...prefs, voiceOn: !prefs.voiceOn })}
      onBack={() => navigate(-1)}
      onClear={() => {
        localStorage.clear();
        location.reload();
      }}
    />
  );
}
