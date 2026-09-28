import "@/styles/Frame2394.css";
import { useNavigate } from "react-router-dom";

/** 任务状态位文案（卡片右侧）。 */
const statusText = (s: string) =>
    s === "READY" ? "已就绪 · 秒开" : s === "PENDING" ? "生成中…" : s === "DONE" ? "已完成 ✓" : "";
/** 任务卡按钮文案。 */
const btnText = (s: string) =>
    s === "READY" ? "开始练习" : s === "PENDING" ? "生成中…" : "已完成";

export interface HomeTaskItem {
    id: number;
    kind: "REVIEW" | "NEW";
    title: string;
    status: string;
    conceptId: number;
    subPoint: string | null;
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
    onTaskClick?: (id: number) => void;
    onStart?: () => void;
    onLesson?: (conceptId: number, subPoint: string | null) => void;
}

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
    onTaskClick,
    onStart,
    onLesson,
}: Frame2394Props) => {
    const navigate = useNavigate();
    const greet = new Date().getHours() < 12 ? "早上好" : "晚上好";
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
                        {tasks.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => onTaskClick?.(t.id)}
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
                                        onLesson?.(t.conceptId, t.subPoint);
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
                                        onStart?.();
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
                        ))}
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
