import "@/styles/Frame2965.css";
import { MarkdownLite } from "@/components/MarkdownLite";
import { PillFlow, type FlowNode } from "@/components/PillFlow";

/** 子知识点列表项：done=已达标（薄荷勾），active=正在讲解（紫色实心点）。 */
export interface SubPointItem {
    text: string;
    done: boolean;
    active: boolean;
}

/** 答疑气泡（user=我的提问，assistant=AI 回答）。 */
export interface LessonMsg {
    id: number;
    role: "user" | "assistant";
    text: string;
    timeText: string;
}

export interface Frame2965Props {
    /** 顶栏知识点名 */
    titleText: string;
    /** 子点列表（模板 5 条静态项 → 按 subPoints 覆盖） */
    subPoints: SubPointItem[];
    /** 当前选中索引（驱动「子点 n / m」「第 n 点 · 讲解中」） */
    activeIndex: number;
    /** 讲解状态：流式生成中 / 已生成… */
    statusText: string;
    /** 讲解正文（markdown，mermaid 段已剥离） */
    bodyText: string;
    /** 讲解里的流程图；无则整块隐藏（不再渲染模板假数据占位） */
    flowNodes: FlowNode[] | null;
    /** 生成期间的思考过程（reasoning 流式文本，生成结束清空） */
    thinking?: string;
    /** 答疑历史 + 本次新消息 */
    messages: LessonMsg[];
    /** 提问输入框内容 */
    question: string;
    /** 错误提示 */
    error?: string;
    /** 「我学会了」提交中 */
    passBusy: boolean;
    onBack: () => void;
    onSelect: (index: number) => void;
    onQuestion: (v: string) => void;
    onSend: () => void;
    onPass: () => void;
}

const Frame2965 = (props: Frame2965Props) => {
    const {
        titleText,
        subPoints,
        activeIndex,
        statusText,
        bodyText,
        flowNodes,
        thinking,
        messages,
        question,
        error,
        passBusy,
        onBack,
        onSelect,
        onQuestion,
        onSend,
        onPass,
    } = props;
    return (
        <div className="scroll-container">
            <div
                id="2_965"
                className="Pixso-frame-2_965 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_966"
                    className="Pixso-frame-2_966 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_966 pixso-relative-flex">
                        <div
                            onClick={onBack}
                            id="2_967"
                            className="Pixso-frame-2_967 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_967 pixso-relative-flex">
                                <div
                                    id="2_968"
                                    className="Pixso-vector-2_968 pixso-relative-no-shrink"
                                ></div>
                            </div>
                        </div>
                        <div
                            id="2_971"
                            className="Pixso-frame-2_971 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_972"
                                className="Pixso-vector-2_972 pixso-relative-no-shrink"
                            ></div>
                            <p
                                id="2_975"
                                className="Pixso-paragraph-2_975 pixso-relative-auto-size pixso-flex-shrink-0"
                            >
                                {titleText}
                            </p>
                        </div>
                        <div
                            id="2_976"
                            className="Pixso-frame-2_976 pixso-position-relative"
                        ></div>
                        <div
                            id="2_977"
                            className="stroke-wrapper-2_977 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div className="Pixso-frame-2_977 pixso-relative-no-shrink pixso-flex">
                                <p
                                    id="2_978"
                                    className="Pixso-paragraph-2_978 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {`子点 ${activeIndex + 1} / ${subPoints.length}`}
                                </p>
                            </div>
                            <div className="stroke-2_977"></div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_979"
                    style={{ overflowY: "auto" }}
                    className="Pixso-frame-2_979 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_979 pixso-relative-flex">
                        <div
                            id="2_980"
                            className="Pixso-frame-2_980 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_980 pixso-relative-flex">
                                {subPoints.map((it, i) => (
                                    <div
                                        onClick={() => onSelect(i)}
                                        key={it.text}
                                        style={{ cursor: "pointer" }}
                                        className="Pixso-frame-2_981 pixso-relative-no-shrink pixso-flex-auto-height"
                                    >
                                        <div className="frame-content-2_981 pixso-relative-flex">
                                            <div
                                                className="Pixso-frame-2_982 pixso-relative-no-shrink pixso-flex"
                                                style={{
                                                    backgroundColor: it.done
                                                        ? "var(--color-brand-mint)"
                                                        : it.active
                                                          ? "var(--color-brand-purple)"
                                                          : "var(--color-bg-input)",
                                                }}
                                            >
                                                <div className="frame-content-2_982 pixso-relative-flex">
                                                    {it.done ? (
                                                        <div className="Pixso-vector-2_983 pixso-relative-no-shrink"></div>
                                                    ) : it.active ? (
                                                        <div className="Pixso-frame-2_988 pixso-relative-no-shrink"></div>
                                                    ) : (
                                                        <div className="Pixso-frame-2_992 pixso-relative-no-shrink"></div>
                                                    )}
                                                </div>
                                            </div>
                                            <p
                                                className="Pixso-paragraph-2_985 pixso-position-relative pixso-h-auto"
                                                style={
                                                    it.active
                                                        ? {
                                                              fontFamily: '"Noto Sans SC-Bold"',
                                                              fontWeight: 700,
                                                              color: "var(--color-text-primary)",
                                                          }
                                                        : it.done
                                                          ? undefined
                                                          : { color: "var(--color-text-placeholder)" }
                                                }
                                            >
                                                {it.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div
                            id="2_1002"
                            className="Pixso-frame-2_1002 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1002 pixso-relative-flex">
                                <div
                                    id="2_1003"
                                    className="Pixso-frame-2_1003 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1003 pixso-relative-flex">
                                        <div
                                            id="2_1004"
                                            className="Pixso-frame-2_1004 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                id="2_1005"
                                                className="Pixso-vector-2_1005 pixso-relative-no-shrink"
                                            ></div>
                                            <p
                                                id="2_1010"
                                                className="Pixso-paragraph-2_1010 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`第 ${activeIndex + 1} 点 · 讲解中`}
                                            </p>
                                        </div>
                                        <p
                                            id="2_1011"
                                            className="Pixso-paragraph-2_1011 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {statusText}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1012"
                                    className="Pixso-text-2_1012 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    {thinking ? (
                                        <div
                                            style={{
                                                background: "var(--color-brand-purplesoft)",
                                                borderRadius: 12,
                                                padding: "10px 12px",
                                                marginBottom: 12,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--color-brand-purple)",
                                                    marginBottom: 6,
                                                    fontFamily: '"Noto Sans SC-Medium"',
                                                }}
                                            >
                                                思考过程 · 流式生成中
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    lineHeight: 1.7,
                                                    color: "var(--color-text-secondary)",
                                                    whiteSpace: "pre-wrap",
                                                    maxHeight: 180,
                                                    overflowY: "auto",
                                                }}
                                            >
                                                {thinking}
                                            </div>
                                        </div>
                                    ) : null}
                                    {bodyText !== "" && <MarkdownLite text={bodyText} />}
                                </div>
                                {flowNodes && (
                                <div
                                    id="2_1013"
                                    className="Pixso-frame-2_1013 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1013 pixso-relative-flex">
                                        <p
                                            id="2_1014"
                                            className="Pixso-paragraph-2_1014 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"流程示意 · mermaid"}
                                        </p>
                                        <div
                                            id="2_1015"
                                            className="Pixso-frame-2_1015 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_1015 pixso-relative-flex">
                                                {flowNodes ? (
                                                    <PillFlow nodes={flowNodes} />
                                                ) : (
                                                    <>
                                                        <div
                                                            id="2_1016"
                                                            className="Pixso-frame-2_1016 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <p
                                                                id="2_1017"
                                                                className="Pixso-paragraph-2_1017 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {"layout 模板"}
                                                            </p>
                                                        </div>
                                                        <div
                                                            id="2_1018"
                                                            className="Pixso-vector-2_1018 pixso-relative-no-shrink"
                                                        ></div>
                                                        <div
                                                            id="2_1021"
                                                            className="Pixso-frame-2_1021 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <p
                                                                id="2_1022"
                                                                className="Pixso-paragraph-2_1022 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {"Parse(layout, s)"}
                                                            </p>
                                                        </div>
                                                        <div
                                                            id="2_1023"
                                                            className="Pixso-vector-2_1023 pixso-relative-no-shrink"
                                                        ></div>
                                                        <div
                                                            id="2_1026"
                                                            className="Pixso-frame-2_1026 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <p
                                                                id="2_1027"
                                                                className="Pixso-paragraph-2_1027 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {"Time{wall, loc}"}
                                                            </p>
                                                        </div>
                                                        <div
                                                            id="2_1028"
                                                            className="Pixso-vector-2_1028 pixso-relative-no-shrink"
                                                        ></div>
                                                        <div
                                                            id="2_1031"
                                                            className="Pixso-frame-2_1031 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <p
                                                                id="2_1032"
                                                                className="Pixso-paragraph-2_1032 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {"Format(layout)"}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                        <div
                            id="2_1033"
                            className="Pixso-frame-2_1033 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1033 pixso-relative-flex">
                                <input
                                    id="2_1034"
                                    className="Pixso-paragraph-2_1034 pixso-position-relative pixso-h-auto"
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        outline: "none",
                                        padding: 0,
                                        color: "var(--color-text-primary)",
                                    }}
                                    value={question}
                                    placeholder="对这个讲解有疑问？直接问"
                                    onChange={(e) => onQuestion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") onSend();
                                    }}
                                />
                                <div
                                    onClick={onSend}
                                    id="2_1035"
                                    className="Pixso-frame-2_1035 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1035 pixso-relative-flex">
                                        <div
                                            id="2_1036"
                                            className="Pixso-frame-2_1036 pixso-relative-no-shrink"
                                        >
                                            <div
                                                id="2_1037"
                                                className="Pixso-vector-2_1037"
                                            ></div>
                                            <div
                                                id="2_1038"
                                                className="Pixso-vector-2_1038"
                                            ></div>
                                            <div
                                                id="2_1039"
                                                className="stroke-wrapper-2_1039"
                                            >
                                                <div className="Pixso-rectangle-2_1039 pixso-position-relative"></div>
                                                <div className="stroke-2_1039"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className="Pixso-frame-2_1040 pixso-relative-no-shrink pixso-flex-auto-height"
                                style={
                                    m.role === "assistant" ? { justifyContent: "flex-start" } : undefined
                                }
                            >
                                <div
                                    className="frame-content-2_1040 pixso-relative-flex"
                                    style={
                                        m.role === "assistant"
                                            ? { padding: "1px 0px 1px 0px" }
                                            : undefined
                                    }
                                >
                                    <div
                                        className="Pixso-frame-2_1041 pixso-relative-flex pixso-h-auto"
                                        style={
                                            m.role === "assistant"
                                                ? { backgroundColor: "var(--color-bg-card)" }
                                                : undefined
                                        }
                                    >
                                        <div className="frame-content-2_1041 pixso-relative-flex">
                                            {m.role === "assistant" ? (
                                                <div className="Pixso-paragraph-2_1042 pixso-relative-no-shrink pixso-h-auto">
                                                    <MarkdownLite text={m.text} />
                                                </div>
                                            ) : (
                                                <p
                                                    className="Pixso-paragraph-2_1042 pixso-relative-no-shrink pixso-h-auto"
                                                    style={{ whiteSpace: "pre-wrap" }}
                                                >
                                                    {m.text}
                                                </p>
                                            )}
                                            <p
                                                className="Pixso-paragraph-2_1043 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {m.timeText}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <p className="Pixso-paragraph-2_1034 pixso-position-relative pixso-h-auto">
                                {"还没有提问，抛个问题试试"}
                            </p>
                        )}
                        {error ? (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "var(--color-brand-coral)",
                                    margin: 0,
                                }}
                            >
                                {error}
                            </p>
                        ) : null}
                    </div>
                </div>
                <div
                    id="2_1048"
                    className="stroke-wrapper-2_1048 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="Pixso-frame-2_1048 pixso-relative-no-shrink pixso-flex">
                        <div className="frame-content-2_1048 pixso-relative-flex">
                            <div
                                onClick={onPass}
                                id="2_1049"
                                className="Pixso-frame-2_1049 effect-effectcardshadow-2_19 pixso-relative-flex"
                            >
                                <div className="frame-content-2_1049 pixso-relative-flex">
                                    <p
                                        id="2_1050"
                                        className="Pixso-paragraph-2_1050 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {passBusy ? "正在提交…" : "我学会了，开始练习"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="stroke-2_1048"></div>
                </div>
            </div>
        </div>
    );
};
export default Frame2965;
