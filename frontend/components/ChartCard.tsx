export default function ChartCard({
charts
}:{
charts:string[]
}){


return (

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mt-6">


<h2 className="text-xl font-semibold mb-5">
📈 Analytics Charts
</h2>


<div className="grid grid-cols-1 md:grid-cols-2 gap-6">


{
charts.map((chart,index)=>(

<div
key={index}
className="border border-zinc-700 rounded-lg p-3"
>

<img
src={`http://127.0.0.1:8000/${chart}`}
alt="chart"
/>


</div>

))
}


</div>


</div>

)

}