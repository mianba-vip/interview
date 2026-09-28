import "@/styles/Frame21180.css";
import { useEffect, useRef } from "react";
import { MarkdownLite } from "@/components/MarkdownLite";

/** 「我的回答」右侧气泡。 */
export interface SessionMsg {
    id: number;
    text: string;
    timeText: string;
}

/** 结算卡数据（模板无结算区，视图内按卡片样式注入）。 */
export interface SessionSettle {
    allPassed: boolean;
    score: number;
    grade: string;
    scores: string[];
}

export interface Frame21180Props {
    /** 顶栏副标题「模拟面试 · 共 N 问」 */
    titleText: string;
    /** 顶栏进度「第 N 问 / 共 M 问」 */
    roundText: string;
    /** 题卡角标「第 N 问」 */
    roundChip: string;
    /** 顶部进度条百分比（模板 175px ≈ 3/6 问） */
    progressPct: number;
    /** 倒计时 mm:ss */
    clockText: string;
    /** 当前题干（markdown） */
    stemText: string;
    /** 我的回答气泡 */
    messages: SessionMsg[];
    /** 点评讲解（SSE token 累积，markdown） */
    explain: string;
    /** 状态条文案：等待 / 思考 / 讲解 / 结算 */
    statusText: string;
    /** 回答输入框内容 */
    inputText: string;
    /** 字数提示条 */
    counterText: string;
    /** 本场已结算 */
    finished: boolean;
    /** 结算卡（未结算为 null） */
    settle: SessionSettle | null;
    /** 错误提示 */
    error?: string;
    onBack: () => void;
    onInput: (v: string) => void;
    onSubmit: () => void;
    onEnd: () => void;
}

const Frame21180 = (props: Frame21180Props) => {
    const {
        titleText,
        roundText,
        roundChip,
        progressPct,
        clockText,
        stemText,
        messages,
        explain,
        statusText,
        inputText,
        counterText,
        finished,
        settle,
        error,
        onBack,
        onInput,
        onSubmit,
        onEnd,
    } = props;
    const listRef = useRef<HTMLDivElement>(null);

    // 新气泡 / 讲解落盘后滚到底（容器 overflow 为 auto）
    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [messages, explain, settle]);

    return (
        <div className="scroll-container">
            <div
                id="2_1180"
                className="Pixso-frame-2_1180 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_1181"
                    className="Pixso-frame-2_1181 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1181 pixso-relative-flex">
                        <div
                            id="2_1182"
                            className="Pixso-frame-2_1182 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1182 pixso-relative-flex">
                                <div
                                    onClick={onBack}
                                    id="2_1183"
                                    className="Pixso-frame-2_1183 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1183 pixso-relative-flex">
                                        <div
                                            id="2_1184"
                                            className="Pixso-frame-2_1184 pixso-relative-no-shrink"
                                        >
                                            <div
                                                id="2_1185"
                                                className="Pixso-vector-2_1185"
                                            ></div>
                                            <div
                                                id="2_1186"
                                                className="stroke-wrapper-2_1186"
                                            >
                                                <div className="Pixso-rectangle-2_1186 pixso-position-relative"></div>
                                                <div className="stroke-2_1186"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1187"
                                    className="Pixso-frame-2_1187 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_1187 pixso-relative-flex">
                                        <p
                                            id="2_1188"
                                            className="Pixso-paragraph-2_1188 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {titleText}
                                        </p>
                                        <p
                                            id="2_1189"
                                            className="Pixso-paragraph-2_1189 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {roundText}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1190"
                                    className="Pixso-frame-2_1190 pixso-position-relative"
                                ></div>
                                <div
                                    id="2_1191"
                                    className="Pixso-frame-2_1191 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_1192"
                                        className="Pixso-vector-2_1192 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_1196"
                                        className="Pixso-paragraph-2_1196 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {clockText}
                                    </p>
                                </div>
                                <div
                                    onClick={finished ? onBack : onEnd}
                                    id="2_1197"
                                    className="stroke-wrapper-2_1197 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_1197 pixso-relative-no-shrink pixso-flex">
                                        <div
                                            id="2_1198"
                                            className="Pixso-frame-2_1198 pixso-relative-no-shrink"
                                        >
                                            <div
                                                id="2_1199"
                                                className="stroke-wrapper-2_1199"
                                            >
                                                <div className="Pixso-rectangle-2_1199 pixso-position-relative"></div>
                                                <div className="stroke-2_1199"></div>
                                            </div>
                                        </div>
                                        <p
                                            id="2_1200"
                                            className="Pixso-paragraph-2_1200 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {finished ? "返回列表" : "结束并结算"}
                                        </p>
                                    </div>
                                    <div className="stroke-2_1197"></div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_1201"
                            className="Pixso-frame-2_1201 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_1201 pixso-relative-flex">
                                <div
                                    id="2_1202"
                                    className="Pixso-frame-2_1202 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                    style={{ width: `${progressPct}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_1203"
                    ref={listRef}
                    style={{ overflowY: "auto" }}
                    className="Pixso-frame-2_1203 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1203 pixso-relative-flex">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className="Pixso-frame-2_1204 pixso-relative-no-shrink pixso-flex-auto-height"
                            >
                                <div className="frame-content-2_1204 pixso-relative-flex">
                                    <div className="Pixso-frame-2_1205 pixso-relative-flex pixso-h-auto">
                                        <div className="frame-content-2_1205 pixso-relative-flex">
                                            <p
                                                className="Pixso-paragraph-2_1206 pixso-relative-no-shrink pixso-h-auto"
                                                style={{ whiteSpace: "pre-wrap" }}
                                            >
                                                {m.text}
                                            </p>
                                            <p
                                                className="Pixso-paragraph-2_1207 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {m.timeText}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div
                            id="2_1208"
                            style={finished ? { display: "none" } : undefined}
                            className="Pixso-frame-2_1208 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1208 pixso-relative-flex">
                                <div
                                    id="2_1209"
                                    className="Pixso-frame-2_1209 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1209 pixso-relative-flex">
                                        <div
                                            id="2_1210"
                                            className="Pixso-frame-2_1210 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1210 pixso-relative-flex">
                                                <div
                                                    id="2_1211"
                                                    className="Pixso-vector-2_1211 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1216"
                                    className="Pixso-frame-2_1216 effect-effectcardshadow-2_19 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_1216 pixso-relative-flex">
                                        <div
                                            id="2_1217"
                                            className="Pixso-frame-2_1217 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_1217 pixso-relative-flex">
                                                <div
                                                    id="2_1218"
                                                    className="Pixso-frame-2_1218 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                >
                                                    <p
                                                        id="2_1219"
                                                        className="Pixso-paragraph-2_1219 pixso-relative-auto-size pixso-flex-shrink-0"
                                                    >
                                                        {roundChip}
                                                    </p>
                                                </div>
                                                <p
                                                    id="2_1220"
                                                    className="Pixso-paragraph-2_1220 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"AI 面试官 · 正式提问"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="Pixso-paragraph-2_1221 pixso-relative-no-shrink pixso-h-auto">
                                            <MarkdownLite text={stemText} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {explain !== "" && (
                            <div className="Pixso-frame-2_1208 pixso-relative-no-shrink pixso-flex-auto-height">
                                <div className="frame-content-2_1208 pixso-relative-flex">
                                    <div className="Pixso-frame-2_1209 pixso-relative-no-shrink pixso-flex">
                                        <div className="frame-content-2_1209 pixso-relative-flex">
                                            <div className="Pixso-frame-2_1210 pixso-relative-no-shrink pixso-flex">
                                                <div className="frame-content-2_1210 pixso-relative-flex">
                                                    <div className="Pixso-vector-2_1211 pixso-relative-no-shrink"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="Pixso-frame-2_1216 effect-effectcardshadow-2_19 pixso-relative-flex pixso-h-auto">
                                        <div className="frame-content-2_1216 pixso-relative-flex">
                                            <div className="Pixso-frame-2_1217 pixso-relative-no-shrink pixso-flex-auto-height">
                                                <div className="frame-content-2_1217 pixso-relative-flex">
                                                    <div className="Pixso-frame-2_1218 pixso-relative-flex-auto-size pixso-flex-shrink-0">
                                                        <p className="Pixso-paragraph-2_1219 pixso-relative-auto-size pixso-flex-shrink-0">
                                                            {"点评讲解"}
                                                        </p>
                                                    </div>
                                                    <p className="Pixso-paragraph-2_1220 pixso-relative-auto-size pixso-flex-shrink-0">
                                                        {"AI 面试官 · 点评讲解"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="Pixso-paragraph-2_1221 pixso-relative-no-shrink pixso-h-auto">
                                                <MarkdownLite text={explain} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {settle && (
                            <div className="Pixso-frame-2_1216 effect-effectcardshadow-2_19 pixso-relative-flex pixso-h-auto">
                                <div className="frame-content-2_1216 pixso-relative-flex">
                                    <div className="Pixso-frame-2_1217 pixso-relative-no-shrink pixso-flex-auto-height">
                                        <div className="frame-content-2_1217 pixso-relative-flex">
                                            <div className="Pixso-frame-2_1218 pixso-relative-flex-auto-size pixso-flex-shrink-0">
                                                <p className="Pixso-paragraph-2_1219 pixso-relative-auto-size pixso-flex-shrink-0">
                                                    {settle.allPassed ? "全部通过" : "本场结束"}
                                                </p>
                                            </div>
                                            <p className="Pixso-paragraph-2_1220 pixso-relative-auto-size pixso-flex-shrink-0">
                                                {"结算报告"}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ width: "100%", textAlign: "center" }}>
                                        <div
                                            style={{
                                                fontSize: 34,
                                                fontWeight: 800,
                                                color: "var(--color-text-primary)",
                                            }}
                                        >
                                            {`${settle.score} 分`}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 13,
                                                color: "var(--color-text-secondary)",
                                                marginTop: 4,
                                            }}
                                        >
                                            {`评级 ${settle.grade}`}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: "var(--color-text-placeholder)",
                                                marginTop: 4,
                                            }}
                                        >
                                            {settle.scores.join(" / ")}
                                        </div>
                                        <div
                                            onClick={onBack}
                                            style={{
                                                marginTop: 12,
                                                height: 40,
                                                borderRadius: 14,
                                                background: "var(--color-brand-sky)",
                                                color: "#fff",
                                                fontSize: 14,
                                                fontWeight: 700,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {"返回面试列表"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div
                            id="2_1222"
                            className="Pixso-frame-2_1222 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1222 pixso-relative-flex">
                                <div
                                    id="2_1223"
                                    className="Pixso-frame-2_1223 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    id="2_1224"
                                    className="Pixso-frame-2_1224 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    id="2_1225"
                                    className="Pixso-frame-2_1225 pixso-relative-no-shrink"
                                ></div>
                                <p
                                    id="2_1226"
                                    className="Pixso-paragraph-2_1226 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {statusText}
                                </p>
                            </div>
                        </div>
                        {error ? (
                            <p style={{ fontSize: 12, color: "var(--color-brand-coral)", margin: 0 }}>
                                {error}
                            </p>
                        ) : null}
                    </div>
                </div>
                <div
                    id="2_1227"
                    className="stroke-wrapper-2_1227 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="Pixso-frame-2_1227 pixso-relative-no-shrink pixso-flex">
                        <div className="frame-content-2_1227 pixso-relative-flex">
                            <div
                                id="2_1228"
                                className="Pixso-frame-2_1228 pixso-relative-no-shrink pixso-flex-auto-height"
                            >
                                <div className="frame-content-2_1228 pixso-relative-flex">
                                    <textarea
                                        id="2_1229"
                                        className="Pixso-paragraph-2_1229 pixso-relative-no-shrink pixso-h-auto"
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            outline: "none",
                                            resize: "none",
                                            padding: 0,
                                            minHeight: 46,
                                            fontFamily: "inherit",
                                        }}
                                        rows={2}
                                        readOnly={finished}
                                        value={inputText}
                                        placeholder="输入你的回答…"
                                        onChange={(e) => onInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                onSubmit();
                                            }
                                        }}
                                    />
                                    <p
                                        id="2_1230"
                                        className="Pixso-paragraph-2_1230 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {counterText}
                                    </p>
                                </div>
                            </div>
                            <div
                                style={finished ? { display: "none" } : undefined}
                                id="2_1231"
                                className="Pixso-frame-2_1231 pixso-relative-no-shrink pixso-flex-auto-height"
                            >
                                <div className="frame-content-2_1231 pixso-relative-flex">
                                    <div
                                        id="2_1232"
                                        className="Pixso-frame-2_1232 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1232 pixso-relative-flex">
                                            <div
                                                id="2_1233"
                                                className="Pixso-frame-2_1233 pixso-relative-no-shrink"
                                            >
                                                <div
                                                    id="2_1234"
                                                    className="Pixso-vector-2_1234"
                                                ></div>
                                                <div
                                                    id="2_1235"
                                                    className="Pixso-vector-2_1235"
                                                ></div>
                                                <div
                                                    id="2_1236"
                                                    className="stroke-wrapper-2_1236"
                                                >
                                                    <div className="Pixso-rectangle-2_1236 pixso-position-relative"></div>
                                                    <div className="stroke-2_1236"></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1237"
                                                className="Pixso-paragraph-2_1237 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"按住说话回答"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={onSubmit}
                                        id="2_1238"
                                        className="Pixso-frame-2_1238 pixso-relative-no-shrink pixso-flex"
                                    >
                                        <div className="frame-content-2_1238 pixso-relative-flex">
                                            <div
                                                id="2_1239"
                                                className="Pixso-vector-2_1239 pixso-relative-no-shrink"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="stroke-2_1227"></div>
                </div>
            </div>
        </div>
    );
};
export default Frame21180;
