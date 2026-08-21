"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";


export default function InsightsTimeline({

data

}:{

data:any;

}){


const insights = data.insights || [];


function getSeverity(text:string){


  const value = text.toLowerCase();

  // A number followed by "missing"/"duplicate" is a real issue.
  // "no missing values" / "0 duplicate rows" is a positive finding —
  // must be checked BEFORE the generic keyword match below, since both
  // sentences contain the same keyword.
  const hasPositivePhrasing =
    /\bno\s+(missing|duplicate)/.test(value) ||
    /\b0\s+(missing|duplicate)/.test(value);

  if (hasPositivePhrasing) {

    return {
      label: "Good",
      icon: CheckCircle,
      style: "text-[var(--color-success)]"
    };

  }

  const hasCountedIssue = /\d+\s+(missing|duplicate)/.test(value);

  if (hasCountedIssue || value.includes("outlier")) {

    return {
      label: "Warning",
      icon: AlertCircle,
      style: "text-[var(--color-accent)]"
    };

  }

  if (value.includes("error") || value.includes("issue")) {

    return {
      label: "High",
      icon: AlertCircle,
      style: "text-[var(--color-danger)]"
    };

  }

  return {

    label: "Info",
    icon: Info,
    style: "text-[var(--color-text-secondary)]"

  };

}


return (

<div className="
bg-[var(--color-surface)]
border
border-[var(--color-border)]
rounded-xl
p-6
mt-8
">


<h2 className="
text-xl
font-semibold
mb-6
">

📌 Analytics Insights

</h2>



<div className="
space-y-4
">


{

insights.map((item:string,index:number)=>{


const severity=getSeverity(item);

const Icon=severity.icon;



return (

<motion.div

key={index}

initial={{
opacity:0,
x:-20
}}

animate={{
opacity:1,
x:0
}}

transition={{
delay:index*0.1
}}


className="
flex
items-start
gap-4
bg-[var(--color-ink)]/40
border
border-[var(--color-border)]
rounded-xl
p-4
"


>


<Icon

size={24}

className={severity.style}

/>



<div className="flex-1">


<div className="
flex
justify-between
mb-2
">


<p className="
text-[var(--color-text-secondary)]
">

{item}

</p>


<span className="
text-xs
px-3
py-1
rounded-full
bg-[var(--color-surface-raised)]
text-[var(--color-text-secondary)]
">

{severity.label}

</span>


</div>



<p className="
text-sm
text-[var(--color-text-muted)]
">

Computed from dataset analysis.

</p>


</div>



</motion.div>


)


})


}


</div>



</div>

)

}