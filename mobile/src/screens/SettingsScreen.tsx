import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Frame21579 from "@/views/Frame21579";
import { getToken, setToken } from "@/api/client";
import { applyPrefs, loadPrefs, savePrefs, type MobilePrefs } from "@/lib/prefs";

const THEME_LABEL: Record<MobilePrefs["theme"], string> = {
  cream: "奶油白天",
  white: "纯白",
  system: "跟随系统",
};
const FONT_LABEL = ["小", "标准", "大"];

/** 设置：本地偏好（主题 / 字号 / 开关）+ 缓存清理，视觉交给 Frame21579。 */
const SettingsScreen = () => {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<MobilePrefs>(loadPrefs);
  const [cacheText, setCacheText] = useState("128 MB");

  // 进屏即应用本地偏好（色温 + 字号）
  useEffect(() => {
    applyPrefs(loadPrefs());
  }, []);

  const update = (p: MobilePrefs) => {
    setPrefs(p);
    savePrefs(p);
    applyPrefs(p);
  };

  // 清理缓存：localStorage 只保留登录 token
  const clearCache = () => {
    const token = getToken();
    localStorage.clear();
    if (token) setToken(token);
    setCacheText("0 MB");
  };

  return (
    <Frame21579
      theme={prefs.theme}
      themeLabel={THEME_LABEL[prefs.theme]}
      fontScale={prefs.fontScale}
      fontLabel={FONT_LABEL[prefs.fontScale] ?? "标准"}
      remindOn={prefs.remindOn}
      voiceOn={prefs.voiceOn}
      cacheText={cacheText}
      setTheme={(t) => update({ ...prefs, theme: t })}
      setFont={(n) => update({ ...prefs, fontScale: n })}
      toggleRemind={() => update({ ...prefs, remindOn: !prefs.remindOn })}
      toggleVoice={() => update({ ...prefs, voiceOn: !prefs.voiceOn })}
      onBack={() => navigate(-1)}
      onClear={clearCache}
    />
  );
};

export default SettingsScreen;
