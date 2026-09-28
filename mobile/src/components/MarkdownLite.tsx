import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PillFlow, parsePillFlow } from './PillFlow';

/** 移动端轻量 Markdown：代码块（含 mermaid 药丸流）+ GFM 基础渲染。
 *  桌面 Markdown.tsx 的精简版——不引语法高亮与 mermaid.js。 */
export function MarkdownLite({ text }: { text: string }) {
  return (
    <div className="mdlite">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const raw = String(children).replace(/\n$/, '');
            const m = /language-([\w+#-]+)/.exec(className ?? '');
            if (m && m[1].toLowerCase() === 'mermaid') {
              const nodes = parsePillFlow(raw);
              return nodes ? <PillFlow nodes={nodes} /> : <pre className="mono-fallback">{raw}</pre>;
            }
            return <pre className="mono-block">{raw}</pre>;
          },
          a: (p) => <a {...p} target="_blank" rel="noreferrer" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
