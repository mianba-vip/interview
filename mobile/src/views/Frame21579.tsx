import "@/styles/Frame21579.css";

/** 设置：主题 / 字号 / 开关 / 缓存——视觉 = Pixso 模板，取值与回调由容器注入（view 不发请求）。 */
export interface SettingsViewProps {
    theme: "cream" | "white" | "system";
    themeLabel: string;
    fontScale: number;
    fontLabel: string;
    remindOn: boolean;
    voiceOn: boolean;
    cacheText: string;
    setTheme: (t: "cream" | "white" | "system") => void;
    setFont: (n: number) => void;
    toggleRemind: () => void;
    toggleVoice: () => void;
    onBack: () => void;
    onClear: () => void;
}

const Frame21579 = ({
    theme,
    themeLabel,
    fontScale,
    fontLabel,
    remindOn,
    voiceOn,
    cacheText,
    setTheme,
    setFont,
    toggleRemind,
    toggleVoice,
    onBack,
    onClear,
}: SettingsViewProps) => {
    return (
        <div className="scroll-container">
            <div
                id="2_1579"
                className="Pixso-frame-2_1579 pixso-relative-no-shrink pixso-flex"
            >
                <div
                    id="2_1580"
                    className="Pixso-frame-2_1580 pixso-relative-no-shrink pixso-flex"
                >
                    <div className="frame-content-2_1580 pixso-relative-flex">
                        <p
                            id="2_1581"
                            className="Pixso-paragraph-2_1581 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"9:41"}
                        </p>
                        <div
                            id="2_1582"
                            className="Pixso-frame-2_1582 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                        >
                            <div
                                id="2_1583"
                                className="Pixso-vector-2_1583 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1589"
                                className="Pixso-vector-2_1589 pixso-relative-no-shrink"
                            ></div>
                            <div
                                id="2_1594"
                                className="Pixso-frame-2_1594 pixso-relative-no-shrink"
                            >
                                <div
                                    id="2_1595"
                                    className="Pixso-vector-2_1595"
                                ></div>
                                <div
                                    id="2_1596"
                                    className="Pixso-vector-2_1596"
                                ></div>
                                <div
                                    id="2_1597"
                                    className="Pixso-vector-2_1597"
                                ></div>
                                <div
                                    id="2_1598"
                                    className="Pixso-vector-2_1598"
                                ></div>
                                <div
                                    id="2_1599"
                                    className="stroke-wrapper-2_1599"
                                >
                                    <div className="Pixso-rectangle-2_1599 pixso-position-relative"></div>
                                    <div className="stroke-2_1599"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    id="2_1600"
                    className="Pixso-frame-2_1600 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1600 pixso-relative-flex">
                        <div
                            onClick={onBack}
                            id="2_1601"
                            className="Pixso-frame-2_1601 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex"
                        >
                            <div className="frame-content-2_1601 pixso-relative-flex">
                                <div
                                    id="2_1602"
                                    className="Pixso-vector-2_1602 pixso-relative-no-shrink"
                                ></div>
                            </div>
                        </div>
                        <p
                            id="2_1605"
                            className="Pixso-paragraph-2_1605 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"设置"}
                        </p>
                        <div
                            id="2_1606"
                            className="Pixso-frame-2_1606 pixso-position-relative"
                        ></div>
                    </div>
                </div>
                <div
                    id="2_1607"
                    className="Pixso-frame-2_1607 pixso-relative-no-shrink pixso-flex-auto-height"
                >
                    <div className="frame-content-2_1607 pixso-relative-flex">
                        <div
                            id="2_1608"
                            className="Pixso-frame-2_1608 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1608 pixso-relative-flex">
                                <div
                                    id="2_1609"
                                    className="Pixso-frame-2_1609 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1609 pixso-relative-flex">
                                        <p
                                            id="2_1610"
                                            className="Pixso-paragraph-2_1610 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"外观设置"}
                                        </p>
                                        <div
                                            id="2_1611"
                                            className="Pixso-frame-2_1611 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_1612"
                                                className="Pixso-paragraph-2_1612 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`当前：${themeLabel}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1613"
                                    className="Pixso-frame-2_1613 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1613 pixso-relative-flex">
                                        <div
                                            onClick={() => setTheme("cream")}
                                            style={{
                                                outline: theme === "cream" ? "2px solid var(--color-brand-purple)" : "none",
                                                outlineOffset: 2,
                                            }}
                                            id="2_1614"
                                            className="Pixso-frame-2_1614 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1614 pixso-relative-flex">
                                                <div
                                                    id="2_1615"
                                                    className="stroke-wrapper-2_1615 pixso-relative-no-shrink pixso-flex"
                                                >
                                                    <div className="Pixso-frame-2_1615 pixso-relative-no-shrink pixso-flex"></div>
                                                    <div className="stroke-2_1615"></div>
                                                    <div className="Pixso-frame-2_1615-content-layer">
                                                        <div className="frame-content-2_1615 pixso-relative-flex">
                                                            <div
                                                                id="2_1616"
                                                                className="Pixso-frame-2_1616 pixso-relative-no-shrink pixso-flex"
                                                            >
                                                                <div className="frame-content-2_1616 pixso-relative-flex">
                                                                    <div
                                                                        id="2_1617"
                                                                        className="Pixso-vector-2_1617 pixso-relative-no-shrink"
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p
                                                    id="2_1619"
                                                    className="Pixso-paragraph-2_1619 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"奶油白天"}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setTheme("white")}
                                            style={{
                                                outline: theme === "white" ? "2px solid var(--color-brand-purple)" : "none",
                                                outlineOffset: 2,
                                            }}
                                            id="2_1620"
                                            className="Pixso-frame-2_1620 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1620 pixso-relative-flex">
                                                <div
                                                    id="2_1621"
                                                    className="stroke-wrapper-2_1621 pixso-relative-no-shrink"
                                                >
                                                    <div className="Pixso-frame-2_1621 pixso-relative-no-shrink"></div>
                                                    <div className="stroke-2_1621"></div>
                                                </div>
                                                <p
                                                    id="2_1622"
                                                    className="Pixso-paragraph-2_1622 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"纯白"}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setTheme("system")}
                                            style={{
                                                outline: theme === "system" ? "2px solid var(--color-brand-purple)" : "none",
                                                outlineOffset: 2,
                                            }}
                                            id="2_1623"
                                            className="Pixso-frame-2_1623 pixso-relative-flex pixso-h-auto"
                                        >
                                            <div className="frame-content-2_1623 pixso-relative-flex">
                                                <div
                                                    id="2_1624"
                                                    className="stroke-wrapper-2_1624 pixso-relative-no-shrink"
                                                >
                                                    <div className="Pixso-frame-2_1624 pixso-relative-no-shrink"></div>
                                                    <div className="stroke-2_1624"></div>
                                                </div>
                                                <p
                                                    id="2_1625"
                                                    className="Pixso-paragraph-2_1625 pixso-relative-auto-size pixso-flex-shrink-0"
                                                >
                                                    {"跟随系统"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_1626"
                            className="Pixso-frame-2_1626 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1626 pixso-relative-flex">
                                <div
                                    id="2_1627"
                                    className="Pixso-frame-2_1627 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1627 pixso-relative-flex">
                                        <p
                                            id="2_1628"
                                            className="Pixso-paragraph-2_1628 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"字号设置"}
                                        </p>
                                        <div
                                            id="2_1629"
                                            className="Pixso-frame-2_1629 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_1630"
                                                className="Pixso-paragraph-2_1630 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {`当前：${fontLabel}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1631"
                                    className="Pixso-frame-2_1631 pixso-relative-no-shrink pixso-flex"
                                >
                                    <div className="frame-content-2_1631 pixso-relative-flex">
                                        <div
                                            id="2_1632"
                                            className="Pixso-frame-2_1632 pixso-relative-no-shrink"
                                            style={{ width: ["30%", "50%", "80%"][fontScale] ?? "50%" }}
                                        ></div>
                                        <div
                                            id="2_1633"
                                            className="stroke-wrapper-2_1633 pixso-relative-no-shrink"
                                        >
                                            <div className="Pixso-frame-2_1633 pixso-relative-no-shrink"></div>
                                            <div className="stroke-2_1633"></div>
                                        </div>
                                        <div
                                            id="2_1634"
                                            className="Pixso-frame-2_1634 pixso-position-relative"
                                        ></div>
                                    </div>
                                </div>
                                <div
                                    id="2_1635"
                                    className="Pixso-frame-2_1635 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1635 pixso-relative-flex">
                                        <p
                                            onClick={() => setFont(0)}
                                            id="2_1636"
                                            className="Pixso-paragraph-2_1636 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"小"}
                                        </p>
                                        <p
                                            onClick={() => setFont(1)}
                                            id="2_1637"
                                            className="Pixso-paragraph-2_1637 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"标准"}
                                        </p>
                                        <p
                                            onClick={() => setFont(2)}
                                            id="2_1638"
                                            className="Pixso-paragraph-2_1638 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"大"}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    id="2_1639"
                                    className="Pixso-frame-2_1639 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1639 pixso-relative-flex">
                                        <p
                                            id="2_1640"
                                            className="Pixso-paragraph-2_1640 pixso-relative-no-shrink pixso-h-auto"
                                        >
                                            {
                                                "预览：先想通，才是真的会——AI 只提问，不直接给答案。"
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            id="2_1641"
                            className="Pixso-frame-2_1641 effect-effectcardshadow-2_19 pixso-relative-no-shrink pixso-flex-auto-height"
                        >
                            <div className="frame-content-2_1641 pixso-relative-flex">
                                <div
                                    onClick={toggleRemind}
                                    id="2_1642"
                                    className="Pixso-frame-2_1642 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1642 pixso-relative-flex">
                                        <p
                                            id="2_1643"
                                            className="Pixso-paragraph-2_1643 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"学习提醒"}
                                        </p>
                                        <div
                                            style={{ opacity: remindOn ? 1 : 0.35 }}
                                            id="2_1644"
                                            className="Pixso-frame-2_1644 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1644 pixso-relative-flex">
                                                <div
                                                    id="2_1645"
                                                    className="Pixso-frame-2_1645 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1646"
                                    className="Pixso-frame-2_1646 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    onClick={toggleVoice}
                                    id="2_1647"
                                    className="Pixso-frame-2_1647 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1647 pixso-relative-flex">
                                        <p
                                            id="2_1648"
                                            className="Pixso-paragraph-2_1648 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"语音作答"}
                                        </p>
                                        <div
                                            style={{ opacity: voiceOn ? 1 : 0.35 }}
                                            id="2_1649"
                                            className="Pixso-frame-2_1649 pixso-relative-no-shrink pixso-flex"
                                        >
                                            <div className="frame-content-2_1649 pixso-relative-flex">
                                                <div
                                                    id="2_1650"
                                                    className="Pixso-frame-2_1650 pixso-relative-no-shrink"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    id="2_1651"
                                    className="Pixso-frame-2_1651 pixso-relative-no-shrink"
                                ></div>
                                <div
                                    onClick={onClear}
                                    id="2_1652"
                                    className="Pixso-frame-2_1652 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1652 pixso-relative-flex">
                                        <div
                                            id="2_1653"
                                            className="Pixso-frame-2_1653 pixso-relative-flex-auto-size pixso-flex-shrink-0"
                                        >
                                            <p
                                                id="2_1654"
                                                className="Pixso-paragraph-2_1654 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {"清理缓存"}
                                            </p>
                                            <p
                                                id="2_1655"
                                                className="Pixso-paragraph-2_1655 pixso-relative-auto-size pixso-flex-shrink-0"
                                            >
                                                {cacheText}
                                            </p>
                                        </div>
                                        <div
                                            id="2_1656"
                                            className="Pixso-vector-2_1656 pixso-relative-no-shrink"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p
                            id="2_1658"
                            className="Pixso-paragraph-2_1658 pixso-relative-auto-size pixso-flex-shrink-0"
                        >
                            {"面霸 v1.0.0 · Cream Pop 设计系统"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Frame21579;
