export default function AISummaryCard({
  summary,
}: {
  summary: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full mt-6">

      <h2 className="text-xl font-semibold text-white mb-4">
        🤖 AI Summary
      </h2>


      <p className="text-zinc-300 leading-7">
        {summary}
      </p>


    </div>
  );
}