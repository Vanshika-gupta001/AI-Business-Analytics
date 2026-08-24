"use client";


import { motion } from "framer-motion";

import { BarChart3, ImageOff } from "lucide-react";



export default function ChartGallery({

charts

}:{

charts:string[];

}){



const API_URL =  process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-business-analytics-7xoe.onrender.com";



function getTitle(path:string){


return path

.split("/")

.pop()

?.replace(".png","")

.replaceAll("_"," ")

.replace(/\b\w/g,char=>char.toUpperCase());


}





if(!charts || charts.length===0){


return (

<div className="

bg-[var(--color-surface)]

border

border-[var(--color-border)]

rounded-xl

p-6

mt-6

">


<div className="flex items-center gap-3">

<ImageOff

className="text-[var(--color-text-secondary)]"

/>


<h2 className="text-xl font-semibold">

No Charts Available

</h2>


</div>


</div>

)


}





return (



<motion.div


initial={{

opacity:0,

y:20

}}



animate={{

opacity:1,

y:0

}}



className="

bg-[var(--color-surface)]

border

border-[var(--color-border)]

rounded-xl

p-6

mt-6



"


>



<div className="flex items-center gap-3 mb-6">


<div className="

p-3

rounded-xl

bg-[var(--color-teal)]/10

">


<BarChart3

className="text-[var(--color-teal)]"

size={28}

/>


</div>



<div>


<h2 className="text-2xl font-semibold">

Data Visualizations

</h2>


<p className="text-sm text-[var(--color-text-secondary)]">

AI generated analytics charts

</p>


</div>



</div>





<div className="

grid

grid-cols-1

lg:grid-cols-2

gap-6

">



{


charts.map((chart,index)=>{



const imageURL = chart.startsWith("http")

?

chart

:

`${API_URL}/${chart.replace("\\","/")}`;



return (



<motion.div


key={index}


whileHover={{

scale:1.02

}}



className="

bg-[var(--color-ink)]

border

border-[var(--color-border)]

rounded-xl

p-4

overflow-hidden

min-w-0

"

>


<h3 className="

text-sm

font-medium

text-[var(--color-text-secondary)]

mb-4

">


{getTitle(chart)}


</h3>





<img
  src={`${process.env.NEXT_PUBLIC_API_URL}/${chart.replace("\\","/")}`}
  alt={getTitle(chart)}
  className="
  rounded-lg
  w-full
  h-auto
  max-w-full
  block
  hover:opacity-90
  transition
  "
  onError={(e)=>{
    console.log("IMAGE FAILED:", e.currentTarget.src);
  }}
/>



</motion.div>



)


})


}



</div>



</motion.div>



)


}