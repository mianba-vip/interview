import "@/styles/Frame2579.css";
import type { Ref } from "react";
import { useNavigate } from "react-router-dom";

/** 列表标题用纯文本：剥掉 **加粗**、`代码`、#、> 等 Markdown 记号（一行标题不需要 md 排版）。 */
function plainStem(md: string): string {
    return md
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[*_~#>]+/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/** 一行放不下就截断成省略号。 */
function shortTitle(md: string): string {
    const s = plainStem(md);
    return s.length > 30 ? `${s.slice(0, 30)}…` : s;
}

/** 今天 / 昨天 / N 天前 / M月D日（模板时间位）。 */
function dayLabel(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const day = 86400000;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (that === today) return `今天 ${hm}`;
    if (today - that === day) return `昨天 ${hm}`;
    const diff = Math.round((today - that) / day);
    if (diff < 7) return `${diff} 天前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 判分徽标配色：GOOD/EASY 用模板绿款，其余（HARD/MISSING/AGAIN）用模板红款。 */
const isCoral = (grade: string) => grade !== "GOOD" && grade !== "EASY";

/** 模板兜底：单题对话轮次上限。 */
const MAX_ROUND = 5;

export interface PracticeOngoingItem {
    runId: number;
    title: string;
    round: number;
    minutes: number;
}

export interface PracticeHistoryItem {
    runId: number;
    stem: string;
    answeredAt: string;
    grade: string;
}

export interface Frame2579Props {
    weekCount: number;
    total: number;
    ongoing: PracticeOngoingItem[];
    history: PracticeHistoryItem[];
    onOngoingClick?: (runId: number) => void;
    onHistoryClick?: (runId: number) => void;
    sentinelRef: Ref<HTMLDivElement>;
}

const Frame2579 = ({
    weekCount,
    total,
    ongoing,
    history,
    onOngoingClick,
    onHistoryClick,
    sentinelRef,
}: Frame2579Props) => {
    const navigate = useNavigate();
    return (
        <div className="scroll-container">
            <div
                id="2_579"
                className="Pixso-frame-2_579 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_580"
                    className="Pixso-frame-2_580 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_580 pixso-relative-flex">
                        <p
                            id="2_581"
                            className="Pixso-paragraph-2_581 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_582"
                            className="Pixso-frame-2_582 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_583"
                                className="Pixso-vector-2_583 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_589"
                                className="Pixso-vector-2_589 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_594"
                                className="Pixso-frame-2_594 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_595"
                                    className="Pixso-vector-2_595"
                                ></div>
                                <div
                                    id="2_596"
                                    className="Pixso-vector-2_596"
                                ></div>
                                <div
                                    id="2_597"
                                    className="Pixso-vector-2_597"
                                ></div>
                                <div
                                    id="2_598"
                                    className="Pixso-vector-2_598"
                                ></div>
                                <div
                                    id="2_599"
                                    className="stroke-wrapper-2_599"
                                >
                                    <div className="Pixso-rectangle-2_599 pixso-position-relative"></div>
                                    <div className="stroke-2_599"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_600"
                    className="Pixso-frame-2_600 pixso-relative-no-shrink pixso-flex-auto-height"
                    style={{ overflowY: "auto" }}
                >
                    <div className="frame-content-2_600 pixso-relative-flex">
                        <div
                            id="2_601"
                            className="Pixso-frame-2_601 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_601 pixso-relative-flex">
                                <p
                                    id="2_602"
                                    className="Pixso-paragraph-2_602 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"练习"}
                                </p>
                                <p
                                    id="2_603"
                                    className="Pixso-paragraph-2_603 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {`本周 ${weekCount} 题 · 目标 15 题`}
                                </p>
                            </div>
                        </div>
                        <div
                            id="2_604"
                            className="Pixso-frame-2_604 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_604 pixso-relative-flex">
                                <div
                                    id="2_605"
                                    className="Pixso-frame-2_605 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_605 pixso-relative-flex">
                                        <div
                                            id="2_606"
                                            className="Pixso-vector-2_606 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_611"
                                    className="Pixso-frame-2_611 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_611 pixso-relative-flex">
                                        <p
                                            id="2_612"
                                            className="Pixso-paragraph-2_612 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {"AI 导师只提问引导，不直接给答案"}
                                        </p>
                                        <p
                                            id="2_613"
                                            className="Pixso-paragraph-2_613 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {
                                                "先想通，才是真的会——把答案说出口前，先自己想一遍。"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {ongoing.map((o) => (
                        <div
                            key={o.runId}
                            onClick={() => onOngoingClick?.(o.runId)}
                            id="2_614"
                            className="Pixso-frame-2_614 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_614 pixso-relative-flex">
                                <div
                                    id="2_615"
                                    className="Pixso-frame-2_615 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_615 pixso-relative-flex">
                                        <div
                                            id="2_616"
                                            className="Pixso-frame-2_616 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_616 pixso-relative-flex">
                                                <div
                                                    id="2_617"
                                                    className="Pixso-frame-2_617 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                >
                                                    <div
                                                        id="2_618"
                                                        className="Pixso-frame-2_618 pixso-relative-no-shrink"
                                                    ></div>
                                                    <p
                                                        id="2_619"
                                                        className="Pixso-paragraph-2_619 pixso-relative-auto-size pixso-flex-shrink-0"
                                                    >
                                                        {"进行中"}
                                                    </p>
                                                </div>
                                                <p
                                                    id="2_620"
                                                    className="Pixso-paragraph-2_620 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {`第 ${o.round} 轮对话中`}
                                                </p>
                                            </div>
                                        </div>
                                        <p
                                            id="2_621"
                                            className="Pixso-paragraph-2_621 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {shortTitle(o.title)}
                                        </p>
                                        <p
                                            id="2_622"
                                            className="Pixso-paragraph-2_622 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`对话轮次 ${o.round} / ${MAX_ROUND} · 已持续 ${o.minutes} 分钟`}
                                        </p>
                                        <div
                                            id="2_623"
                                            className="Pixso-frame-2_623 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_623 pixso-relative-flex">
                                                <p
                                                    id="2_624"
                                                    className="Pixso-paragraph-2_624 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"继续练习"}
                                                </p>
                                                <div
                                                    id="2_625"
                                                    className="Pixso-vector-2_625 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                        <div
                            id="2_628"
                            className="Pixso-frame-2_628 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_628 pixso-relative-flex">
                                <p
                                    id="2_629"
                                    className="Pixso-paragraph-2_629 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"历史练习"}
                                </p>
                                <p
                                    id="2_630"
                                    className="Pixso-paragraph-2_630 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {`全部 ${total} 次`}
                                </p>
                            </div>
                        </div>
                        {history.map((h) => (
                        <div
                            key={h.runId}
                            onClick={() => onHistoryClick?.(h.runId)}
                            id="2_631"
                            className="Pixso-frame-2_631 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_631 pixso-relative-flex">
                                <div
                                    id="2_632"
                                    className="Pixso-frame-2_632 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_632 pixso-relative-flex">
                                        <p
                                            id="2_633"
                                            className="Pixso-paragraph-2_633 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {shortTitle(h.stem)}
                                        </p>
                                        <div
                                            id="2_634"
                                            className="Pixso-frame-2_634 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_634 pixso-relative-flex">
                                                <p
                                                    id="2_635"
                                                    className="Pixso-paragraph-2_635 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {dayLabel(h.answeredAt)}
                                                </p>
                                                <div
                                                    id="2_636"
                                                    className="Pixso-frame-2_636 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                >
                                                    <div
                                                        id="2_637"
                                                        className="Pixso-frame-2_637 pixso-relative-no-shrink"
                                                    ></div>
                                                    <div
                                                        id="2_638"
                                                        className="Pixso-frame-2_638 pixso-relative-no-shrink"
                                                    ></div>
                                                    <div
                                                        id="2_639"
                                                        className="Pixso-frame-2_639 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_640"
                                    className="Pixso-frame-2_640 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_641"
                                        className="stroke-wrapper-2_641 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                    >
                                        <div
                                            className={`pixso-relative-no-shrink pixso-flex ${
                                                isCoral(h.grade) ? "Pixso-frame-2_655" : "Pixso-frame-2_641"
                                            }`}
                                        >
                                            <p
                                                id="2_642"
                                                className={`pixso-relative-auto-size pixso-flex-shrink-0 ${
                                                    isCoral(h.grade) ? "Pixso-paragraph-2_656" : "Pixso-paragraph-2_642"
                                                }`}
                                            >
                                                {h.grade}
                                            </p>
                                        </div>
                                        <div
                                            className={isCoral(h.grade) ? "stroke-2_655" : "stroke-2_641"}
                                        ></div>
                                    </div>
                                    <div
                                        id="2_643"
                                        className="Pixso-vector-2_643 pixso-relative-no-shrink"
                                    ></div>
                                </div>
                            </div>
                        </div>
                        ))}
                        <div ref={sentinelRef} />
                    </div>
                </div>
                <div
                    id="2_687"
                    className="Pixso-frame-2_687 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_687 pixso-relative-flex">
                        <div
                            id="2_688"
                            className="stroke-wrapper-2_688 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_688 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_688"></div>
                            <div className="Pixso-frame-2_688-content-layer">
                                <div className="frame-content-2_688 pixso-relative-flex">
                                    <div
                                        onClick={() => navigate("/tasks")}
                                        id="2_689"
                                        className="Pixso-frame-2_689 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_689 pixso-relative-flex">
                                            <div
                                                id="2_690"
                                                className="Pixso-frame-2_690 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_690 pixso-relative-flex">
                                                    <div
                                                        id="2_691"
                                                        className="Pixso-vector-2_691 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_694"
                                                className="Pixso-paragraph-2_694 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"首页"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/practice")}
                                        id="2_695"
                                        className="Pixso-frame-2_695 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_695 pixso-relative-flex">
                                            <div
                                                id="2_696"
                                                className="Pixso-frame-2_696 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_696 pixso-relative-flex">
                                                    <div
                                                        id="2_697"
                                                        className="Pixso-vector-2_697 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_700"
                                                className="Pixso-paragraph-2_700 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"练习"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/interview")}
                                        id="2_701"
                                        className="Pixso-frame-2_701 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_701 pixso-relative-flex">
                                            <div
                                                id="2_702"
                                                className="Pixso-frame-2_702 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_702 pixso-relative-flex">
                                                    <div
                                                        id="2_703"
                                                        className="Pixso-frame-2_703 pixso-relative-no-shrink"
                                                    >
                                                        <div
                                                            id="2_704"
                                                            className="Pixso-vector-2_704"
                                                        ></div>
                                                        <div
                                                            id="2_705"
                                                            className="stroke-wrapper-2_705"
                                                        >
                                                            <div className="Pixso-rectangle-2_705 pixso-position-relative"></div>
                                                            <div className="stroke-2_705"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_706"
                                                className="Pixso-paragraph-2_706 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"面试"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/sediment")}
                                        id="2_707"
                                        className="Pixso-frame-2_707 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_707 pixso-relative-flex">
                                            <div
                                                id="2_708"
                                                className="Pixso-frame-2_708 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_708 pixso-relative-flex">
                                                    <div
                                                        id="2_709"
                                                        className="Pixso-vector-2_709 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_713"
                                                className="Pixso-paragraph-2_713 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"沉淀"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/me")}
                                        id="2_714"
                                        className="Pixso-frame-2_714 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_714 pixso-relative-flex">
                                            <div
                                                id="2_715"
                                                className="Pixso-frame-2_715 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_715 pixso-relative-flex">
                                                    <div
                                                        id="2_716"
                                                        className="Pixso-vector-2_716 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_719"
                                                className="Pixso-paragraph-2_719 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"我的"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Frame2579;
