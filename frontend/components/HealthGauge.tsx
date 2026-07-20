"use client";

import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer
} from "recharts";


export default function HealthGauge({
  score
}:{
  score:number
}){


const data = [
{
name:"Health",
value:score
}
];


return (

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">


<h2 className="text-xl font-semibold mb-4">
❤️ Data Health Score
</h2>


<div className="h-60">


<ResponsiveContainer width="100%" height="100%">

<RadialBarChart
cx="50%"
cy="50%"
innerRadius="70%"
outerRadius="100%"
data={data}
startAngle={90}
endAngle={-270}
>


<RadialBar
dataKey="value"
cornerRadius={20}
/>


</RadialBarChart>


</ResponsiveContainer>


</div>


<p className="text-center text-4xl font-bold">
{score}/100
</p>


</div>

)

}