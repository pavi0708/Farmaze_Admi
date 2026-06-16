/**
 * MarkdownContent — renders assistant messages as rich markdown.
 * Styled with warm amber theme tokens. Dashboard-quality tables.
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => <h1 className="text-base font-semibold mb-2 mt-3 first:mt-0 font-rubik">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-semibold mb-1.5 mt-2.5 first:mt-0 font-rubik">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0 font-rubik">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-medium mb-1 mt-2 first:mt-0 font-rubik">{children}</h4>,
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed font-rubik">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return <code className="block bg-muted rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre mb-2">{children}</code>;
    }
    return <code className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>;
  },
  pre: ({ children }) => <pre className="mb-2 last:mb-0">{children}</pre>,
  table: ({ children }) => (
    <div className="overflow-x-auto mb-2 last:mb-0 rounded-lg border border-border">
      <table className="min-w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-primary/5">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border/40 last:border-b-0 even:bg-muted/30">{children}</tr>,
  th: ({ children }) => (
    <th className="px-2.5 py-1.5 text-left font-semibold text-xs uppercase tracking-wider border-r border-border/40 last:border-r-0 whitespace-nowrap text-foreground">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-2.5 py-1.5 border-r border-border/40 last:border-r-0 tabular-nums font-rubik">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground mb-2">{children}</blockquote>
  ),
  hr: () => <hr className="border-border/40 my-3" />,
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  // Strip HTML comments (e.g. <!-- ORDER_DATA: {...} -->) before rendering
  const cleaned = content.replace(/<!--[\s\S]*?-->/g, '').trim();
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{cleaned}</ReactMarkdown>;
}
