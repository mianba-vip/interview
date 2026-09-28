import "@/styles/Frame2877.css";
import { MarkdownLite } from "@/components/MarkdownLite";

/** 评分点一行：byConceptJson 摊平后的 { point, verdict } */
export interface ReviewRow {
    point: string;
    verdict: string; // HIT / PARTIAL / MISS / NA
}

export interface Frame2877Props {
    grade: string; // GOOD / EASY / HARD / MISSING …
    score: string; // 取整后的分数文案
    timeText: string; // 用时 …（推导不出时为兜底文案）
    attemptText: string; // 第 N 次作答
    rows: ReviewRow[]; // 评分点明细
    weak: string[]; // 欠缺点列表（标题数量取 length）
    approach: string; // 解题思路（Markdown）
    mnemonic: string; // 记忆口诀（Markdown）
    cardText: string; // 沉淀按钮文案（防重复点击：沉淀中… / 已沉淀）
    cardDisabled: boolean;
    onBack: () => void;
    onCard: () => void;
}

/** 评分点三色 pill：命中薄荷 / 部分柠檬 / 缺失珊瑚 / 未考察中性——沿用模板既有配色 */
const PILL: Record<string, { bg: string; fg: string }> = {
    HIT: { bg: "var(--color-brand-mintsoft)", fg: "var(--color-brand-mint)" },
    PARTIAL: { bg: "var(--color-brand-lemonsoft)", fg: "var(--color-brand-lemon)" },
    MISS: { bg: "var(--color-brand-coralsoft)", fg: "var(--color-brand-coral)" },
    NA: { bg: "var(--color-bg-input)", fg: "var(--color-text-secondary)" },
};
const VERDICT_LABEL: Record<string, string> = {
    HIT: "命中",
    PARTIAL: "部分",
    MISS: "缺失",
    NA: "未考察",
};

const Frame2877 = ({
    grade,
    score,
    timeText,
    attemptText,
    rows,
    weak,
    approach,
    mnemonic,
    cardText,
    cardDisabled,
    onBack,
    onCard,
}: Frame2877Props) => {
    return (
        <div className="scroll-container">
            <div
                id="2_877"
                className="Pixso-frame-2_877 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_878"
                    className="Pixso-frame-2_878 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_878 pixso-relative-flex">
                        <div
                            onClick={onBack}
                            id="2_879"
                            className="Pixso-frame-2_879 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_879 pixso-relative-flex">
                                <div
                                    id="2_880"
                                    className="Pixso-vector-2_880 pixso-relative-no-shrink"
                                ></div>
                            </div>
                        </div>
                        <p
                            id="2_883"
                            className="Pixso-paragraph-2_883 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"复盘"}
                        </p>
                        <div
                            id="2_884"
                            className="Pixso-frame-2_884 pixso-position-relative"
                        ></div>
                        <div
                            id="2_885"
                            className="stroke-wrapper-2_885 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_885 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_885"></div>
                            <div className="Pixso-frame-2_885-content-layer">
                                <div className="frame-content-2_885 pixso-relative-flex">
                                    <div
                                        id="2_886"
                                        className="Pixso-vector-2_886 pixso-relative-no-shrink"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_892"
                    className="Pixso-frame-2_892 pixso-relative-no-shrink pixso-flex-auto-height"
                    style={{ overflowY: "auto" }}
                >
                    <div className="frame-content-2_892 pixso-relative-flex">
                        <div
                            id="2_893"
                            className="Pixso-frame-2_893 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_893 pixso-relative-flex">
                                <div
                                    id="2_894"
                                    className="stroke-wrapper-2_894 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_894 pixso-relative-no-shrink pixso-flex">
                                        <div
                                            id="2_895"
                                            className="Pixso-vector-2_895 pixso-relative-no-shrink"
                                        ></div>
                                        <p
                                            id="2_898"
                                            className="Pixso-paragraph-2_898 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {grade}
                                        </p>
                                    </div>
                                    <div className="stroke-2_894"></div>
                                </div>
                                <div
                                    id="2_899"
                                    className="Pixso-frame-2_899 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <p
                                        id="2_900"
                                        className="Pixso-paragraph-2_900 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {score}
                                    </p>
                                    <p
                                        id="2_901"
                                        className="Pixso-paragraph-2_901 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"分"}
                                    </p>
                                </div>
                                <div
                                    id="2_902"
                                    className="Pixso-frame-2_902 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <p
                                        id="2_903"
                                        className="Pixso-paragraph-2_903 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {timeText}
                                    </p>
                                    <div
                                        id="2_904"
                                        className="Pixso-frame-2_904 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_905"
                                        className="Pixso-paragraph-2_905 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {attemptText}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_906"
                            className="Pixso-frame-2_906 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_906 pixso-relative-flex">
                                <p
                                    id="2_907"
                                    className="Pixso-paragraph-2_907 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"评分点明细"}
                                </p>
                                {rows.length > 0 ? (
                                    rows.map((it, i) => {
                                        const pill = PILL[it.verdict] ?? PILL.NA;
                                        return (
                                            <div
                                                key={i}
                                                className="Pixso-frame-2_908 pixso-relative-no-shrink pixso-flex-auto-height"
                                            >
                                                <div className="frame-content-2_908 pixso-relative-flex">
                                                    <p className="Pixso-paragraph-2_909 pixso-position-relative pixso-h-auto">
                                                        {it.point}
                                                    </p>
                                                    <div
                                                        style={{ backgroundColor: pill.bg }}
                                                        className="Pixso-frame-2_910 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                    >
                                                        <p
                                                            style={{ color: pill.fg }}
                                                            className="Pixso-paragraph-2_911 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {VERDICT_LABEL[it.verdict] ?? it.verdict}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="Pixso-paragraph-2_909 pixso-position-relative pixso-h-auto">
                                        {"暂无评分点明细"}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div
                            id="2_924"
                            className="Pixso-frame-2_924 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_924 pixso-relative-flex">
                                <div
                                    id="2_925"
                                    className="Pixso-frame-2_925 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_925 pixso-relative-flex">
                                        <div
                                            id="2_926"
                                            className="Pixso-frame-2_926 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_926 pixso-relative-flex">
                                                <div
                                                    id="2_927"
                                                    className="Pixso-frame-2_927 pixso-relative-no-shrink"
                                                >
                                                    <div
                                                        id="2_928"
                                                        className="stroke-wrapper-2_928"
                                                    >
                                                        <div className="Pixso-rectangle-2_928 pixso-position-relative"></div>
                                                        <div className="stroke-2_928"></div>
                                                    </div>
                                                    <div
                                                        id="2_929"
                                                        className="Pixso-vector-2_929"
                                                    ></div>
                                                    <div
                                                        id="2_930"
                                                        className="Pixso-vector-2_930"
                                                    ></div>
                                                    <div
                                                        id="2_931"
                                                        className="Pixso-vector-2_931"
                                                    ></div>
                                                    <div
                                                        id="2_932"
                                                        className="Pixso-vector-2_932"
                                                    ></div>
                                                    <div
                                                        id="2_933"
                                                        className="Pixso-vector-2_933"
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        <p
                                            id="2_934"
                                            className="Pixso-paragraph-2_934 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`对话总结 · ${weak.length} 个欠缺点`}
                                        </p>
                                    </div>
                                </div>
                                {(weak.length > 0 ? weak : ["暂无欠缺点记录"]).map((w, i) => (
                                    <div key={i} className="Pixso-frame-2_935 pixso-relative-no-shrink pixso-flex-auto-height">
                                        <div className="frame-content-2_935 pixso-relative-flex">
                                            <div className="Pixso-frame-2_936 pixso-relative-no-shrink"></div>
                                            <p className="Pixso-paragraph-2_937 pixso-position-relative pixso-h-auto">
                                                {w}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div
                            id="2_941"
                            className="Pixso-frame-2_941 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_941 pixso-relative-flex">
                                <div
                                    id="2_942"
                                    className="Pixso-frame-2_942 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_942 pixso-relative-flex">
                                        <div
                                            id="2_943"
                                            className="Pixso-frame-2_943 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_943 pixso-relative-flex">
                                                <div
                                                    id="2_944"
                                                    className="Pixso-vector-2_944 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                        <p
                                            id="2_948"
                                            className="Pixso-paragraph-2_948 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"解题思路"}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_949"
                                    className="Pixso-text-2_949 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    <MarkdownLite text={approach} />
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_950"
                            className="Pixso-frame-2_950 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_950 pixso-relative-flex">
                                <div
                                    id="2_951"
                                    className="Pixso-frame-2_951 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_951 pixso-relative-flex">
                                        <div
                                            id="2_952"
                                            className="Pixso-vector-2_952 pixso-relative-no-shrink"
                                        ></div>
                                        <p
                                            id="2_955"
                                            className="Pixso-paragraph-2_955 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"记忆口诀"}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_956"
                                    className="Pixso-paragraph-2_956 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    <MarkdownLite text={mnemonic} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_957"
                    className="Pixso-frame-2_957 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_957 pixso-relative-flex">
                        <div
                            id="2_958"
                            className="Pixso-frame-2_958 pixso-relative-flex"
                        >
                            <div className="frame-content-2_958 pixso-relative-flex">
                                <div
                                    id="2_959"
                                    className="Pixso-vector-2_959 pixso-relative-no-shrink"
                                ></div>
                                <p
                                    id="2_962"
                                    className="Pixso-paragraph-2_962 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"写笔记内化"}
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={cardDisabled ? undefined : onCard}
                            id="2_963"
                            className="stroke-wrapper-2_963 pixso-relative-flex"
                        >
                            <div className="Pixso-frame-2_963 pixso-relative-flex"></div>
                            <div className="stroke-2_963"></div>
                            <div className="Pixso-frame-2_963-content-layer">
                                <div className="frame-content-2_963 pixso-relative-flex">
                                    <p
                                        id="2_964"
                                        className="Pixso-paragraph-2_964 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {cardText}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Frame2877;
