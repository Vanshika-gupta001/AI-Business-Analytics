export default function HealthCard({
  score,
  status,
  grade,
}: {
  score: number;
  status: string;
  grade: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full">
      <h2 className="text-lg text-zinc-400">
        Data Health Score
      </h2>

      <div className="mt-3 text-5xl font-bold text-white">
        {score}/100
      </div>

      <div className="mt-4 flex gap-3">
        <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
          {status}
        </span>

        <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
          Grade {grade}
        </span>
      </div>
    </div>
  );
}
