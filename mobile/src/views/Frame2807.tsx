import "@/styles/Frame2807.css";
import type { RefObject } from "react";
import { MarkdownLite } from "@/components/MarkdownLite";
import type { ChatMsg } from "@/api/types";

export interface Frame2807Props {
    title: string; // 顶栏题名
    category: string; // 卡片首行：「开放题」等
    modeLabel: string; // 「简答 · 第 N 题」
    stem: string; // 题干 Markdown
    timeText: string; // mm:ss 计时
    revealed: boolean; // 揭示态 → 显示封顶 banner
    msgs: ChatMsg[]; // 对话消息（模板消息区 → map）
    times: Record<number, string>; // 消息时间（有才显示）
    streaming: boolean; // AI 思考中
    input: string; // 受控输入
    placeholder: string;
    disabled: boolean; // 流式/判分中禁用输入
    scrollRef?: RefObject<HTMLDivElement>; // 内容滚动区（供容器滚到底）
    onInputChange: (v: string) => void;
    onSend: () => void;
    onReveal: () => void;
    onBack: () => void;
}

const Frame2807 = ({
    title,
    category,
    modeLabel,
    stem,
    timeText,
    revealed,
    msgs,
    times,
    streaming,
    input,
    placeholder,
    disabled,
    scrollRef,
    onInputChange,
    onSend,
    onReveal,
    onBack,
}: Frame2807Props) => {
    // 每条 AI 回复的序号（气泡标题「AI 导师 · 追问 N」）
    const aiSeq = new Map<number, number>();
    let aiN = 0;
    for (const m of msgs) {
        if (m.role === "ai") aiSeq.set(m.id, ++aiN);
    }
    return (
        <div className="scroll-container">
            <div
                id="2_807"
                className="Pixso-frame-2_807 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_808"
                    className="Pixso-frame-2_808 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_808 pixso-relative-flex">
                        <div
                            id="2_809"
                            className="Pixso-frame-2_809 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_809 pixso-relative-flex">
                                <div
                                    onClick={onBack}
                                    id="2_810"
                                    className="Pixso-frame-2_810 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_810 pixso-relative-flex">
                                        <div
                                            id="2_811"
                                            className="Pixso-vector-2_811 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_814"
                                    className="Pixso-frame-2_814 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_815"
                                        className="Pixso-vector-2_815 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_818"
                                        className="Pixso-paragraph-2_818 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {title}
                                    </p>
                                </div>
                                <div
                                    id="2_819"
                                    className="Pixso-frame-2_819 pixso-position-relative"
                                ></div>
                                <div
                                    onClick={onReveal}
                                    id="2_820"
                                    className="stroke-wrapper-2_820 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_820 pixso-relative-no-shrink pixso-flex">
                                        <div
                                            id="2_821"
                                            className="Pixso-vector-2_821 pixso-relative-no-shrink"
                                        ></div>
                                        <p
                                            id="2_824"
                                            className="Pixso-paragraph-2_824 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"看答案"}
                                        </p>
                                    </div>
                                    <div className="stroke-2_820"></div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_825"
                            className="Pixso-frame-2_825 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_825 pixso-relative-flex">
                                <div
                                    id="2_826"
                                    className="Pixso-frame-2_826 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_827"
                                        className="Pixso-vector-2_827 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_831"
                                        className="Pixso-paragraph-2_831 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {timeText}
                                    </p>
                                </div>
                                {revealed && (
                                    <p
                                        id="2_832"
                                        className="Pixso-paragraph-2_832 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"揭示后评分封顶 AGAIN"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_833"
                    ref={scrollRef}
                    className="Pixso-frame-2_833 pixso-relative-no-shrink pixso-flex-auto-height"
                    style={{ overflowY: "auto" }}
                >
                    <div className="frame-content-2_833 pixso-relative-flex">
                        <div
                            id="2_834"
                            className="Pixso-frame-2_834 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_834 pixso-relative-flex">
                                <div
                                    id="2_835"
                                    className="Pixso-frame-2_835 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_835 pixso-relative-flex">
                                        <p
                                            id="2_836"
                                            className="Pixso-paragraph-2_836 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {category}
                                        </p>
                                        <div
                                            id="2_837"
                                            className="Pixso-frame-2_837 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_838"
                                                className="Pixso-paragraph-2_838 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {modeLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_839"
                                    className="Pixso-paragraph-2_839 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    <MarkdownLite text={stem} />
                                </div>
                            </div>
                        </div>
                        {msgs.map((m) =>
                            m.role === "me" ? (
                                <div
                                    key={m.id}
                                    className="Pixso-frame-2_840 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_840 pixso-relative-flex">
                                        <div className="Pixso-frame-2_841 pixso-relative-no-shrink pixso-flex-auto-height">
                                            <div className="frame-content-2_841 pixso-relative-flex">
                                                <div className="Pixso-frame-2_842 pixso-relative-no-shrink pixso-flex-auto-height">
                                                    <div className="frame-content-2_842 pixso-relative-flex">
                                                        <p className="Pixso-paragraph-2_843 pixso-relative-no-shrink pixso-h-auto">
                                                            {m.text}
                                                        </p>
                                                    </div>
                                                </div>
                                                {times[m.id] && (
                                                    <p className="Pixso-paragraph-2_844 pixso-relative-auto-size pixso-flex-shrink-0">
                                                        {times[m.id]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    key={m.id}
                                    className="Pixso-frame-2_853 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_853 pixso-relative-flex">
                                        <div className="Pixso-frame-2_854 pixso-relative-no-shrink pixso-flex">
                                            <div className="frame-content-2_854 pixso-relative-flex">
                                                <div className="Pixso-frame-2_855 pixso-relative-no-shrink pixso-flex">
                                                    <div className="frame-content-2_855 pixso-relative-flex">
                                                        <div className="Pixso-vector-2_856 pixso-relative-no-shrink"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="Pixso-frame-2_861 effect-effectcardshadow-2_19 pixso-relative-flex pixso-h-auto">
                                            <div className="frame-content-2_861 pixso-relative-flex">
                                                <p className="Pixso-paragraph-2_862 pixso-relative-auto-size pixso-flex-shrink-0">
                                                    {`AI 导师 · 追问 ${aiSeq.get(m.id) ?? 1}`}
                                                </p>
                                                <p className="Pixso-paragraph-2_863 pixso-relative-no-shrink pixso-h-auto">
                                                    {m.text}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                        {streaming && (
                            <div
                                id="2_845"
                                className="Pixso-frame-2_845 pixso-relative-no-shrink pixso-flex-auto-height"
                            >
                                <div className="frame-content-2_845 pixso-relative-flex">
                                    <div
                                        id="2_846"
                                        className="Pixso-frame-2_846 pixso-relative-no-shrink"
                                    ></div>
                                    <div
                                        id="2_847"
                                        className="Pixso-frame-2_847 pixso-relative-no-shrink"
                                    ></div>
                                    <div
                                        id="2_848"
                                        className="Pixso-frame-2_848 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_849"
                                        className="Pixso-paragraph-2_849 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"AI 思考中…"}
                                    </p>
                                    <div
                                        id="2_850"
                                        className="Pixso-frame-2_850 pixso-position-relative"
                                    ></div>
                                    <div
                                        id="2_851"
                                        className="Pixso-vector-2_851 pixso-relative-no-shrink"
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    id="2_864"
                    className="stroke-wrapper-2_864 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="Pixso-frame-2_864 pixso-relative-no-shrink pixso-flex">
                        <div className="frame-content-2_864 pixso-relative-flex">
                            <div
                                id="2_865"
                                className="Pixso-frame-2_865 pixso-relative-flex pixso-h-auto"
                            >
                                <div className="frame-content-2_865 pixso-relative-flex">
                                    <input
                                        value={input}
                                        disabled={disabled}
                                        placeholder={placeholder}
                                        onChange={(e) => onInputChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                onSend();
                                            }
                                        }}
                                        style={{
                                            width: "100%",
                                            minWidth: 0,
                                            border: "none",
                                            outline: "none",
                                            background: "transparent",
                                            fontSize: 14,
                                            color: "var(--color-text-primary)",
                                        }}
                                    />
                                    <p
                                        id="2_867"
                                        className="Pixso-paragraph-2_867 pixso-relative-no-shrink pixso-h-auto"
                                    >
                                        {"按住右下角麦克风说话，或继续输入"}
                                    </p>
                                </div>
                            </div>
                            <div
                                id="2_868"
                                className="Pixso-frame-2_868 pixso-relative-no-shrink pixso-flex"
                                style={{ opacity: disabled ? 0.5 : 1 }}
                            >
                                <div className="frame-content-2_868 pixso-relative-flex">
                                    <div
                                        id="2_869"
                                        className="Pixso-frame-2_869 pixso-relative-no-shrink"
                                    >
                                        <div
                                            id="2_870"
                                            className="Pixso-vector-2_870"
                                        ></div>
                                        <div
                                            id="2_871"
                                            className="Pixso-vector-2_871"
                                        ></div>
                                        <div
                                            id="2_872"
                                            className="stroke-wrapper-2_872"
                                        >
                                            <div className="Pixso-rectangle-2_872 pixso-position-relative"></div>
                                            <div className="stroke-2_872"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                onClick={disabled ? undefined : onSend}
                                id="2_873"
                                className="Pixso-frame-2_873 pixso-relative-no-shrink pixso-flex"
                                style={{ opacity: disabled ? 0.5 : 1 }}
                            >
                                <div className="frame-content-2_873 pixso-relative-flex">
                                    <div
                                        id="2_874"
                                        className="Pixso-vector-2_874 pixso-relative-no-shrink"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="stroke-2_864"></div>
                </div>
            </div>
        </div>
    );
};
export default Frame2807;
