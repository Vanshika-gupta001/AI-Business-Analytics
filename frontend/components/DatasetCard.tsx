"use client";


import { motion } from "framer-motion";


import {
Database,
Rows3,
Columns3,
Hash,
Type,
HardDrive
} from "lucide-react";



export default function DatasetCard({

data

}:{

data:any;

}){



const stats=[


{

title:"Rows",

value:data?.rows ?? 0,

icon:Rows3

},


{

title:"Columns",

value:data?.columns ?? 0,

icon:Columns3

},


{

title:"Numeric",

value:data?.numeric_columns ?? 0,

icon:Hash

},


{

title:"Categorical",

value:data?.categorical_columns ?? 0,

icon:Type

},


{

title:"Memory",

value:`${data?.memory_usage_kb ?? 0} KB`,

icon:HardDrive

}



];



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

"


>



<div

className="

flex

items-center

gap-3

mb-6

"

>


<div

className="

p-3

rounded-lg

bg-[var(--color-accent-dim)]

"

>


<Database

className="text-[var(--color-accent)]"

size={22}

/>


</div>



<div>


<h2 className="text-base font-semibold text-[var(--color-text-primary)]">

Dataset Overview

</h2>


<p className="text-sm text-[var(--color-text-secondary)]">

Dataset profiling summary

</p>


</div>


</div>





<div


className="

grid

grid-cols-2

md:grid-cols-5

gap-4

"


>



{

stats.map((item,index)=>{


const Icon=item.icon;


return (


<div


key={index}


className="

bg-[var(--color-ink)]

border

border-[var(--color-border)]

rounded-lg

p-4

"


>


<Icon

size={18}

className="text-[var(--color-text-muted)] mb-3"

/>



<p className="text-[var(--color-text-secondary)] text-xs">

{item.title}

</p>



<p className="data-num text-xl font-semibold mt-1 text-[var(--color-text-primary)]">

{item.value}

</p>


</div>


)


})


}



</div>


</motion.div>


)


}