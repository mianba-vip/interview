import "@/styles/Frame2720.css";
import type { RefObject } from "react";
import { MarkdownLite } from "@/components/MarkdownLite";
import type { ChatMsg } from "@/api/types";

export interface Frame2720Props {
    title: string; // 顶栏题名
    category: string; // 卡片首行：「场景题」等
    modeLabel: string; // 「单选 · 第 N 题」
    stem: string; // 题干 Markdown（内嵌 A-D 选项原文）
    timeText: string; // mm:ss 计时
    revealed: boolean; // 揭示态 → 显示封顶 banner
    msgs: ChatMsg[]; // 对话消息（模板无消息区，注入最小列表）
    streaming: boolean; // AI 思考中
    input: string; // 受控输入
    placeholder: string;
    disabled: boolean; // 流式/判分中禁用输入
    scrollRef?: RefObject<HTMLDivElement>; // 内容滚动区（供容器滚到底）
    onInputChange: (v: string) => void;
    onSend: () => void;
    onReveal: () => void;
    /** 顶栏「结束并评分」：随时手动收尾（判分跳复盘） */
    onFinish?: () => void;
    finishing?: boolean;
    onBack: () => void;
}

const Frame2720 = ({
    title,
    category,
    modeLabel,
    stem,
    timeText,
    revealed,
    msgs,
    streaming,
    input,
    placeholder,
    disabled,
    scrollRef,
    onInputChange,
    onSend,
    onReveal,
    onFinish,
    finishing,
    onBack,
}: Frame2720Props) => {
    return (
        <div className="scroll-container">
            <div
                id="2_720"
                className="Pixso-frame-2_720 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_721"
                    className="Pixso-frame-2_721 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_721 pixso-relative-flex">
                        <div
                            id="2_722"
                            className="Pixso-frame-2_722 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_722 pixso-relative-flex">
                                <div
                                    onClick={onBack}
                                    id="2_723"
                                    className="Pixso-frame-2_723 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_723 pixso-relative-flex">
                                        <div
                                            id="2_724"
                                            className="Pixso-vector-2_724 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_727"
                                    className="Pixso-frame-2_727 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_728"
                                        className="Pixso-vector-2_728 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_731"
                                        className="Pixso-paragraph-2_731 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {title}
                                    </p>
                                </div>
                                <div
                                    id="2_732"
                                    className="Pixso-frame-2_732 pixso-position-relative"
                                ></div>
                                <div
                                    onClick={onReveal}
                                    id="2_733"
                                    className="stroke-wrapper-2_733 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_733 pixso-relative-no-shrink pixso-flex">
                                        <div
                                            id="2_734"
                                            className="Pixso-vector-2_734 pixso-relative-no-shrink"
                                        ></div>
                                        <p
                                            id="2_737"
                                            className="Pixso-paragraph-2_737 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"看答案"}
                                        </p>
                                    </div>
                                    <div className="stroke-2_733"></div>
                                </div>
                                <div
                                    onClick={finishing ? undefined : onFinish}
                                    style={{ marginLeft: 8, opacity: finishing ? 0.6 : 1, cursor: "pointer" }}
                                    className="stroke-wrapper-2_733 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_733 pixso-relative-no-shrink pixso-flex">
                                        <p className="Pixso-paragraph-2_737 pixso-relative-auto-size pixso-flex-shrink-0">
                                            {finishing ? "判分中…" : "结束并评分"}
                                        </p>
                                    </div>
                                    <div className="stroke-2_733"></div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_738"
                            className="Pixso-frame-2_738 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_738 pixso-relative-flex">
                                <div
                                    id="2_739"
                                    className="Pixso-frame-2_739 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_740"
                                        className="Pixso-vector-2_740 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_744"
                                        className="Pixso-paragraph-2_744 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {timeText}
                                    </p>
                                </div>
                                {revealed && (
                                    <p
                                        id="2_745"
                                        className="Pixso-paragraph-2_745 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"揭示后评分封顶 AGAIN"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_746"
                    ref={scrollRef}
                    className="Pixso-frame-2_746 pixso-relative-no-shrink pixso-flex-auto-height"
                    style={{ overflowY: "auto" }}
                >
                    <div className="frame-content-2_746 pixso-relative-flex">
                        <div
                            id="2_747"
                            className="Pixso-frame-2_747 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_747 pixso-relative-flex">
                                <div
                                    id="2_748"
                                    className="Pixso-frame-2_748 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_748 pixso-relative-flex">
                                        <p
                                            id="2_749"
                                            className="Pixso-paragraph-2_749 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {category}
                                        </p>
                                        <div
                                            id="2_750"
                                            className="Pixso-frame-2_750 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_751"
                                                className="Pixso-paragraph-2_751 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {modeLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_752"
                                    className="Pixso-paragraph-2_752 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    <MarkdownLite text={stem} />
                                </div>
                            </div>
                        </div>
                        {msgs.map((m) => (
                            <div
                                key={m.id}
                                className={
                                    m.role === "me"
                                        ? "stroke-wrapper-2_782 pixso-relative-no-shrink pixso-flex-auto-height"
                                        : "stroke-wrapper-2_778 pixso-relative-no-shrink pixso-flex-auto-height"
                                }
                            >
                                <div
                                    className={
                                        m.role === "me"
                                            ? "Pixso-frame-2_782 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                                            : "Pixso-frame-2_778 pixso-relative-no-shrink pixso-flex"
                                    }
                                >
                                    <div
                                        className={
                                            m.role === "me"
                                                ? "frame-content-2_782 pixso-relative-flex"
                                                : "frame-content-2_778 pixso-relative-flex"
                                        }
                                    >
                                        <div className="Pixso-paragraph-2_752 pixso-relative-no-shrink pixso-h-auto">
                                            <MarkdownLite text={m.text} />
                                        </div>
                                    </div>
                                </div>
                                {m.role === "me" ? (
                                    <div className="stroke-2_782"></div>
                                ) : (
                                    <div className="stroke-2_778"></div>
                                )}
                            </div>
                        ))}
                        {streaming && (
                            <p className="Pixso-paragraph-2_777 pixso-relative-auto-size pixso-flex-shrink-0">
                                {"AI 思考中…"}
                            </p>
                        )}
                    </div>
                </div>
                <div
                    id="2_794"
                    className="stroke-wrapper-2_794 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="Pixso-frame-2_794 pixso-relative-no-shrink pixso-flex">
                        <div className="frame-content-2_794 pixso-relative-flex">
                            <div
                                id="2_795"
                                className="Pixso-frame-2_795 pixso-relative-flex"
                            >
                                <div className="frame-content-2_795 pixso-relative-flex">
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
                                            fontSize: 15,
                                            color: "var(--color-text-primary)",
                                        }}
                                    />
                                </div>
                            </div>
                            <div
                                id="2_798"
                                className="Pixso-frame-2_798 pixso-relative-no-shrink pixso-flex"
                                style={{ opacity: disabled ? 0.5 : 1 }}
                            >
                                <div className="frame-content-2_798 pixso-relative-flex">
                                    <div
                                        id="2_799"
                                        className="Pixso-frame-2_799 pixso-relative-no-shrink"
                                    >
                                        <div
                                            id="2_800"
                                            className="Pixso-vector-2_800"
                                        ></div>
                                        <div
                                            id="2_801"
                                            className="Pixso-vector-2_801"
                                        ></div>
                                        <div
                                            id="2_802"
                                            className="stroke-wrapper-2_802"
                                        >
                                            <div className="Pixso-rectangle-2_802 pixso-position-relative"></div>
                                            <div className="stroke-2_802"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                onClick={disabled ? undefined : onSend}
                                id="2_803"
                                className="Pixso-frame-2_803 pixso-relative-no-shrink pixso-flex"
                                style={{ opacity: disabled ? 0.5 : 1 }}
                            >
                                <div className="frame-content-2_803 pixso-relative-flex">
                                    <div
                                        id="2_804"
                                        className="Pixso-vector-2_804 pixso-relative-no-shrink"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="stroke-2_794"></div>
                </div>
            </div>
        </div>
    );
};
export default Frame2720;
