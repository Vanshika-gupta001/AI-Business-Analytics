"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Copy
} from "lucide-react";


export default function DataQualityCards({

data

}:{

data:any;

}){


const insights = data.insights || [];


let missingValues = 0;
let duplicateRows = 0;



insights.forEach((item:string)=>{


if(item.toLowerCase().includes("missing values")){

const number = item.match(/\d+/);

if(number){

missingValues += Number(number[0]);

}

}



if(item.toLowerCase().includes("duplicate")){

const number = item.match(/\d+/);

if(number){

duplicateRows = Number(number[0]);

}

}


});




const cards=[

{

title:"Missing Values",

value:missingValues,

description:"Total missing cells detected",

icon:AlertTriangle,

color:"text-[var(--color-accent)]"

},

{

title:"Duplicate Rows",

value:duplicateRows,

description:"Duplicate records found",

icon:Copy,

color:"text-[var(--color-danger)]"

}

];



return (

<div className="
mt-8
grid
grid-cols-1
md:grid-cols-2
gap-6
">


{

cards.map((card,index)=>{


const Icon=card.icon;


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
delay:index*0.1
}}


whileHover={{
scale:1.03
}}


className="
bg-[var(--color-surface)]
border
border-[var(--color-border)]
rounded-xl
p-6
shadow-lg
"


>


<div className="
flex
items-center
gap-3
">


<Icon

size={30}

className={card.color}

/>


<h2 className="
text-lg
font-semibold
">

{card.title}

</h2>


</div>



<h1 className="
text-4xl
font-bold
mt-5
">

{card.value}

</h1>



<p className="
text-[var(--color-text-secondary)]
mt-2
">

{card.description}

</p>



</motion.div>


)


})


}


</div>

)

}