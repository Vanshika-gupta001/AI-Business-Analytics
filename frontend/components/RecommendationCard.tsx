export default function RecommendationCard({
recommendations
}:{
recommendations:string[]
}){


return(

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mt-6">


<h2 className="text-xl font-bold mb-4">
🚀 AI Recommendations
</h2>


<ul className="space-y-3">

{
recommendations.map(
(item,index)=>(

<li 
key={index}
className="text-zinc-300"
>
✓ {item}
</li>

))
}

</ul>


</div>

)

}