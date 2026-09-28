import "@/styles/Frame21051.css";
import { useNavigate } from "react-router-dom";

/** 历史场次卡片：由 /drill/history/page 的 RunSummaryView 映射而来。 */
export interface HistoryItem {
    runId: number;
    title: string;
    dateText: string;
    scoreText: string;
    gradeText: string;
    /** 徽标语气：good=薄荷（达标）/ bad=珊瑚（未达标）/ plain=灰（未结算） */
    tone: "good" | "bad" | "plain";
}

export interface Frame21051Props {
    /** 头部统计「已面 N 场 · 平均 X 分」 */
    summaryText: string;
    /** 历史区计数「全部 N 场」 */
    totalText: string;
    /** 历史场次（服务端最多取 3 条；空则渲染兜底文案） */
    runs: HistoryItem[];
    /** 开场进行中 */
    busy: boolean;
    /** 开场失败提示 */
    error?: string;
    /** 开始模拟面试（卡片与「立即开始」共用） */
    onStart: () => void;
}

const Frame21051 = (props: Frame21051Props) => {
    const { summaryText, totalText, runs, busy, error, onStart } = props;
    const navigate = useNavigate();
    return (
        <div className="scroll-container">
            <div
                id="2_1051"
                className="Pixso-frame-2_1051 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_1052"
                    className="Pixso-frame-2_1052 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_1052 pixso-relative-flex">
                        <p
                            id="2_1053"
                            className="Pixso-paragraph-2_1053 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_1054"
                            className="Pixso-frame-2_1054 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_1055"
                                className="Pixso-vector-2_1055 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1061"
                                className="Pixso-vector-2_1061 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1066"
                                className="Pixso-frame-2_1066 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_1067"
                                    className="Pixso-vector-2_1067"
                                ></div>
                                <div
                                    id="2_1068"
                                    className="Pixso-vector-2_1068"
                                ></div>
                                <div
                                    id="2_1069"
                                    className="Pixso-vector-2_1069"
                                ></div>
                                <div
                                    id="2_1070"
                                    className="Pixso-vector-2_1070"
                                ></div>
                                <div
                                    id="2_1071"
                                    className="stroke-wrapper-2_1071"
                                >
                                    <div className="Pixso-rectangle-2_1071 pixso-position-relative"></div>
                                    <div className="stroke-2_1071"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_1072"
                    className="Pixso-frame-2_1072 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1072 pixso-relative-flex">
                        <div
                            id="2_1073"
                            className="Pixso-frame-2_1073 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1073 pixso-relative-flex">
                                <p
                                    id="2_1074"
                                    className="Pixso-paragraph-2_1074 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"模拟面试"}
                                </p>
                                <p
                                    id="2_1075"
                                    className="Pixso-paragraph-2_1075 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {summaryText}
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={onStart}
                            id="2_1076"
                            className="Pixso-frame-2_1076 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1076 pixso-relative-flex">
                                <div
                                    id="2_1077"
                                    className="Pixso-frame-2_1077 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1077 pixso-relative-flex">
                                        <div
                                            id="2_1078"
                                            className="Pixso-frame-2_1078 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1078 pixso-relative-flex">
                                                <div
                                                    id="2_1079"
                                                    className="Pixso-frame-2_1079 pixso-relative-no-shrink"
                                                >
                                                    <div
                                                        id="2_1080"
                                                        className="Pixso-vector-2_1080"
                                                    ></div>
                                                    <div
                                                        id="2_1081"
                                                        className="stroke-wrapper-2_1081"
                                                    >
                                                        <div className="Pixso-rectangle-2_1081 pixso-position-relative"></div>
                                                        <div className="stroke-2_1081"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p
                                            id="2_1082"
                                            className="Pixso-paragraph-2_1082 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"AI 面试官 · 全程追问"}
                                        </p>
                                    </div>
                                </div>
                                <p
                                    id="2_1083"
                                    className="Pixso-paragraph-2_1083 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"开始模拟面试"}
                                </p>
                                <p
                                    id="2_1084"
                                    className="Pixso-paragraph-2_1084 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    {
                                        "按真实面试节奏连问 5–8 题，结束后立刻给出评级与结算报告。"
                                    }
                                </p>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStart();
                                    }}
                                    id="2_1085"
                                    className="Pixso-frame-2_1085 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1085 pixso-relative-flex">
                                        <p
                                            id="2_1086"
                                            className="Pixso-paragraph-2_1086 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {busy ? "准备中…" : "立即开始"}
                                        </p>
                                        <div
                                            id="2_1087"
                                            className="Pixso-vector-2_1087 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                {error ? (
                                    <p
                                        className="Pixso-paragraph-2_1084 pixso-relative-no-shrink pixso-h-auto"
                                        style={{ opacity: 1 }}
                                    >
                                        {`⚠ ${error}`}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div
                            id="2_1089"
                            className="Pixso-frame-2_1089 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1089 pixso-relative-flex">
                                <div
                                    id="2_1090"
                                    className="Pixso-frame-2_1090 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1090 pixso-relative-flex">
                                        <p
                                            id="2_1091"
                                            className="Pixso-paragraph-2_1091 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"面试方向"}
                                        </p>
                                        <div
                                            id="2_1092"
                                            className="Pixso-frame-2_1092 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_1092 pixso-relative-flex">
                                                <div
                                                    id="2_1093"
                                                    className="Pixso-frame-2_1093 effect-effectcardshadow-2_19 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1093 pixso-relative-flex">
                                                        <p
                                                            id="2_1094"
                                                            className="Pixso-paragraph-2_1094 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"Go 后端"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_1095"
                                                    className="Pixso-frame-2_1095 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1095 pixso-relative-flex">
                                                        <p
                                                            id="2_1096"
                                                            className="Pixso-paragraph-2_1096 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"Java 后端"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_1097"
                                                    className="Pixso-frame-2_1097 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1097 pixso-relative-flex">
                                                        <p
                                                            id="2_1098"
                                                            className="Pixso-paragraph-2_1098 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"前端"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1099"
                                    className="Pixso-frame-2_1099 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1099 pixso-relative-flex">
                                        <p
                                            id="2_1100"
                                            className="Pixso-paragraph-2_1100 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"难度"}
                                        </p>
                                        <div
                                            id="2_1101"
                                            className="Pixso-frame-2_1101 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_1101 pixso-relative-flex">
                                                <div
                                                    id="2_1102"
                                                    className="Pixso-frame-2_1102 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1102 pixso-relative-flex">
                                                        <p
                                                            id="2_1103"
                                                            className="Pixso-paragraph-2_1103 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"简单"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_1104"
                                                    className="Pixso-frame-2_1104 effect-effectcardshadow-2_19 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1104 pixso-relative-flex">
                                                        <p
                                                            id="2_1105"
                                                            className="Pixso-paragraph-2_1105 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"中等"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_1106"
                                                    className="Pixso-frame-2_1106 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1106 pixso-relative-flex">
                                                        <p
                                                            id="2_1107"
                                                            className="Pixso-paragraph-2_1107 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"困难"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1108"
                                    className="Pixso-frame-2_1108 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1108 pixso-relative-flex">
                                        <p
                                            id="2_1109"
                                            className="Pixso-paragraph-2_1109 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"时长"}
                                        </p>
                                        <div
                                            id="2_1110"
                                            className="Pixso-frame-2_1110 pixso-relative-no-shrink pixso-flex-auto-height"
                                        >
                                            <div className="frame-content-2_1110 pixso-relative-flex">
                                                <div
                                                    id="2_1111"
                                                    className="Pixso-frame-2_1111 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1111 pixso-relative-flex">
                                                        <p
                                                            id="2_1112"
                                                            className="Pixso-paragraph-2_1112 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"10 分钟"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_1113"
                                                    className="Pixso-frame-2_1113 effect-effectcardshadow-2_19 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1113 pixso-relative-flex">
                                                        <p
                                                            id="2_1114"
                                                            className="Pixso-paragraph-2_1114 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"15 分钟"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    id="2_1115"
                                                    className="Pixso-frame-2_1115 pixso-relative-flex"
                                                >
                                                    <div className="frame-content-2_1115 pixso-relative-flex">
                                                        <p
                                                            id="2_1116"
                                                            className="Pixso-paragraph-2_1116 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {"30 分钟"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_1117"
                            className="Pixso-frame-2_1117 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1117 pixso-relative-flex">
                                <p
                                    id="2_1118"
                                    className="Pixso-paragraph-2_1118 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"历史场次"}
                                </p>
                                <p
                                    id="2_1119"
                                    className="Pixso-paragraph-2_1119 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {totalText}
                                </p>
                            </div>
                        </div>
                        {runs.length > 0 ? (
                            runs.map((it) => (
                                <div
                                    onClick={() => navigate(`/review/${it.runId}`)}
                                    key={it.runId}
                                    style={{ cursor: "pointer" }}
                                    className="Pixso-frame-2_1120 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1120 pixso-relative-flex">
                                        <div
                                            className="Pixso-frame-2_1121 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1121 pixso-relative-flex">
                                                <p
                                                    className="Pixso-paragraph-2_1122 pixso-relative-no-shrink pixso-h-auto"
                                                    style={{
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {it.title}
                                                </p>
                                                <div
                                                    className="Pixso-frame-2_1123 pixso-relative-no-shrink pixso-flex-auto-height"
                                                >
                                                    <div className="frame-content-2_1123 pixso-relative-flex">
                                                        <p
                                                            className="Pixso-paragraph-2_1124 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {it.dateText}
                                                        </p>
                                                        <p
                                                            className="Pixso-paragraph-2_1125 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        >
                                                            {it.scoreText}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="Pixso-frame-2_1126 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                className="stroke-wrapper-2_1127 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                            >
                                                <div
                                                    className="Pixso-frame-2_1127 pixso-relative-no-shrink pixso-flex"
                                                    style={
                                                        it.tone === "good"
                                                            ? undefined
                                                            : { backgroundColor: "var(--color-bg-card)" }
                                                    }
                                                >
                                                    <p
                                                        className="Pixso-paragraph-2_1128 pixso-relative-auto-size pixso-flex-shrink-0"
                                                        style={
                                                            it.tone === "good"
                                                                ? undefined
                                                                : {
                                                                      color:
                                                                          it.tone === "bad"
                                                                              ? "var(--color-brand-coral)"
                                                                              : "var(--color-text-placeholder)",
                                                                  }
                                                        }
                                                    >
                                                        {it.gradeText}
                                                    </p>
                                                </div>
                                                <div
                                                    className="stroke-2_1127"
                                                    style={
                                                        it.tone === "good"
                                                            ? undefined
                                                            : {
                                                                  borderColor:
                                                                      it.tone === "bad"
                                                                          ? "var(--color-brand-coral)"
                                                                          : "var(--color-border-base)",
                                                              }
                                                    }
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="Pixso-paragraph-2_1124 pixso-relative-auto-size pixso-flex-shrink-0">
                                {"暂无历史场次，先开一场模拟面试吧"}
                            </p>
                        )}
                    </div>
                </div>
                <div
                    id="2_1147"
                    className="Pixso-frame-2_1147 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1147 pixso-relative-flex">
                        <div
                            id="2_1148"
                            className="stroke-wrapper-2_1148 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_1148 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_1148"></div>
                            <div className="Pixso-frame-2_1148-content-layer">
                                <div className="frame-content-2_1148 pixso-relative-flex">
                                    <div
                                        onClick={() => navigate("/tasks")}
                                        id="2_1149"
                                        className="Pixso-frame-2_1149 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1149 pixso-relative-flex">
                                            <div
                                                id="2_1150"
                                                className="Pixso-frame-2_1150 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1150 pixso-relative-flex">
                                                    <div
                                                        id="2_1151"
                                                        className="Pixso-vector-2_1151 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1154"
                                                className="Pixso-paragraph-2_1154 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"首页"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/practice")}
                                        id="2_1155"
                                        className="Pixso-frame-2_1155 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1155 pixso-relative-flex">
                                            <div
                                                id="2_1156"
                                                className="Pixso-frame-2_1156 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1156 pixso-relative-flex">
                                                    <div
                                                        id="2_1157"
                                                        className="Pixso-vector-2_1157 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1160"
                                                className="Pixso-paragraph-2_1160 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"练习"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/interview")}
                                        id="2_1161"
                                        className="Pixso-frame-2_1161 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1161 pixso-relative-flex">
                                            <div
                                                id="2_1162"
                                                className="Pixso-frame-2_1162 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1162 pixso-relative-flex">
                                                    <div
                                                        id="2_1163"
                                                        className="Pixso-frame-2_1163 pixso-relative-no-shrink"
                                                    >
                                                        <div
                                                            id="2_1164"
                                                            className="Pixso-vector-2_1164"
                                                        ></div>
                                                        <div
                                                            id="2_1165"
                                                            className="stroke-wrapper-2_1165"
                                                        >
                                                            <div className="Pixso-rectangle-2_1165 pixso-position-relative"></div>
                                                            <div className="stroke-2_1165"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1166"
                                                className="Pixso-paragraph-2_1166 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"面试"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/sediment")}
                                        id="2_1167"
                                        className="Pixso-frame-2_1167 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1167 pixso-relative-flex">
                                            <div
                                                id="2_1168"
                                                className="Pixso-frame-2_1168 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1168 pixso-relative-flex">
                                                    <div
                                                        id="2_1169"
                                                        className="Pixso-vector-2_1169 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1173"
                                                className="Pixso-paragraph-2_1173 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"沉淀"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/me")}
                                        id="2_1174"
                                        className="Pixso-frame-2_1174 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1174 pixso-relative-flex">
                                            <div
                                                id="2_1175"
                                                className="Pixso-frame-2_1175 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1175 pixso-relative-flex">
                                                    <div
                                                        id="2_1176"
                                                        className="Pixso-vector-2_1176 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1179"
                                                className="Pixso-paragraph-2_1179 pixso-relative-auto-size pixso-flex-shrink-0"
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
export default Frame21051;
