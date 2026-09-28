import "./Frame21403.css";
export interface MeFrameProps {
  name: string; subtitle: string; joinedText: string; completion: number;
  streak: number; totalPractice: number; due: number;
  total: number; mastered: number; inProgress: number; notMastered: number;
  skillPreview: string; themeLabel: string; fontLabel: string; model: string;
  onAppearance?: () => void; onAiSettings?: () => void;
}

const Frame21403 = ({ name, subtitle, joinedText, completion, streak, totalPractice, due, total, mastered, inProgress, notMastered, skillPreview, themeLabel, fontLabel, model, onAppearance, onAiSettings }: MeFrameProps) => {
    return (
        <div className="scroll-container">
            <div
                id="2_1403"
                className="Pixso-frame-2_1403 pixso-relative-no-shrink pixso-flex"
            >
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
                                            {subtitle}
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
                                                {"连续 7 天"}
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
                                        style={{ flex: mastered }}
                                            id="2_1465"
                                            className="Pixso-frame-2_1465 pixso-relative-no-shrink"
                                        ></div>
                                        <div
                                        style={{ flex: inProgress }}
                                            id="2_1466"
                                            className="Pixso-frame-2_1466 pixso-relative-no-shrink"
                                        ></div>
                                        <div
                                        style={{ flex: notMastered }}
                                            id="2_1467"
                                            className="Pixso-frame-2_1467 pixso-relative-no-shrink"
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
                                                {"进行中 5"}
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
                                                {"未掌握 8"}
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
                                                onClick={onAppearance}
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
                                                    onClick={onAiSettings}
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
                                                    {model}
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
                                                    {"当前：Go 后端工程师"}
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Frame21403;
