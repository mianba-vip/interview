import "@/styles/Frame21403.css";
import { useNavigate } from "react-router-dom";

/** 我的：身份信息 / 学习统计 / 掌握度分布 / 菜单——视觉 = Pixso 模板，数据由容器注入（view 不发请求）。 */
export interface MeViewProps {
    name: string; // 昵称
    email: string; // 邮箱（昵称下方副标题位）
    joinedText: string; // 已加入 N 天
    completion: number; // 资料完成度 %
    streak: number; // 连续学习天数
    totalPractice: number; // 累计练习次数
    due: number; // 待复习张数
    total: number; // 知识点总数
    mastered: number; // 已掌握
    inProgress: number; // 进行中
    notMastered: number; // 未掌握
    skillPreview: string; // 技能画像预览句
    themeLabel: string; // 主题名
    fontLabel: string; // 字号名
    direction: string; // 学习方向
    onSettings: () => void;
    onRow: (row: string) => void;
    onLogout: () => void;
}

const Frame21403 = ({
    name,
    email,
    joinedText,
    completion,
    streak,
    totalPractice,
    due,
    total,
    mastered,
    inProgress,
    notMastered,
    skillPreview,
    themeLabel,
    fontLabel,
    direction,
    onSettings,
    onRow,
    onLogout,
}: MeViewProps) => {
    const navigate = useNavigate();
    return (
        <div className="scroll-container">
            <div
                id="2_1403"
                className="Pixso-frame-2_1403 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_1404"
                    className="Pixso-frame-2_1404 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_1404 pixso-relative-flex">
                        <p
                            id="2_1405"
                            className="Pixso-paragraph-2_1405 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_1406"
                            className="Pixso-frame-2_1406 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_1407"
                                className="Pixso-vector-2_1407 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1413"
                                className="Pixso-vector-2_1413 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1418"
                                className="Pixso-frame-2_1418 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_1419"
                                    className="Pixso-vector-2_1419"
                                ></div>
                                <div
                                    id="2_1420"
                                    className="Pixso-vector-2_1420"
                                ></div>
                                <div
                                    id="2_1421"
                                    className="Pixso-vector-2_1421"
                                ></div>
                                <div
                                    id="2_1422"
                                    className="Pixso-vector-2_1422"
                                ></div>
                                <div
                                    id="2_1423"
                                    className="stroke-wrapper-2_1423"
                                >
                                    <div className="Pixso-rectangle-2_1423 pixso-position-relative"></div>
                                    <div className="stroke-2_1423"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_1424"
                    className="Pixso-frame-2_1424 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1424 pixso-relative-flex">
                        <div
                            id="2_1425"
                            className="Pixso-frame-2_1425 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1425 pixso-relative-flex">
                                <p
                                    id="2_1426"
                                    className="Pixso-paragraph-2_1426 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"我的"}
                                </p>
                                <p
                                    id="2_1427"
                                    className="Pixso-paragraph-2_1427 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {joinedText}
                                </p>
                            </div>
                        </div>
                        <div
                            id="2_1428"
                            className="Pixso-frame-2_1428 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1428 pixso-relative-flex">
                                <div
                                    id="2_1429"
                                    className="Pixso-frame-2_1429 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1429 pixso-relative-flex">
                                        <div
                                            id="2_1430"
                                            className="Pixso-frame-2_1430 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1431"
                                    className="Pixso-frame-2_1431 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_1431 pixso-relative-flex">
                                        <p
                                            id="2_1432"
                                            className="Pixso-paragraph-2_1432 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {name}
                                        </p>
                                        <p
                                            id="2_1433"
                                            className="Pixso-paragraph-2_1433 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {email}
                                        </p>
                                        <div
                                            id="2_1434"
                                            className="Pixso-frame-2_1434 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                id="2_1435"
                                                className="Pixso-vector-2_1435 pixso-relative-no-shrink"
                                            ></div>
                                            <p
                                                id="2_1437"
                                                className="Pixso-paragraph-2_1437 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`连续 ${streak} 天`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1438"
                                    className="Pixso-frame-2_1438 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                >
                                    <div
                                        id="2_1439"
                                        className="Pixso-frame-2_1439 pixso-relative-no-shrink"
                                    >
                                        <div
                                            id="2_1440"
                                            className="Pixso-vector-2_1440"
                                        ></div>
                                        <div
                                            id="2_1443"
                                            className="Pixso-frame-2_1443 pixso-flex"
                                        >
                                            <div className="frame-content-2_1443 pixso-relative-flex">
                                                <p
                                                    id="2_1444"
                                                    className="Pixso-paragraph-2_1444 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {`${completion}%`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p
                                        id="2_1445"
                                        className="Pixso-paragraph-2_1445 pixso-relative-auto-size pixso-flex-shrink-0"
                                    >
                                        {"资料完成度"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_1446"
                            className="Pixso-frame-2_1446 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1446 pixso-relative-flex">
                                <div
                                    id="2_1447"
                                    className="Pixso-frame-2_1447 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1447 pixso-relative-flex">
                                        <div
                                            id="2_1448"
                                            className="Pixso-frame-2_1448 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1448 pixso-relative-flex">
                                                <div
                                                    id="2_1449"
                                                    className="Pixso-frame-2_1449 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                                >
                                                    <div
                                                        id="2_1450"
                                                        className="Pixso-vector-2_1450 pixso-relative-no-shrink"
                                                    ></div>
                                                    <p
                                                        id="2_1452"
                                                        className="Pixso-paragraph-2_1452 pixso-relative-auto-size pixso-flex-shrink-0"
                                                    >
                                                        {String(streak)}
                                                    </p>
                                                </div>
                                                <p
                                                    id="2_1453"
                                                    className="Pixso-paragraph-2_1453 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"连续学习"}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1454"
                                            className="Pixso-frame-2_1454 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1454 pixso-relative-flex">
                                                <p
                                                    id="2_1455"
                                                    className="Pixso-paragraph-2_1455 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {String(totalPractice)}
                                                </p>
                                                <p
                                                    id="2_1456"
                                                    className="Pixso-paragraph-2_1456 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"累计练习"}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1457"
                                            className="Pixso-frame-2_1457 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1457 pixso-relative-flex">
                                                <p
                                                    id="2_1458"
                                                    className="Pixso-paragraph-2_1458 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {String(due)}
                                                </p>
                                                <p
                                                    id="2_1459"
                                                    className="Pixso-paragraph-2_1459 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"待复习"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1460"
                                    className="Pixso-frame-2_1460 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    id="2_1461"
                                    className="Pixso-frame-2_1461 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1461 pixso-relative-flex">
                                        <p
                                            id="2_1462"
                                            className="Pixso-paragraph-2_1462 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"掌握度分布"}
                                        </p>
                                        <p
                                            id="2_1463"
                                            className="Pixso-paragraph-2_1463 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {`${total} 个知识点`}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1464"
                                    className="Pixso-frame-2_1464 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1464 pixso-relative-flex">
                                        <div
                                            id="2_1465"
                                            className="Pixso-frame-2_1465 pixso-relative-no-shrink"
                                            style={{ flex: mastered }}
                                        ></div>
                                        <div
                                            id="2_1466"
                                            className="Pixso-frame-2_1466 pixso-relative-no-shrink"
                                            style={{ flex: inProgress }}
                                        ></div>
                                        <div
                                            id="2_1467"
                                            className="Pixso-frame-2_1467 pixso-relative-no-shrink"
                                            style={{ flex: notMastered }}
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1468"
                                    className="Pixso-frame-2_1468 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1468 pixso-relative-flex">
                                        <div
                                            id="2_1469"
                                            className="Pixso-frame-2_1469 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                id="2_1470"
                                                className="Pixso-frame-2_1470 pixso-relative-no-shrink"
                                            ></div>
                                            <p
                                                id="2_1471"
                                                className="Pixso-paragraph-2_1471 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`已掌握 ${mastered}`}
                                            </p>
                                        </div>
                                        <div
                                            id="2_1472"
                                            className="Pixso-frame-2_1472 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                id="2_1473"
                                                className="Pixso-frame-2_1473 pixso-relative-no-shrink"
                                            ></div>
                                            <p
                                                id="2_1474"
                                                className="Pixso-paragraph-2_1474 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`进行中 ${inProgress}`}
                                            </p>
                                        </div>
                                        <div
                                            id="2_1475"
                                            className="Pixso-frame-2_1475 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <div
                                                id="2_1476"
                                                className="Pixso-frame-2_1476 pixso-relative-no-shrink"
                                            ></div>
                                            <p
                                                id="2_1477"
                                                className="Pixso-paragraph-2_1477 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`未掌握 ${notMastered}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_1478"
                            className="Pixso-frame-2_1478 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1478 pixso-relative-flex">
                                <div
                                    id="2_1479"
                                    className="Pixso-frame-2_1479 pixso-relative-flex pixso-h-auto"
                                >
                                    <div className="frame-content-2_1479 pixso-relative-flex">
                                        <p
                                            id="2_1480"
                                            className="Pixso-paragraph-2_1480 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"技能画像"}
                                        </p>
                                        <p
                                            id="2_1481"
                                            className="Pixso-paragraph-2_1481 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {skillPreview}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1482"
                                    className="Pixso-vector-2_1482 pixso-relative-no-shrink"
                                ></div>
                            </div>
                        </div>
                        <div
                            id="2_1484"
                            className="Pixso-frame-2_1484 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1484 pixso-relative-flex">
                                <div
                                    onClick={onSettings}
                                    id="2_1485"
                                    className="Pixso-frame-2_1485 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1485 pixso-relative-flex">
                                        <div
                                            id="2_1486"
                                            className="Pixso-frame-2_1486 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1486 pixso-relative-flex">
                                                <div
                                                    id="2_1487"
                                                    className="Pixso-vector-2_1487 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1493"
                                            className="Pixso-frame-2_1493 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1493 pixso-relative-flex">
                                                <p
                                                    id="2_1494"
                                                    className="Pixso-paragraph-2_1494 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"外观设置"}
                                                </p>
                                                <p
                                                    id="2_1495"
                                                    className="Pixso-paragraph-2_1495 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {`${themeLabel} · 字号：${fontLabel}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1496"
                                            className="Pixso-vector-2_1496 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1498"
                                    className="Pixso-frame-2_1498 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    onClick={() => onRow("AI 模型设置")}
                                    id="2_1499"
                                    className="Pixso-frame-2_1499 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1499 pixso-relative-flex">
                                        <div
                                            id="2_1500"
                                            className="Pixso-frame-2_1500 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1500 pixso-relative-flex">
                                                <div
                                                    id="2_1501"
                                                    className="Pixso-frame-2_1501 pixso-relative-no-shrink"
                                                >
                                                    <div
                                                        id="2_1502"
                                                        className="Pixso-vector-2_1502"
                                                    ></div>
                                                    <div
                                                        id="2_1503"
                                                        className="Pixso-vector-2_1503"
                                                    ></div>
                                                    <div
                                                        id="2_1504"
                                                        className="Pixso-vector-2_1504"
                                                    ></div>
                                                    <div
                                                        id="2_1505"
                                                        className="Pixso-vector-2_1505"
                                                    ></div>
                                                    <div
                                                        id="2_1506"
                                                        className="Pixso-vector-2_1506"
                                                    ></div>
                                                    <div
                                                        id="2_1507"
                                                        className="Pixso-vector-2_1507"
                                                    ></div>
                                                    <div
                                                        id="2_1508"
                                                        className="Pixso-vector-2_1508"
                                                    ></div>
                                                    <div
                                                        id="2_1509"
                                                        className="Pixso-vector-2_1509"
                                                    ></div>
                                                    <div
                                                        id="2_1510"
                                                        className="Pixso-vector-2_1510"
                                                    ></div>
                                                    <div
                                                        id="2_1511"
                                                        className="Pixso-vector-2_1511"
                                                    ></div>
                                                    <div
                                                        id="2_1512"
                                                        className="Pixso-vector-2_1512"
                                                    ></div>
                                                    <div
                                                        id="2_1513"
                                                        className="Pixso-vector-2_1513"
                                                    ></div>
                                                    <div
                                                        id="2_1514"
                                                        className="stroke-wrapper-2_1514"
                                                    >
                                                        <div className="Pixso-rectangle-2_1514 pixso-position-relative"></div>
                                                        <div className="stroke-2_1514"></div>
                                                    </div>
                                                    <div
                                                        id="2_1515"
                                                        className="stroke-wrapper-2_1515"
                                                    >
                                                        <div className="Pixso-rectangle-2_1515 pixso-position-relative"></div>
                                                        <div className="stroke-2_1515"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1516"
                                            className="Pixso-frame-2_1516 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1516 pixso-relative-flex">
                                                <p
                                                    id="2_1517"
                                                    className="Pixso-paragraph-2_1517 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"AI 模型设置"}
                                                </p>
                                                <p
                                                    id="2_1518"
                                                    className="Pixso-paragraph-2_1518 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"mimo-v2.6-flash"}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1519"
                                            className="Pixso-vector-2_1519 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1521"
                                    className="Pixso-frame-2_1521 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    onClick={() => onRow("学习方向管理")}
                                    id="2_1522"
                                    className="Pixso-frame-2_1522 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1522 pixso-relative-flex">
                                        <div
                                            id="2_1523"
                                            className="Pixso-frame-2_1523 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1523 pixso-relative-flex">
                                                <div
                                                    id="2_1524"
                                                    className="Pixso-vector-2_1524 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1527"
                                            className="Pixso-frame-2_1527 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1527 pixso-relative-flex">
                                                <p
                                                    id="2_1528"
                                                    className="Pixso-paragraph-2_1528 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"学习方向管理"}
                                                </p>
                                                <p
                                                    id="2_1529"
                                                    className="Pixso-paragraph-2_1529 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {`当前：${direction}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1530"
                                            className="Pixso-vector-2_1530 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1532"
                                    className="Pixso-frame-2_1532 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    onClick={() => onRow("关于面霸")}
                                    id="2_1533"
                                    className="Pixso-frame-2_1533 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1533 pixso-relative-flex">
                                        <div
                                            id="2_1534"
                                            className="Pixso-frame-2_1534 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1534 pixso-relative-flex">
                                                <div
                                                    id="2_1535"
                                                    className="Pixso-vector-2_1535 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1539"
                                            className="Pixso-frame-2_1539 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1539 pixso-relative-flex">
                                                <p
                                                    id="2_1540"
                                                    className="Pixso-paragraph-2_1540 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"关于面霸"}
                                                </p>
                                                <p
                                                    id="2_1541"
                                                    className="Pixso-paragraph-2_1541 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"v1.0.0 · Cream Pop"}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            id="2_1542"
                                            className="Pixso-vector-2_1542 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            onClick={onLogout}
                            id="2_1544"
                            className="Pixso-frame-2_1544 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_1544 pixso-relative-flex">
                                <p
                                    id="2_1545"
                                    className="Pixso-paragraph-2_1545 pixso-relative-auto-size pixso-flex-shrink-0"
                                >
                                    {"退出登录"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60 }}
                    id="2_1546"
                    className="Pixso-frame-2_1546 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1546 pixso-relative-flex">
                        <div
                            id="2_1547"
                            className="stroke-wrapper-2_1547 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="Pixso-frame-2_1547 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"></div>
                            <div className="stroke-2_1547"></div>
                            <div className="Pixso-frame-2_1547-content-layer">
                                <div className="frame-content-2_1547 pixso-relative-flex">
                                    <div
                                        onClick={() => navigate("/tasks")}
                                        id="2_1548"
                                        className="Pixso-frame-2_1548 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1548 pixso-relative-flex">
                                            <div
                                                id="2_1549"
                                                className="Pixso-frame-2_1549 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1549 pixso-relative-flex">
                                                    <div
                                                        id="2_1550"
                                                        className="Pixso-vector-2_1550 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1553"
                                                className="Pixso-paragraph-2_1553 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"首页"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/practice")}
                                        id="2_1554"
                                        className="Pixso-frame-2_1554 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1554 pixso-relative-flex">
                                            <div
                                                id="2_1555"
                                                className="Pixso-frame-2_1555 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1555 pixso-relative-flex">
                                                    <div
                                                        id="2_1556"
                                                        className="Pixso-vector-2_1556 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1559"
                                                className="Pixso-paragraph-2_1559 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"练习"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/interview")}
                                        id="2_1560"
                                        className="Pixso-frame-2_1560 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1560 pixso-relative-flex">
                                            <div
                                                id="2_1561"
                                                className="Pixso-frame-2_1561 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1561 pixso-relative-flex">
                                                    <div
                                                        id="2_1562"
                                                        className="Pixso-frame-2_1562 pixso-relative-no-shrink"
                                                    >
                                                        <div
                                                            id="2_1563"
                                                            className="Pixso-vector-2_1563"
                                                        ></div>
                                                        <div
                                                            id="2_1564"
                                                            className="stroke-wrapper-2_1564"
                                                        >
                                                            <div className="Pixso-rectangle-2_1564 pixso-position-relative"></div>
                                                            <div className="stroke-2_1564"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1565"
                                                className="Pixso-paragraph-2_1565 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"面试"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/sediment")}
                                        id="2_1566"
                                        className="Pixso-frame-2_1566 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1566 pixso-relative-flex">
                                            <div
                                                id="2_1567"
                                                className="Pixso-frame-2_1567 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1567 pixso-relative-flex">
                                                    <div
                                                        id="2_1568"
                                                        className="Pixso-vector-2_1568 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1572"
                                                className="Pixso-paragraph-2_1572 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"沉淀"}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => navigate("/me")}
                                        id="2_1573"
                                        className="Pixso-frame-2_1573 pixso-relative-flex"
                                    >
                                        <div className="frame-content-2_1573 pixso-relative-flex">
                                            <div
                                                id="2_1574"
                                                className="Pixso-frame-2_1574 pixso-relative-no-shrink pixso-flex"
                                            >
                                                <div className="frame-content-2_1574 pixso-relative-flex">
                                                    <div
                                                        id="2_1575"
                                                        className="Pixso-vector-2_1575 pixso-relative-no-shrink"
                                                    ></div>
                                                </div>
                                            </div>
                                            <p
                                                id="2_1578"
                                                className="Pixso-paragraph-2_1578 pixso-relative-auto-size pixso-flex-shrink-0"
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
export default Frame21403;
