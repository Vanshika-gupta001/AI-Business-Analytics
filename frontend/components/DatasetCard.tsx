export default function DatasetCard({
  data,
}: {
  data: any;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full mt-6">

      <h2 className="text-xl font-semibold text-white mb-4">
        Dataset Overview
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div>
          <p className="text-zinc-400">Rows</p>
          <p className="text-2xl text-white font-bold">
            {data.rows}
          </p>
        </div>


        <div>
          <p className="text-zinc-400">Columns</p>
          <p className="text-2xl text-white font-bold">
            {data.columns}
          </p>
        </div>


        <div>
          <p className="text-zinc-400">Numeric</p>
          <p className="text-2xl text-white font-bold">
            {data.numeric_columns}
          </p>
        </div>


        <div>
          <p className="text-zinc-400">Categorical</p>
          <p className="text-2xl text-white font-bold">
            {data.categorical_columns}
          </p>
        </div>

      </div>

    </div>
  );
}