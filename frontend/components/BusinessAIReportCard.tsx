"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";


export default function BusinessAIReportCard({

report,

}: {

report:string;

}) {


const sections = report
.split(/\n(?=##)/)
.map(section => section.trim())
.filter(Boolean);



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
gap-3
mb-6
">


<div className="
p-3
rounded-xl
bg-[var(--color-success)]/15
">

<Sparkles
className="text-[var(--color-success)]"
size={28}
/>

</div>


<div>

<h2 className="
text-xl
font-semibold
">

Business AI Report

</h2>


<p className="
text-sm
text-[var(--color-text-secondary)]
">

AI generated business analysis

</p>


</div>


</div>





{/* Report Sections */}


<div className="space-y-5">


{

sections.map((section,index)=>{


const title =
section.split("\n")[0]
.replace("##","")
.trim();


const content =
section
.replace(section.split("\n")[0],"")
.trim();



return (

<div

key={index}

className="
bg-[var(--color-ink)]
border
border-[var(--color-border)]
rounded-xl
p-5
"


>


<div className="
flex
items-center
gap-2
mb-3
">


<FileText
size={20}
className="text-[var(--color-accent)]"
/>


<h3 className="
font-semibold
text-[var(--color-text-primary)]
">

{title}

</h3>


</div>



<p className="
text-[var(--color-text-secondary)]
leading-7
whitespace-pre-line
text-sm
md:text-base
">

{content}

</p>


</div>


)


})

}


</div>


</motion.div>

);

}