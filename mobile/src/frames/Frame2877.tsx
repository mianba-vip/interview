import "./Frame2877.css";
export interface ReviewFrameRow { point: string; verdict: 'HIT' | 'PARTIAL' | 'MISS'; verdictLabel: string }
export interface ReviewFrameProps {
  score: number;
  grade: string;
  timeText: string;
  attemptText: string;
  rows: ReviewFrameRow[];
  weak: string[];
  rv: { mnemonic: string | null; approach: string | null };
  onBack?: () => void;
  onCard?: () => void;
}
const pillStyle = (v: string) =>
  v === 'HIT'
    ? { background: 'var(--mint-soft)', color: '#1d8a82' }
    : v === 'PARTIAL'
      ? { background: 'var(--lemon-soft)', color: '#8a6d0b' }
      : { background: 'var(--coral-soft)', color: '#b23b3b' };

const Frame2877 = ({ score, grade, timeText, attemptText, rows, weak, rv, onBack, onCard }: ReviewFrameProps) => {
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
                                        {String(Math.round(score))}
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
                                <div
                                    id="2_908"
                                    className="Pixso-frame-2_908 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_908 pixso-relative-flex">
                                        <p
                                            id="2_909"
                                            className="Pixso-paragraph-2_909 pixso-position-relative pixso-h-auto"
                                        >
                                            {rows[0].point}
                                        </p>
                                        <div
 style={pillStyle(rows[0].verdict)}
                                            id="2_910"
                                            className="Pixso-frame-2_910 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_911"
                                                className="Pixso-paragraph-2_911 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {rows[0].verdictLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_912"
                                    className="Pixso-frame-2_912 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_912 pixso-relative-flex">
                                        <p
                                            id="2_913"
                                            className="Pixso-paragraph-2_913 pixso-position-relative pixso-h-auto"
                                        >
                                            {rows[1].point}
                                        </p>
                                        <div
 style={pillStyle(rows[1].verdict)}
                                            id="2_914"
                                            className="Pixso-frame-2_914 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_915"
                                                className="Pixso-paragraph-2_915 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {rows[1].verdictLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_916"
                                    className="Pixso-frame-2_916 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_916 pixso-relative-flex">
                                        <p
                                            id="2_917"
                                            className="Pixso-paragraph-2_917 pixso-position-relative pixso-h-auto"
                                        >
                                                {rows[2].point}
                                        </p>
                                        <div
 style={pillStyle(rows[2].verdict)}
                                            id="2_918"
                                            className="Pixso-frame-2_918 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_919"
                                                className="Pixso-paragraph-2_919 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {rows[2].verdictLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_920"
                                    className="Pixso-frame-2_920 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_920 pixso-relative-flex">
                                        <p
                                            id="2_921"
                                            className="Pixso-paragraph-2_921 pixso-position-relative pixso-h-auto"
                                        >
                                            {rows[3].point}
                                        </p>
                                        <div
 style={pillStyle(rows[3].verdict)}
                                            id="2_922"
                                            className="Pixso-frame-2_922 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_923"
                                                className="Pixso-paragraph-2_923 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {rows[3].verdictLabel}
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
{weak.map((w, i) => (
  <div key={i} className="Pixso-frame-2_935 pixso-relative-no-shrink pixso-flex-auto-height">
    <div className="frame-content-2_935 pixso-relative-flex">
      <div className="Pixso-frame-2_936 pixso-relative-no-shrink"></div>
      <p className="Pixso-paragraph-2_937 pixso-position-relative pixso-h-auto">{w}</p>
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
                                    <p
                                        id="2_949_0"
                                        className="Pixso-paragraph-2_949_0 pixso-relative-no-shrink"
                                    >
                                        <span
                                            id="2_949_0_1"
                                            className="Pixso-span-2_949_0_1 pixso-relative-no-shrink"
                                        >
                                                {(rv.approach?.split('\n')[0]) ?? ''}
                                        </span>
                                    </p>
                                    <p
                                        id="2_949_1"
                                        className="Pixso-paragraph-2_949_1 pixso-relative-no-shrink"
                                    >
                                        <span
                                            id="2_949_1_1"
                                            className="Pixso-span-2_949_1_1 pixso-relative-no-shrink"
                                        >
                                                {(rv.approach?.split('\n')[1]) ?? ''}
                                        </span>
                                    </p>
                                    <p
                                        id="2_949_2"
                                        className="Pixso-paragraph-2_949_2 pixso-relative-no-shrink"
                                    >
                                        <span
                                            id="2_949_2_1"
                                            className="Pixso-span-2_949_2_1 pixso-relative-no-shrink"
                                        >
                                                {(rv.approach?.split('\n')[2]) ?? ''}
                                        </span>
                                    </p>
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
                                            {'记忆口诀'}
                                        </p>
                                    </div>
                                </div>
                                <p
                                    id="2_956"
                                    className="Pixso-paragraph-2_956 pixso-relative-no-shrink pixso-h-auto"
                                >
                                        {rv.mnemonic ?? ''}
                                </p>
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
                        onClick={onCard}
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
                                        {"沉淀为知识卡"}
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
