const AiSummary = async ({ content }: { content: string }) => {
  // app/notes/components/AiSummary.tsx
  // わざと3秒待機して、時間のかかる処理をシミュレート
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // ここに本来はAIに要約をリクエストするロジックが入る
  const summary = `これは「${content.substring(0, 15)}...」という内容のノートのAIによる要約（という体）です。\nストリーミングによって、メインコンテンツより遅れて表示しています。`;

  return (
    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">
        AIによる要約（仮）
      </h3>
      <p className="text-blue-700 whitespace-pre-wrap">{summary}</p>
    </div>
  );
};

export default AiSummary;
