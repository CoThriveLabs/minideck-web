// バッククォート `code` を <code> タグに変換する共通ヘルパー（Faq / Setup 共通）。
// Gotcha: 入力は開発者が管理する定数のみを想定（set:html で描画するため外部入力を渡さないこと）。
export function formatInlineCode(text: string): string {
  return text.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-md-surface-2/80 px-1.5 py-0.5 text-md-accent font-mono text-[0.9em]">$1</code>',
  );
}
