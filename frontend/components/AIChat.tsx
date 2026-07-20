"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";


export default function AIChat({
  dataset
}: {
  dataset: any
}) {

    
const [open,setOpen] = useState(false);
const [message,setMessage] = useState("");
const [reply,setReply] = useState("");
const [loading,setLoading] = useState(false);



async function sendMessage(){

if(!message.trim()) return;

setLoading(true);


try {

const res = await fetch(
    "http://127.0.0.1:8000/chat",
    {
        method:"POST",
        headers:{
        "Content-Type":"application/json"
        },
        body: JSON.stringify({
        message: message,
        dataset: null
        })
    }
);


const data = await res.json();

setReply(data.reply);

}

catch(error){

setReply("Something went wrong.");

}

finally{

setLoading(false);

}


setMessage("");

}



return (

<>


{/* Floating Button */}

<button

onClick={()=>setOpen(!open)}

className="
fixed bottom-6 right-6
bg-white text-black
w-14 h-14
rounded-full
shadow-xl
flex items-center justify-center
hover:scale-110
transition
z-50
"

>

{
open ?
<X size={28}/>
:
<MessageCircle size={28}/>
}

</button>





{/* Chat Window */}

{

open &&

<div

className="
fixed
bottom-24
right-6
w-80
bg-zinc-900
border border-zinc-700
rounded-2xl
shadow-2xl
p-5
z-40
"

>


<h2 className="
text-lg 
font-bold 
mb-4
">

🤖 AI Business Assistant

</h2>



<div

className="
h-40
overflow-y-auto
bg-black
rounded-xl
p-3
text-sm
text-zinc-300
"

>


{
reply ?

<div className="
bg-zinc-800
rounded-xl
p-3
">

{reply}

</div>

:

<p className="text-zinc-500">
Ask me about your dataset...
</p>

}


</div>




<div className="
flex
gap-2
mt-4
">


<input

value={message}

onChange={(e)=>setMessage(e.target.value)}

placeholder="Ask something..."

className="
flex-1
bg-black
border
border-zinc-700
rounded-xl
px-3
py-2
outline-none
"

/>



<button

onClick={sendMessage}

className="
bg-white
text-black
rounded-xl
px-3
hover:scale-105
transition
"

>

<Send size={18}/>

</button>


</div>



{

loading &&

<p className="text-xs text-zinc-500 mt-2">
AI is thinking...
</p>

}



</div>

}


</>

)

}