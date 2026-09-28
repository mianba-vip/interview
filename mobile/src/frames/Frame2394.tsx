import "./Frame2394.css";
const statusText = (s: string) => (s === 'READY' ? '已就绪 · 秒开' : s === 'PENDING' ? '生成中…' : s === 'DONE' ? '已完成 ✓' : '');

export interface HomeFrameProps {
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
  tasks: { id: number; kind: 'REVIEW' | 'NEW'; title: string; status: string }[];
  debtText: string;
  onTaskClick?: (id: number) => void;
}

const Frame2394 = ({ name, streakDays, direction, mastered, inProgress, notMastered, total, unlockHint, progress, taskSummary, tasks, debtText, onTaskClick }: HomeFrameProps) => {
    return (
        <div className="scroll-container">
            <div
                id="2_394"
                className="Pixso-frame-2_394 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_415"
                    className="Pixso-frame-2_415 pixso-relative-no-shrink pixso-flex-auto-height"
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
                                            {"晚上好，" + name}
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
                                                {t.kind === 'REVIEW' ? '复习' : '新学'}
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
                                >
                                    {t.title}
                                </p>
                                <div
                                    id="2_493"
                                    className="Pixso-frame-2_493 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_493 pixso-relative-flex">
                                        <p
                                            id="2_494"
                                            className="Pixso-paragraph-2_494 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {t.status === 'READY' ? '开始练习' : t.status === 'PENDING' ? '生成中…' : '已完成'}
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
            </div>
        </div>
    );
};
export default Frame2394;
