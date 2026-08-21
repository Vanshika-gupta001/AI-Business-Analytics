"use client";

import { motion } from "framer-motion";
import { Bot, Copy, Check } from "lucide-react";
import { useState } from "react";


export default function AISummaryCard({

summary,

}: {

summary:string;

}) {


const [copied,setCopied] = useState(false);


const copySummary = ()=>{

navigator.clipboard.writeText(summary);

setCopied(true);

setTimeout(()=>setCopied(false),2000);

};



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

transition={{
duration:0.5
}}

className="
bg-[var(--color-surface)]
border border-[var(--color-border)]
rounded-xl
p-6
mt-6

"

>


{/* Header */}

<div className="
flex
items-center
justify-between
mb-5
">


<div className="
flex
items-center
gap-3
">


<div className="
p-3
rounded-xl
bg-[var(--color-accent-dim)]
">

<Bot
className="text-[var(--color-accent)]"
size={28}
/>

</div>



<div>

<h2 className="
text-xl
font-semibold
">

AI Summary

</h2>


<p className="
text-sm
text-[var(--color-text-secondary)]
">

Generated from your dataset analysis

</p>


</div>


</div>





<button

onClick={copySummary}

className="
p-2
rounded-lg
bg-[var(--color-surface-raised)]
hover:bg-[var(--color-surface-raised)]
transition
"

>

{

copied ?

<Check size={18}
className="text-[var(--color-success)]"
/>

:

<Copy size={18}/>

}


</button>


</div>





{/* Summary Box */}

<div className="
bg-[var(--color-ink)]
border
border-[var(--color-border)]
rounded-xl
p-5
"


>


<p className="
text-[var(--color-text-secondary)]
leading-8
text-sm
md:text-base
">

{summary}

</p>


</div>



</motion.div>

);

}