import "./Frame21579.css";
export interface SettingsFrameProps {
  themeLabel: string; fontLabel: string; theme: string; fontScale: number;
  remindOn: boolean; voiceOn: boolean;
  setTheme: (t: 'cream' | 'white' | 'system') => void;
  setFont: (n: number) => void;
  toggleRemind: () => void; toggleVoice: () => void;
  onBack: () => void;
  onClear: () => void;
}

const Frame21579 = ({ themeLabel, fontLabel, theme, fontScale, remindOn, voiceOn, setTheme, setFont, toggleRemind, toggleVoice, onBack, onClear }: SettingsFrameProps) => {
    return (
        <div className="scroll-container">
            <div
                id="2_1579"
                className="Pixso-frame-2_1579 pixso-relative-no-shrink pixso-flex"
            >
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
                                        onClick={() => setTheme('cream')}
                                        style={{ outline: theme === 'cream' ? '2px solid var(--primary)' : 'none', outlineOffset: 2 }}
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
                                        onClick={() => setTheme('white')}
                                        style={{ outline: theme === 'white' ? '2px solid var(--primary)' : 'none', outlineOffset: 2 }}
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
                                        onClick={() => setTheme('system')}
                                        style={{ outline: theme === 'system' ? '2px solid var(--primary)' : 'none', outlineOffset: 2 }}
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
<input type="range" min={0} max={2} step={1} value={fontScale}
 onChange={(e) => setFont(Number(e.target.value))}
 style={{ width: '100%', accentColor: 'var(--primary)' }} />
                                    </div>
                                </div>
                                <div
                                    id="2_1635"
                                    className="Pixso-frame-2_1635 pixso-relative-no-shrink pixso-flex-auto-height"
                                >
                                    <div className="frame-content-2_1635 pixso-relative-flex">
                                        <p
                                            id="2_1636"
                                            className="Pixso-paragraph-2_1636 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"小"}
                                        </p>
                                        <p
                                            id="2_1637"
                                            className="Pixso-paragraph-2_1637 pixso-relative-auto-size pixso-flex-shrink-0"
                                        >
                                            {"标准"}
                                        </p>
                                        <p
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
                                                {"128 MB"}
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
