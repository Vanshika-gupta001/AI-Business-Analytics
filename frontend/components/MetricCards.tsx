"use client";


import { motion } from "framer-motion";

import {
Rows3,
Columns3,
Gauge,
Award
} from "lucide-react";



export default function MetricCards({

data

}:{

data:any;

}){



const datasetInfo = data?.dataset_info || {};



const metrics=[


{

title:"Rows",

value:datasetInfo.rows ?? 0,

icon:Rows3

},



{

title:"Columns",

value:datasetInfo.columns ?? 0,

icon:Columns3

},



{

title:"Health Score",

value:`${data?.health_score ?? 0}/100`,

icon:Gauge

},



{

title:"Grade",

value:data?.grade ?? "N/A",

icon:Award

}



];





return (


<div


className="

grid

grid-cols-1

sm:grid-cols-2

lg:grid-cols-4

gap-4

"


>



{

metrics.map((item,index)=>{


const Icon=item.icon;



return (


<motion.div


key={index}


initial={{

opacity:0,

y:20

}}


animate={{

opacity:1,

y:0

}}


transition={{

delay:index*0.08

}}



className="

bg-[var(--color-surface)]

border

border-[var(--color-border)]

rounded-xl

p-5

"


>



<div

className="

flex

justify-between

items-center

"


>


<Icon

size={20}

className="text-[var(--color-text-muted)]"

/>


</div>





<p

className="

text-[var(--color-text-secondary)]

text-sm

mt-4

"

>


{item.title}


</p>





<h2

className="

data-num

text-2xl

font-semibold

mt-1.5

text-[var(--color-text-primary)]

"

>


{item.value}


</h2>





</motion.div>


)


})


}



</div>


)


}