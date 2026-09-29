import "@/styles/Frame2394.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/** 任务状态位文案（卡片右侧）。 */
const statusText = (s: string) =>
    s === "READY" ? "已就绪 · 秒开" : s === "PENDING" ? "生成中…" : s === "DONE" ? "已完成 ✓" : "";
/** 任务卡按钮文案。 */
const btnText = (s: string) =>
    s === "READY" ? "开始练习" : s === "PENDING" ? "生成中…" : "已完成";

/** 懒渲染一页（任务卡 / 知识点行通用步长）。 */
const PAGE = 10;
/** 知识点清单一页行数。 */
const PT_PAGE = 30;
/** 掌握度圆点：2 薄荷 / 1 柠檬 / 0 珊瑚。 */
const DOT_COLOR = ["var(--color-brand-coral)", "var(--color-brand-lemon)", "var(--color-brand-mint)"];
const dotColor = (masteryLevel: number) => DOT_COLOR[Math.max(0, Math.min(2, masteryLevel))];

export interface HomeTaskItem {
    id: number;
    kind: "REVIEW" | "NEW";
    title: string;
    status: string;
    conceptId: number;
    subPoint: string | null;
}

/** 知识点清单一行（来自当前方向 concepts，扁平化后懒渲染）。 */
export interface HomePointItem {
    conceptId: number;
    layer: number;
    name: string;
    masteryLevel: number;
}

export interface Frame2394Props {
    name: string;
    streakDays: number;
    direction: string;
    mastered: number;
    inProgress: number;
    notMastered: number;
    total: number;
    unlockHint: string;
    progress: number;
    taskSummary: string;
    tasks: HomeTaskItem[];
    debtText: string;
    /** 知识点清单：当前方向全部层级；拿不到就不传，整卡不渲染 */
    points?: HomePointItem[];
    /** 卡片主体 / 「先听讲解 →」：进讲解页（带 taskId，讲完可直接开题） */
    onLesson?: (conceptId: number, subPoint: string | null, taskId: number) => void;
    /** 卡内「开始练习」：直接开题 */
    onStartTask?: (id: number) => void;
    /** 知识点清单行点击 → 进该知识点的讲解页 */
    onPoint?: (conceptId: number) => void;
}

type PointRow =
    | { kind: "head"; layer: number; count: number }
    | { kind: "pt"; conceptId: number; name: string; masteryLevel: number };

/** 知识点按 layer 分组扁平化：小节头 + 知识点行。 */
function buildPointRows(points?: HomePointItem[]): PointRow[] {
    const rows: PointRow[] = [];
    if (!points?.length) return rows;
    const layers = [...new Set(points.map((p) => p.layer))].sort((a, b) => a - b);
    for (const l of layers) {
        const list = points.filter((p) => p.layer === l);
        rows.push({ kind: "head", layer: l, count: list.length });
        for (const p of list) rows.push({ kind: "pt", conceptId: p.conceptId, name: p.name, masteryLevel: p.masteryLevel });
    }
    return rows;
}

/** 底部哨兵懒加载：root = 可滚中栏 2_415（挂载后取，取不到退回视口）；version 变了重挂观察器继续补一页。 */
function useSentinel(onHit: () => void, version: number) {
    const [el, setEl] = useState<HTMLDivElement | null>(null);
    const [root, setRoot] = useState<Element | null>(null);
    const hitRef = useRef(onHit);
    hitRef.current = onHit;
    useEffect(() => {
        setRoot(document.getElementById("2_415"));
    }, []);
    useEffect(() => {
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) hitRef.current();
            },
            { root, rootMargin: "300px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [el, root, version]);
    return setEl;
}

/** 今日任务卡：整卡→讲解页；「开始练习」直接开题；「先听讲解 →」同 state 进讲解页。 */
const TaskCard = ({
    t,
    onLesson,
    onStartTask,
}: {
    t: HomeTaskItem;
    onLesson?: Frame2394Props["onLesson"];
    onStartTask?: Frame2394Props["onStartTask"];
}) => (
    <div
        onClick={() => onLesson?.(t.conceptId, t.subPoint, t.id)}
        id="2_484"
        className="Pixso-frame-2_484 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
    >
        <div className="frame-content-2_484 pixso-relative-flex">
            <div
                id="2_485"
                className="Pixso-frame-2_485 pixso-relative-no-shrink pixso-flex-auto-height"
            >
                <div className="frame-content-2_485 pixso-relative-flex">
                    <div
                        id="2_486"
                        className="Pixso-frame-2_486 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                    >
                        <div
                            id="2_487"
                            className="Pixso-vector-2_487 pixso-relative-no-shrink"
                        ></div>
                        <p
                            id="2_490"
                            className="Pixso-paragraph-2_490 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {t.kind === "REVIEW" ? "复习" : "新学"}
                        </p>
                    </div>
                    <p
                        id="2_491"
                        className="Pixso-paragraph-2_491 pixso-relative-auto-size pixso-flex-shrink-0"
                    >
                        {statusText(t.status)}
                    </p>
                </div>
            </div>
            <p
                id="2_492"
                className="Pixso-paragraph-2_492 pixso-relative-no-shrink pixso-h-auto"
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                }}
            >
                {t.title}
            </p>
            <p
                onClick={(e) => {
                    e.stopPropagation();
                    onLesson?.(t.conceptId, t.subPoint, t.id);
                }}
                style={{
                    fontSize: "var(--font-caption)",
                    fontWeight: 600,
                    color: "var(--color-brand-purple)",
                    cursor: "pointer",
                }}
            >
                {"先听讲解 →"}
            </p>
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onStartTask?.(t.id);
                }}
                id="2_493"
                className="Pixso-frame-2_493 pixso-relative-no-shrink pixso-flex"
            >
                <div className="frame-content-2_493 pixso-relative-flex">
                    <p
                        id="2_494"
                        className="Pixso-paragraph-2_494 pixso-relative-auto-size pixso-flex-shrink-0"
                    >
                        {btnText(t.status)}
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const Frame2394 = ({
    name,
    streakDays,
    direction,
    mastered,
    inProgress,
    notMastered,
    total,
    unlockHint,
    progress,
    taskSummary,
    tasks,
    debtText,
    points,
    onLesson,
    onStartTask,
    onPoint,
}: Frame2394Props) => {
    const navigate = useNavigate();
    const greet = new Date().getHours() < 12 ? "早上好" : "晚上好";
    // 今日任务：顶部「复习/学习」分段切换，懒渲染当前栏（触底追加）
    const [taskLimit, setTaskLimit] = useState(PAGE);
    const [taskTab, setTaskTab] = useState<"review" | "new">("review");
    const reviewTasks = tasks.filter((t) => t.kind === "REVIEW");
    const newTasks = tasks.filter((t) => t.kind !== "REVIEW");
    const activeTasks = taskTab === "review" ? reviewTasks : newTasks;
    const shownActive = activeTasks.slice(0, taskLimit);
    const taskSentinel = useSentinel(
        () => setTaskLimit((n) => (n < tasks.length ? n + PAGE : n)),
        taskLimit,
    );
    // 知识点清单：折叠/展开，展开后 30 行一页懒渲染
    const [ptsOpen, setPtsOpen] = useState(false);
    const [ptLimit, setPtLimit] = useState(PT_PAGE);
    const pointRows = buildPointRows(points);
    const pointSentinel = useSentinel(
        () => setPtLimit((n) => (n < pointRows.length ? n + PT_PAGE : n)),
        ptLimit,
    );
    const ptLayers = [...new Set((points ?? []).map((p) => p.layer))].sort((a, b) => a - b);
    const layerText = ptLayers.length ? `L${ptLayers[0]}–L${ptLayers[ptLayers.length - 1]}` : "";
    return (
        <div className="scroll-container">
            <div
                id="2_394"
                className="Pixso-frame-2_394 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_395"
                    className="Pixso-frame-2_395 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_395 pixso-relative-flex">
                        <p
                            id="2_396"
                            className="Pixso-paragraph-2_396 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_397"
                            className="Pixso-frame-2_397 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_398"
                                className="Pixso-vector-2_398 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_404"
                                className="Pixso-vector-2_404 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_409"
                                className="Pixso-frame-2_409 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_410"
                                    className="Pixso-vector-2_410"
                                ></div>
                                <div
                                    id="2_411"
                                    className="Pixso-vector-2_411"
                                ></div>
                                <div
                                    id="2_412"
                                    className="Pixso-vector-2_412"
                                ></div>
                                <div
                                    id="2_413"
                                    className="Pixso-vector-2_413"
                                ></div>
                                <div
                                    id="2_414"
                                    className="stroke-wrapper-2_414"
                                >
                                    <div className="Pixso-rectangle-2_414 pixso-position-relative"></div>
                                    <div className="stroke-2_414"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_415"
                    className="Pixso-frame-2_415 pixso-relative-no-shrink pixso-flex-auto-height"
                    style={{ overflowY: "auto" }}
                >
                    <div className="frame-content-2_415 pixso-relative-flex">
                        <div
                            id="2_416"
                            className="Pixso-frame-2_416 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_416 pixso-relative-flex">
                                <div
                                    id="2_417"
                                    className="Pixso-frame-2_417 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_418"
                                        className="Pixso-frame-2_418 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                    >
                                        <p
                                            id="2_419"
                                            className="Pixso-paragraph-2_419 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`${greet}，${name}`}
                                        </p>
                                        <div
                                            id="2_420"
                                            className="Pixso-vector-2_420 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                    <div
                                        id="2_430"
                                        className="Pixso-frame-2_430 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                    >
                                        <div
                                            id="2_431"
                                            className="Pixso-vector-2_431 pixso-relative-no-shrink"
                                        ></div>
                                        <p
                                            id="2_433"
                                            className="Pixso-paragraph-2_433 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`连续学习 ${streakDays} 天`}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_434"
                                    className="stroke-wrapper-2_434 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_434 pixso-relative-no-shrink pixso-flex">
                                        <p
                                            id="2_435"
                                            className="Pixso-paragraph-2_435 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {direction}
                                        </p>
                                        <div
                                            id="2_436"
                                            className="Pixso-vector-2_436 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                    <div className="stroke-2_434"></div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_438"
                            className="Pixso-frame-2_438 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_438 pixso-relative-flex">
                                <div
                                    id="2_439"
                                    className="Pixso-frame-2_439 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_439 pixso-relative-flex">
                                        <p
                                            id="2_440"
                                            className="Pixso-paragraph-2_440 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"掌握度总览"}
                                        </p>
                                        <div
                                            id="2_441"
                                            className="Pixso-frame-2_441 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                id="2_442"
                                                className="Pixso-vector-2_442 pixso-relative-no-shrink"
                                            ></div>
                                            <p
                                                id="2_446"
                                                className="Pixso-paragraph-2_446 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"L1 · 筑基"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_447"
                                    className="Pixso-frame-2_447 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_447 pixso-relative-flex">
                                        <div
                                            id="2_448"
                                            className="Pixso-frame-2_448 pixso-relative-no-shrink"
                                        >
                                            <div
                                                id="2_449"
                                                className="Pixso-frame-2_449"
                                            >
                                                <div
                                                    id="2_450"
                                                    className="Pixso-vector-2_450"
                                                ></div>
                                                <div
                                                    id="2_451"
                                                    className="Pixso-vector-2_451"
                                                ></div>
                                            </div>
                                            <div
                                                id="2_455"
                                                className="Pixso-frame-2_455 pixso-flex-auto-height"
                                            >
                                                <div className="frame-content-2_455 pixso-relative-flex">
                                                    <p
                                                        id="2_456"
                                                        className="Pixso-paragraph-2_456 pixso-relative-auto-size pixso-flex-shrink-0"
                                                    >
                                                        {total}
                                                    </p>
                                                    <p
                                                        id="2_457"
                                                        className="Pixso-paragraph-2_457 pixso-relative-auto-size pixso-flex-shrink-0"
                                                    >
                                                        {"知识点"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            id="2_458"
                                            className="Pixso-frame-2_458 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_458 pixso-relative-flex">
                                                <div
                                                    id="2_459"
                                                    className="Pixso-frame-2_459 pixso-relative-no-shrink pixso-flex-auto-height"
                                                >
                                                    <div className="frame-content-2_459 pixso-relative-flex">
                                                        <div
                                                            id="2_460"
                                                            className="Pixso-frame-2_460 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <div
                                                                id="2_461"
                                                                className="Pixso-frame-2_461 pixso-relative-no-shrink"
                                                            ></div>
                                                            <p
                                                                id="2_462"
                                                                className="Pixso-paragraph-2_462 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {`已掌握 ${mastered}`}
                                                            </p>
                                                        </div>
                                                        <div
                                                            id="2_463"
                                                            className="Pixso-frame-2_463 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <div
                                                                id="2_464"
                                                                className="Pixso-frame-2_464 pixso-relative-no-shrink"
                                                            ></div>
                                                            <p
                                                                id="2_465"
                                                                className="Pixso-paragraph-2_465 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {`进行中 ${inProgress}`}
                                                            </p>
                                                        </div>
                                                        <div
                                                            id="2_466"
                                                            className="Pixso-frame-2_466 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                        >
                                                            <div
                                                                id="2_467"
                                                                className="Pixso-frame-2_467 pixso-relative-no-shrink"
                                                            ></div>
                                                            <p
                                                                id="2_468"
                                                                className="Pixso-paragraph-2_468 pixso-relative-auto-size pixso-flex-shrink-0"
                                                            >
                                                                {`未掌握 ${notMastered}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_469"
                                                    className="Pixso-frame-2_469 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                >
                                                    <div
                                                        id="2_470"
                                                        className="Pixso-vector-2_470 pixso-relative-no-shrink"
                                                    ></div>
                                                    <p
                                                        id="2_474"
                                                        className="Pixso-paragraph-2_474 pixso-relative-auto-size pixso-flex-shrink-0"
                                                    >
                                                        {unlockHint}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_475"
                                    className="Pixso-frame-2_475 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_475 pixso-relative-flex">
                                        <div
                                            id="2_476"
                                            className="Pixso-frame-2_476 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_476 pixso-relative-flex">
                                                <p
                                                    id="2_477"
                                                    className="Pixso-paragraph-2_477 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"本月学习进度"}
                                                </p>
                                                <p
                                                    id="2_478"
                                                    className="Pixso-paragraph-2_478 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {`${progress}%`}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_479"
                                            className="Pixso-frame-2_479 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_479 pixso-relative-flex">
                                                <div
                                                    id="2_480"
                                                    className="Pixso-frame-2_480 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {points && points.length > 0 && (
                        <div className="Pixso-frame-2_438 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height">
                            <div className="frame-content-2_438 pixso-relative-flex">
                                <div
                                    onClick={() => setPtsOpen((v) => !v)}
                                    className="Pixso-frame-2_439 pixso-relative-no-shrink pixso-flex-auto-height"
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="frame-content-2_439 pixso-relative-flex">
                                        <p className="Pixso-paragraph-2_440 pixso-relative-auto-size pixso-flex-shrink-0">
                                            {"知识点清单"}
                                        </p>
                                        <p className="Pixso-paragraph-2_446 pixso-relative-auto-size pixso-flex-shrink-0">
                                            {`${points.length} 个 · ${layerText}`}
                                        </p>
                                    </div>
                                </div>
                                {ptsOpen && (
                                <>
                                    {pointRows.slice(0, ptLimit).map((r, i) =>
                                        r.kind === "head" ? (
                                            <div
                                                key={`L${r.layer}`}
                                                className="frame-content-2_439 pixso-relative-flex"
                                            >
                                                <p className="Pixso-paragraph-2_482 pixso-relative-auto-size pixso-flex-shrink-0">
                                                    {`L${r.layer}`}
                                                </p>
                                                <p className="Pixso-paragraph-2_483 pixso-relative-auto-size pixso-flex-shrink-0">
                                                    {`${r.count} 个`}
                                                </p>
                                            </div>
                                        ) : (
                                            <div
                                                key={`P${i}`}
                                                onClick={() => onPoint?.(r.conceptId)}
                                                style={{ cursor: "pointer" }}
                                                className="frame-content-2_439 pixso-relative-flex"
                                            >
                                                <p className="Pixso-paragraph-2_492 pixso-relative-auto-size">{r.name}</p>
                                                <span
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: dotColor(r.masteryLevel),
                                                    }}
                                                />
                                            </div>
                                        ),
                                    )}
                                    <div ref={pointSentinel} />
                                </>
                                )}
                            </div>
                        </div>
                        )}
                        <div
                            id="2_481"
                            className="Pixso-frame-2_481 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_481 pixso-relative-flex">
                                <p
                                    id="2_482"
                                    className="Pixso-paragraph-2_482 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"今日任务"}
                                </p>
                                <p
                                    id="2_483"
                                    className="Pixso-paragraph-2_483 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {taskSummary}
                                </p>
                            </div>
                        </div>
                        {/* 顶部切换：复习 / 学习（点击切换下方任务栏） */}
                        <div style={{ display: "flex", gap: 8, width: "100%" }}>
                            {([["review", "复习"], ["new", "学习"]] as const).map(([k, label]) => (
                                <div
                                    key={k}
                                    onClick={() => setTaskTab(k)}
                                    style={{
                                        flex: 1,
                                        textAlign: "center",
                                        padding: "8px 0",
                                        borderRadius: 999,
                                        background:
                                            taskTab === k
                                                ? "var(--color-brand-purple)"
                                                : "var(--color-bg-card)",
                                        color:
                                            taskTab === k
                                                ? "#fff"
                                                : "var(--color-text-secondary)",
                                        boxShadow:
                                            taskTab === k
                                                ? "0 6px 16px rgba(108, 92, 231, 0.35)"
                                                : "none",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    {`${label} ${k === "review" ? reviewTasks.length : newTasks.length}`}
                                </div>
                            ))}
                        </div>
                        {shownActive.map((t) => (
                            <TaskCard key={t.id} t={t} onLesson={onLesson} onStartTask={onStartTask} />
                        ))}
                        {shownActive.length === 0 && (
                            <p
                                style={{
                                    width: "100%",
                                    textAlign: "center",
                                    fontSize: 13,
                                    color: "var(--color-text-secondary)",
                                    padding: "14px 0",
                                }}
                            >
                                这一栏今天还没有任务
                            </p>
                        )}
                        <div ref={taskSentinel} />
                        <div
                            id="2_537"
                            className="Pixso-frame-2_537 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_537 pixso-relative-flex">
                                <div
                                    id="2_538"
                                    className="Pixso-frame-2_538 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_538 pixso-relative-flex">
                                        <div
                                            id="2_539"
                                            className="Pixso-vector-2_539 pixso-relative-no-shrink"
                                        ></div>
                                        <p
                                            id="2_543"
                                            className="Pixso-paragraph-2_543 pixso-position-relative pixso-h-auto"
                                        >
                                            {debtText}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_544"
                                    className="Pixso-vector-2_544 pixso-relative-no-shrink"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60 }}
                    id="2_546"
                    className="Pixso-frame-2_546 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_546 pixso-relative-flex">
                        <div
                            id="2_547"
                            className="stroke-wrapper-2_547 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_547 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_547"></div>
                            <div className="Pixso-frame-2_547-content-layer">
                                <div className="frame-content-2_547 pixso-relative-flex">
                                    <div
                                        onClick={() => navigate("/tasks")}
                                        id="2_548"
                                        className="Pixso-frame-2_548 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_548 pixso-relative-flex">
                                            <div
                                                id="2_549"
                                                className="Pixso-frame-2_549 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_549 pixso-relative-flex">
                                                    <div
                                                        id="2_550"
                                                        className="Pixso-vector-2_550 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_553"
                                                className="Pixso-paragraph-2_553 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"首页"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/practice")}
                                        id="2_554"
                                        className="Pixso-frame-2_554 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_554 pixso-relative-flex">
                                            <div
                                                id="2_555"
                                                className="Pixso-frame-2_555 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_555 pixso-relative-flex">
                                                    <div
                                                        id="2_556"
                                                        className="Pixso-vector-2_556 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_559"
                                                className="Pixso-paragraph-2_559 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"练习"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/interview")}
                                        id="2_560"
                                        className="Pixso-frame-2_560 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_560 pixso-relative-flex">
                                            <div
                                                id="2_561"
                                                className="Pixso-frame-2_561 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_561 pixso-relative-flex">
                                                    <div
                                                        id="2_562"
                                                        className="Pixso-frame-2_562 pixso-relative-no-shrink"
                                                    >
                                                        <div
                                                            id="2_563"
                                                            className="Pixso-vector-2_563"
                                                        ></div>
                                                        <div
                                                            id="2_564"
                                                            className="stroke-wrapper-2_564"
                                                        >
                                                            <div className="Pixso-rectangle-2_564 pixso-position-relative"></div>
                                                            <div className="stroke-2_564"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_565"
                                                className="Pixso-paragraph-2_565 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"面试"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/sediment")}
                                        id="2_566"
                                        className="Pixso-frame-2_566 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_566 pixso-relative-flex">
                                            <div
                                                id="2_567"
                                                className="Pixso-frame-2_567 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_567 pixso-relative-flex">
                                                    <div
                                                        id="2_568"
                                                        className="Pixso-vector-2_568 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_572"
                                                className="Pixso-paragraph-2_572 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"沉淀"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/me")}
                                        id="2_573"
                                        className="Pixso-frame-2_573 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_573 pixso-relative-flex">
                                            <div
                                                id="2_574"
                                                className="Pixso-frame-2_574 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_574 pixso-relative-flex">
                                                    <div
                                                        id="2_575"
                                                        className="Pixso-vector-2_575 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_578"
                                                className="Pixso-paragraph-2_578 pixso-relative-auto-size pixso-flex-shrink-0"
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
export default Frame2394;
