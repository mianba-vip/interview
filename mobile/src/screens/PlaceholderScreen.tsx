/** 未开放功能的占位屏（按里程碑逐步替换为真实页面）。 */
export default function PlaceholderScreen({ title, note }: { title: string; note: string }) {
  return (
    <div className="screen">
      <div className="greet-title">{title}</div>
      <div className="center-note">{note}</div>
    </div>
  );
}
