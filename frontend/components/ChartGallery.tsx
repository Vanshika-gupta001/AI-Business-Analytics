export default function ChartGallery({
  charts,
}: {
  charts: string[];
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mt-6">

      <h2 className="text-2xl font-semibold text-white mb-6">
        📈 Data Visualizations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {charts.map((chart, index) => (

          <div
            key={index}
            className="bg-zinc-800 rounded-lg p-4"
          >

            <img
              src={`http://127.0.0.1:8000/${chart}`}
              alt={`Chart ${index + 1}`}
              className="rounded-lg w-full"
            />

          </div>

        ))}

      </div>

    </div>
  );
}