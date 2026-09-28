import "@/styles/Frame21242.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CorpusView, KnowledgeCardView } from "@/api/types";

/** 沉淀：知识卡 / 到期复习 / 资料库三章节——视觉 = Pixso 模板，列表数据由容器注入。 */
export interface SedimentViewProps {
    cards: KnowledgeCardView[];
    due: KnowledgeCardView[];
    corpus: CorpusView[];
}

type Seg = "cards" | "due" | "corpus";

/** 标签胶囊配色轮换：模板里 5 种胶囊配色循环，颜色与模板保持一致 */
const TAG_STYLES = [
    { frame: "Pixso-frame-2_1284 pixso-relative-flex-auto-size pixso-flex-shrink-0", text: "Pixso-paragraph-2_1285 pixso-relative-auto-size pixso-flex-shrink-0" },
    { frame: "Pixso-frame-2_1286 pixso-relative-flex-auto-size pixso-flex-shrink-0", text: "Pixso-paragraph-2_1287 pixso-relative-auto-size pixso-flex-shrink-0" },
    { frame: "Pixso-frame-2_1288 pixso-relative-flex-auto-size pixso-flex-shrink-0", text: "Pixso-paragraph-2_1289 pixso-relative-auto-size pixso-flex-shrink-0" },
    { frame: "Pixso-frame-2_1299 pixso-relative-flex-auto-size pixso-flex-shrink-0", text: "Pixso-paragraph-2_1300 pixso-relative-auto-size pixso-flex-shrink-0" },
    { frame: "Pixso-frame-2_1312 pixso-relative-flex-auto-size pixso-flex-shrink-0", text: "Pixso-paragraph-2_1313 pixso-relative-auto-size pixso-flex-shrink-0" },
];

/** 标签串拆成胶囊："Go,时区" → ["Go", "时区"] */
const tagsOf = (c: KnowledgeCardView): string[] =>
    c.tags ? c.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean) : [];

/** 本地日期 YYYY-MM-DD */
const dayOf = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 资料索引态：READY → 已索引，其余原样 */
const indexLabel = (c: CorpusView): string => (c.indexState === "READY" ? "已索引" : c.indexState);

/** 到期文案：由 dueAt 推导（今天 / 明天 / N 天后）；复习次数后端未提供 → 兜底「待复习」 */
function dueText(dueAt: string | null): string {
    const day = dueAt ? dueAt.slice(0, 10) : "";
    const d = new Date(`${day}T00:00:00`);
    if (!day || Number.isNaN(d.getTime())) return "待复习";
    const diff = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    const when = diff <= 0 ? "今天到期" : diff === 1 ? "明天到期" : `${diff} 天后到期`;
    return `${when} · 待复习`;
}

const Frame21242 = ({ cards, due, corpus }: SedimentViewProps) => {
    const navigate = useNavigate();
    const [seg, setSeg] = useState<Seg>("cards");
    const todayCount = due.filter((c) => c.dueAt?.slice(0, 10) === dayOf(new Date())).length;
    /** 分段点击：切换激活态并滚到对应章节 */
    const jump = (s: Seg) => {
        setSeg(s);
        document.getElementById(`sec-${s}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    return (
        <div className="scroll-container">
            <div
                id="2_1242"
                className="Pixso-frame-2_1242 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_1243"
                    className="Pixso-frame-2_1243 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_1243 pixso-relative-flex">
                        <p
                            id="2_1244"
                            className="Pixso-paragraph-2_1244 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_1245"
                            className="Pixso-frame-2_1245 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_1246"
                                className="Pixso-vector-2_1246 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1252"
                                className="Pixso-vector-2_1252 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1257"
                                className="Pixso-frame-2_1257 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_1258"
                                    className="Pixso-vector-2_1258"
                                ></div>
                                <div
                                    id="2_1259"
                                    className="Pixso-vector-2_1259"
                                ></div>
                                <div
                                    id="2_1260"
                                    className="Pixso-vector-2_1260"
                                ></div>
                                <div
                                    id="2_1261"
                                    className="Pixso-vector-2_1261"
                                ></div>
                                <div
                                    id="2_1262"
                                    className="stroke-wrapper-2_1262"
                                >
                                    <div className="Pixso-rectangle-2_1262 pixso-position-relative"></div>
                                    <div className="stroke-2_1262"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_1263"
                    className="Pixso-frame-2_1263 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1263 pixso-relative-flex">
                        <div
                            id="2_1264"
                            className="Pixso-frame-2_1264 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1264 pixso-relative-flex">
                                <p
                                    id="2_1265"
                                    className="Pixso-paragraph-2_1265 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"沉淀"}
                                </p>
                                <p
                                    id="2_1266"
                                    className="Pixso-paragraph-2_1266 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {`${cards.length} 张知识卡 · ${due.length} 张待复习`}
                                </p>
                            </div>
                        </div>
                        <div
                            id="2_1267"
                            className="Pixso-frame-2_1267 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_1267 pixso-relative-flex">
                                <div
                                    id="2_1268"
                                    className="Pixso-vector-2_1268 pixso-relative-no-shrink"
                                ></div>
                                <p
                                    id="2_1271"
                                    className="Pixso-paragraph-2_1271 pixso-position-relative pixso-h-auto"
                                >
                                    {"搜索知识卡 / 资料 / 概念…"}
                                </p>
                            </div>
                        </div>
                        <div
                            id="2_1272"
                            className="Pixso-frame-2_1272 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1272 pixso-relative-flex">
                                <div
                                    onClick={() => jump("cards")}
                                    style={{ outline: seg === "cards" ? "2px solid var(--color-brand-purple)" : "none", outlineOffset: 2 }}
                                    id="2_1273"
                                    className="Pixso-frame-2_1273 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <p
                                        id="2_1274"
                                        className="Pixso-paragraph-2_1274 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"知识卡"}
                                    </p>
                                </div>
                                <div
                                    onClick={() => jump("due")}
                                    style={{ outline: seg === "due" ? "2px solid var(--color-brand-purple)" : "none", outlineOffset: 2 }}
                                    id="2_1275"
                                    className="stroke-wrapper-2_1275 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_1275 pixso-relative-no-shrink pixso-flex">
                                        <p
                                            id="2_1276"
                                            className="Pixso-paragraph-2_1276 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`到期复习 ${due.length}`}
                                        </p>
                                    </div>
                                    <div className="stroke-2_1275"></div>
                                </div>
                                <div
                                    onClick={() => jump("corpus")}
                                    style={{ outline: seg === "corpus" ? "2px solid var(--color-brand-purple)" : "none", outlineOffset: 2 }}
                                    id="2_1277"
                                    className="stroke-wrapper-2_1277 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div className="Pixso-frame-2_1277 pixso-relative-no-shrink pixso-flex">
                                        <p
                                            id="2_1278"
                                            className="Pixso-paragraph-2_1278 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"资料库"}
                                        </p>
                                    </div>
                                    <div className="stroke-2_1277"></div>
                                </div>
                            </div>
                        </div>
                        {cards.map((c, i) => (
                        <div
                            key={c.id}
                            id={i === 0 ? "sec-cards" : undefined}
                            className="Pixso-frame-2_1279 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1279 pixso-relative-flex">
                                <p
                                    id="2_1280"
                                    className="Pixso-paragraph-2_1280 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    {c.question}
                                </p>
                                <p
                                    id="2_1281"
                                    className="Pixso-paragraph-2_1281 pixso-relative-no-shrink pixso-h-auto"
                                >
                                    {c.answer ?? ""}
                                </p>
                                <div
                                    id="2_1282"
                                    className="Pixso-frame-2_1282 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1282 pixso-relative-flex">
                                        <div
                                            id="2_1283"
                                            className="Pixso-frame-2_1283 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            {tagsOf(c).map((t, ti) => (
                                            <div
                                                key={t}
                                                className={TAG_STYLES[ti % TAG_STYLES.length].frame}
                                            >
                                                <p
                                                    className={TAG_STYLES[ti % TAG_STYLES.length].text}
                                                >
                                                    {`#${t}`}
                                                </p>
                                            </div>
                                            ))}
                                        </div>
                                        <div
                                            id="2_1290"
                                            className="Pixso-frame-2_1290 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_1291"
                                                className="Pixso-paragraph-2_1291 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"来源会话"}
                                            </p>
                                            <div
                                                id="2_1292"
                                                className="Pixso-vector-2_1292 pixso-relative-no-shrink"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                        <div
                            id="sec-due"
                            className="Pixso-frame-2_1320 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1320 pixso-relative-flex">
                                <p
                                    id="2_1321"
                                    className="Pixso-paragraph-2_1321 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"到期复习"}
                                </p>
                                <p
                                    id="2_1322"
                                    className="Pixso-paragraph-2_1322 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {`今天 ${todayCount} 张`}
                                </p>
                            </div>
                        </div>
                        {due.map((c) => (
                        <div
                            key={c.id}
                            className="Pixso-frame-2_1323 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1323 pixso-relative-flex">
                                <div
                                    id="2_1324"
                                    className="Pixso-frame-2_1324 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_1324 pixso-relative-flex">
                                        <p
                                            id="2_1325"
                                            className="Pixso-paragraph-2_1325 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {c.question}
                                        </p>
                                        <p
                                            id="2_1326"
                                            className="Pixso-paragraph-2_1326 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {dueText(c.dueAt)}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1327"
                                    className="Pixso-frame-2_1327 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <p
                                        id="2_1328"
                                        className="Pixso-paragraph-2_1328 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"复习"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        ))}
                        <div
                            id="sec-corpus"
                            className="Pixso-frame-2_1335 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1335 pixso-relative-flex">
                                <p
                                    id="2_1336"
                                    className="Pixso-paragraph-2_1336 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"资料库"}
                                </p>
                                <p
                                    id="2_1337"
                                    className="Pixso-paragraph-2_1337 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {`${corpus.length} 份资料`}
                                </p>
                            </div>
                        </div>
                        {corpus.map((f) => (
                        <div
                            key={f.id}
                            className="Pixso-frame-2_1338 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1338 pixso-relative-flex">
                                <div
                                    id="2_1339"
                                    className="Pixso-frame-2_1339 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1339 pixso-relative-flex">
                                        <div
                                            id="2_1340"
                                            className="Pixso-vector-2_1340 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1346"
                                    className="Pixso-frame-2_1346 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_1346 pixso-relative-flex">
                                        <p
                                            id="2_1347"
                                            className="Pixso-paragraph-2_1347 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {f.name}
                                        </p>
                                        <p
                                            id="2_1348"
                                            className="Pixso-paragraph-2_1348 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`${f.chunkCount} 个切块`}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1349"
                                    className="Pixso-frame-2_1349 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <p
                                        id="2_1350"
                                        className="Pixso-paragraph-2_1350 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {indexLabel(f)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        ))}
                        <div
                            onClick={() => console.warn("上传资料：暂无上传接口")}
                            id="2_1364"
                            className="stroke-wrapper-2_1364 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_1364 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_1364"></div>
                            <div className="Pixso-frame-2_1364-content-layer">
                                <div className="frame-content-2_1364 pixso-relative-flex">
                                    <div
                                        id="2_1365"
                                        className="Pixso-vector-2_1365 pixso-relative-no-shrink"
                                    ></div>
                                    <p
                                        id="2_1369"
                                        className="Pixso-paragraph-2_1369 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"上传资料（截图 / 文件）"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60 }}
                    id="2_1370"
                    className="Pixso-frame-2_1370 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1370 pixso-relative-flex">
                        <div
                            id="2_1371"
                            className="stroke-wrapper-2_1371 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_1371 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_1371"></div>
                            <div className="Pixso-frame-2_1371-content-layer">
                                <div className="frame-content-2_1371 pixso-relative-flex">
                                    <div
                                        onClick={() => navigate("/tasks")}
                                        id="2_1372"
                                        className="Pixso-frame-2_1372 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1372 pixso-relative-flex">
                                            <div
                                                id="2_1373"
                                                className="Pixso-frame-2_1373 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1373 pixso-relative-flex">
                                                    <div
                                                        id="2_1374"
                                                        className="Pixso-vector-2_1374 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1377"
                                                className="Pixso-paragraph-2_1377 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"首页"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/practice")}
                                        id="2_1378"
                                        className="Pixso-frame-2_1378 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1378 pixso-relative-flex">
                                            <div
                                                id="2_1379"
                                                className="Pixso-frame-2_1379 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1379 pixso-relative-flex">
                                                    <div
                                                        id="2_1380"
                                                        className="Pixso-vector-2_1380 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1383"
                                                className="Pixso-paragraph-2_1383 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"练习"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/interview")}
                                        id="2_1384"
                                        className="Pixso-frame-2_1384 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1384 pixso-relative-flex">
                                            <div
                                                id="2_1385"
                                                className="Pixso-frame-2_1385 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1385 pixso-relative-flex">
                                                    <div
                                                        id="2_1386"
                                                        className="Pixso-frame-2_1386 pixso-relative-no-shrink"
                                                    >
                                                        <div
                                                            id="2_1387"
                                                            className="Pixso-vector-2_1387"
                                                        ></div>
                                                        <div
                                                            id="2_1388"
                                                            className="stroke-wrapper-2_1388"
                                                        >
                                                            <div className="Pixso-rectangle-2_1388 pixso-position-relative"></div>
                                                            <div className="stroke-2_1388"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1389"
                                                className="Pixso-paragraph-2_1389 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"面试"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/sediment")}
                                        id="2_1390"
                                        className="Pixso-frame-2_1390 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1390 pixso-relative-flex">
                                            <div
                                                id="2_1391"
                                                className="Pixso-frame-2_1391 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1391 pixso-relative-flex">
                                                    <div
                                                        id="2_1392"
                                                        className="Pixso-vector-2_1392 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1396"
                                                className="Pixso-paragraph-2_1396 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"沉淀"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/me")}
                                        id="2_1397"
                                        className="Pixso-frame-2_1397 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1397 pixso-relative-flex">
                                            <div
                                                id="2_1398"
                                                className="Pixso-frame-2_1398 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1398 pixso-relative-flex">
                                                    <div
                                                        id="2_1399"
                                                        className="Pixso-vector-2_1399 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1402"
                                                className="Pixso-paragraph-2_1402 pixso-relative-auto-size pixso-flex-shrink-0"
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
export default Frame21242;
