export default function DashboardStats({
  data,
}: {
  data: any;
}) {

return (

<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">


{/* Rows */}

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">

<h3 className="text-zinc-400">
Total Rows
</h3>

<p className="text-4xl font-bold mt-3">
{data.dataset_info.rows}
</p>

</div>



{/* Columns */}

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">

<h3 className="text-zinc-400">
Total Columns
</h3>

<p className="text-4xl font-bold mt-3">
{data.dataset_info.columns}
</p>

</div>



{/* Health */}

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">

<h3 className="text-zinc-400">
Data Health
</h3>

<p className="text-4xl font-bold mt-3">
{data.health_score}/100
</p>

<p className="text-green-400 mt-2">
{data.status}
</p>

</div>


</div>

);

}