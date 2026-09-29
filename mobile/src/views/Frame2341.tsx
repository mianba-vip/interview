import "@/styles/Frame2341.css";

export interface Frame2341Props {
    mode: "login" | "register";
    email: string;
    password: string;
    onEmailChange: (v: string) => void;
    onPasswordChange: (v: string) => void;
    /** 注册模式：邮箱验证码输入与获取按钮 */
    code: string;
    onCodeChange: (v: string) => void;
    onGetCode: () => void;
    codeLabel: string;
    codeDisabled: boolean;
    codeNote: string;
    remember: boolean;
    onToggleRemember: () => void;
    error: string;
    busy: boolean;
    onSubmit: () => void;
    /** 底部「立即注册 / 去登录」切换链接 */
    onRegister: () => void;
}

const Frame2341 = ({
    mode,
    email,
    password,
    onEmailChange,
    onPasswordChange,
    code,
    onCodeChange,
    onGetCode,
    codeLabel,
    codeDisabled,
    codeNote,
    remember,
    onToggleRemember,
    error,
    busy,
    onSubmit,
    onRegister,
}: Frame2341Props) => {
    return (
        <div className="scroll-container">
            <div
                id="2_341"
                className="Pixso-frame-2_341 pixso-relative-no-shrink pixso-flex"
            >
                <div id="2_342" className="Pixso-frame-2_342"></div>
                <div id="2_343" className="Pixso-frame-2_343"></div>
                <div
                    id="2_345"
                    className="Pixso-frame-2_345 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_345 pixso-relative-flex">
                        <p
                            id="2_346"
                            className="Pixso-paragraph-2_346 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_347"
                            className="Pixso-frame-2_347 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_348"
                                className="Pixso-vector-2_348 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_354"
                                className="Pixso-vector-2_354 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_359"
                                className="Pixso-frame-2_359 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_360"
                                    className="Pixso-vector-2_360"
                                ></div>
                                <div
                                    id="2_361"
                                    className="Pixso-vector-2_361"
                                ></div>
                                <div
                                    id="2_362"
                                    className="Pixso-vector-2_362"
                                ></div>
                                <div
                                    id="2_363"
                                    className="Pixso-vector-2_363"
                                ></div>
                                <div
                                    id="2_364"
                                    className="stroke-wrapper-2_364"
                                >
                                    <div className="Pixso-rectangle-2_364 pixso-position-relative"></div>
                                    <div className="stroke-2_364"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_365"
                    className="Pixso-frame-2_365 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_365 pixso-relative-flex">
                        <div
                            id="2_366"
                            className="Pixso-frame-2_366 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_366 pixso-relative-flex">
                                <div
                                    id="2_1659"
                                    className="Pixso-rectangle-2_1659 pixso-relative-no-shrink"
                                ></div>
                                <p
                                    id="2_367"
                                    className="Pixso-paragraph-2_367 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"面霸"}
                                </p>
                                <p
                                    id="2_368"
                                    className="Pixso-paragraph-2_368 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"AI 导师陪你练过每一道面试题"}
                                </p>
                            </div>
                        </div>
                        <div
                            id="2_369"
                            className="Pixso-frame-2_369 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_369 pixso-relative-flex">
                                <div
                                    id="2_370"
                                    className="Pixso-frame-2_370 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_370 pixso-relative-flex">
                                        <div
                                            id="2_371"
                                            className="Pixso-vector-2_371 pixso-relative-no-shrink"
                                        ></div>
                                        <input
                                            id="2_374"
                                            className="Pixso-paragraph-2_374 pixso-relative-auto-size pixso-flex-shrink-0"
                                            value={email}
                                            onChange={(e) => onEmailChange(e.target.value)}
                                            placeholder="邮箱"
                                            autoComplete="email"
                                            style={{
                                                flex: "1 1 0%",
                                                minWidth: 0,
                                                border: "none",
                                                outline: "none",
                                                background: "transparent",
                                                padding: 0,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div
                                    id="2_375"
                                    className="stroke-wrapper-2_375 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="Pixso-frame-2_375 pixso-relative-no-shrink pixso-flex"></div>
                                    <div className="stroke-2_375"></div>
                                    <div className="Pixso-frame-2_375-content-layer">
                                        <div className="frame-content-2_375 pixso-relative-flex">
                                            <div
                                                id="2_376"
                                                className="Pixso-frame-2_376 pixso-relative-no-shrink"
                                            >
                                                <div
                                                    id="2_377"
                                                    className="stroke-wrapper-2_377"
                                                >
                                                    <div className="Pixso-rectangle-2_377 pixso-position-relative"></div>
                                                    <div className="stroke-2_377"></div>
                                                </div>
                                                <div
                                                    id="2_378"
                                                    className="Pixso-vector-2_378"
                                                ></div>
                                            </div>
                                            <input
                                                id="2_379"
                                                className="Pixso-paragraph-2_379 pixso-position-relative pixso-h-auto"
                                                type="password"
                                                value={password}
                                                onChange={(e) => onPasswordChange(e.target.value)}
                                                placeholder="密码"
                                                autoComplete="current-password"
                                                style={{
                                                    border: "none",
                                                    outline: "none",
                                                    background: "transparent",
                                                    padding: 0,
                                                }}
                                            />
                                            {!password && (
                                                <p
                                                    className="Pixso-paragraph-2_379 pixso-position-relative pixso-h-auto"
                                                    style={{
                                                        position: "absolute",
                                                        left: 44,
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        pointerEvents: "none",
                                                    }}
                                                >
                                                    {"••••••••"}
                                                </p>
                                            )}
                                            <div
                                                id="2_380"
                                                className="Pixso-vector-2_380 pixso-relative-no-shrink"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                {mode === "register" && (
                                    <div className="stroke-wrapper-2_375 pixso-relative-no-shrink pixso-flex">
                                        <div className="Pixso-frame-2_375 pixso-relative-no-shrink pixso-flex"></div>
                                        <div className="stroke-2_375"></div>
                                        <div className="Pixso-frame-2_375-content-layer">
                                            <div className="frame-content-2_375 pixso-relative-flex">
                                                <input
                                                    className="Pixso-paragraph-2_379 pixso-position-relative pixso-h-auto"
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={6}
                                                    value={code}
                                                    onChange={(e) => onCodeChange(e.target.value)}
                                                    placeholder="邮箱验证码"
                                                    autoComplete="one-time-code"
                                                    style={{
                                                        flex: "1 1 0%",
                                                        minWidth: 0,
                                                        border: "none",
                                                        outline: "none",
                                                        background: "transparent",
                                                        padding: 0,
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={onGetCode}
                                                    disabled={codeDisabled}
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                        cursor: codeDisabled ? "default" : "pointer",
                                                        color: codeDisabled
                                                            ? "var(--color-text-placeholder)"
                                                            : "var(--color-brand-purple)",
                                                        fontSize: 13,
                                                        whiteSpace: "nowrap",
                                                        padding: "6px 0",
                                                        fontFamily: "Noto Sans SC-Regular",
                                                    }}
                                                >
                                                    {codeLabel}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {mode === "login" && (
                        <div
                            id="2_385"
                            className="Pixso-frame-2_385 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_385 pixso-relative-flex">
                                <p
                                    id="2_386"
                                    className="Pixso-paragraph-2_386 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"记住登录"}
                                </p>
                                <div
                                    onClick={onToggleRemember}
                                    id="2_387"
                                    className="Pixso-frame-2_387 pixso-relative-no-shrink pixso-flex"
                                    style={{
                                        backgroundColor: remember
                                            ? "var(--color-brand-purple)"
                                            : "var(--color-text-placeholder)",
                                    }}
                                >
                                    <div className="frame-content-2_387 pixso-relative-flex">
                                        <div
                                            id="2_388"
                                            className="Pixso-frame-2_388 pixso-relative-no-shrink"
                                            style={{
                                                transform: remember ? "none" : "translateX(-18px)",
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                        <div
                            onClick={onSubmit}
                            id="2_389"
                            className="Pixso-frame-2_389 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_389 pixso-relative-flex">
                                <p
                                    id="2_390"
                                    className="Pixso-paragraph-2_390 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {busy
                                        ? mode === "register" ? "注册中…" : "登录中…"
                                        : mode === "register" ? "注 册" : "登 录"}
                                </p>
                            </div>
                        </div>
                        {error && (
                            <p
                                style={{
                                    color: "var(--color-brand-coral)",
                                    fontSize: 13,
                                    fontFamily: "Noto Sans SC-Regular",
                                }}
                            >
                                {error}
                            </p>
                        )}
                        {mode === "register" && codeNote && (
                            <p
                                style={{
                                    color: "var(--color-text-secondary)",
                                    fontSize: 13,
                                    fontFamily: "Noto Sans SC-Regular",
                                }}
                            >
                                {codeNote}
                            </p>
                        )}
                        <div
                            onClick={onRegister}
                            id="2_391"
                            className="Pixso-frame-2_391 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_391 pixso-relative-flex">
                                <p
                                    id="2_392"
                                    className="Pixso-paragraph-2_392 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {mode === "login" ? "还没有账号？" : "已有账号？"}
                                </p>
                                <p
                                    id="2_393"
                                    className="Pixso-paragraph-2_393 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {mode === "login" ? "立即注册" : "去登录"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Frame2341;
