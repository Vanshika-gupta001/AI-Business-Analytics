"use client";

import { motion } from "framer-motion";
import { UploadCloud, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth-context";


export default function DashboardHeader(){

const { user, logout } = useAuth();

return (

<motion.div

initial={{
opacity:0,
y:-20
}}

animate={{
opacity:1,
y:0
}}

transition={{
duration:0.5
}}

className="
mb-10
bg-[var(--color-surface)]
border
border-[var(--color-border)]
rounded-xl
p-8
"

>


<div className="
flex
items-center
gap-4
">


<div className="
w-12
h-12
rounded-lg
bg-[var(--color-accent-dim)]
flex
items-center
justify-center
flex-shrink-0
">

<span className="data-num text-[var(--color-accent)] text-lg font-semibold">AI</span>

</div>



<div>

<h1 className="
text-3xl
font-semibold
text-[var(--color-text-primary)]
tracking-tight
">

AI Business Analytics

</h1>


<p className="
text-[var(--color-text-secondary)]
mt-1.5
text-base
">

Upload a dataset to profile its quality, train a baseline model, and query it in plain language.

</p>


</div>


{user && (

<button
onClick={logout}
className="
ml-auto
flex
items-center
gap-2
text-sm
text-[var(--color-text-muted)]
hover:text-[var(--color-text-primary)]
transition
"
>

<span>{user.email}</span>

<LogOut size={16}/>

</button>

)}


</div>



<div className="
flex
items-center
gap-2
mt-6
pt-6
border-t
border-[var(--color-border)]
text-sm
text-[var(--color-text-muted)]
">


<UploadCloud size={16}/>

CSV in, insights out — profiling, anomaly detection, and a trained model on every upload

</div>


</motion.div>

);

}