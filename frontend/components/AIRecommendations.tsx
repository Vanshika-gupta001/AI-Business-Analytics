"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  TrendingUp,
  CheckCircle
} from "lucide-react";


export default function AIRecommendations({

data

}:{

data:any;

}){


const recommendations = data.recommendations || [];


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
mt-8
shadow-lg
"

>


<div className="
flex
items-center
gap-3
mb-5
">


<Lightbulb

className="text-[var(--color-accent)]"

size={28}

/>


<h2 className="
text-xl
font-semibold
">

AI Recommendations

</h2>


</div>




{

recommendations.length > 0 ?


<div className="
space-y-4
">


{

recommendations.map((item:string,index:number)=>(


<div

key={index}

className="
flex
gap-3
bg-[var(--color-ink)]/40
border
border-[var(--color-border)]
rounded-xl
p-4
"


>


<CheckCircle

className="text-[var(--color-success)] mt-1"

size={20}

/>



<p className="
text-[var(--color-text-secondary)]
leading-6
">

{item}

</p>



</div>


))


}


</div>



:

<div className="
flex
items-center
gap-3
text-[var(--color-text-secondary)]
">


<TrendingUp

className="text-[var(--color-accent)]"

/>


<p>

Dataset is ready for further analysis and modeling.

</p>


</div>


}



</motion.div>

)

}