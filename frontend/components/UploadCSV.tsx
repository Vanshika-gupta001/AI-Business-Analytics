"use client";

import { useState } from "react";

import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import { apiFetch } from "../lib/api";


export default function UploadCSV({

setData

}:{

setData:any;

}){


const [file,setFile] = useState<File | null>(null);

const [loading,setLoading] = useState(false);

const [error,setError] = useState("");

const [success,setSuccess] = useState("");



async function uploadFile(){


if(!file){

setError("Please select a CSV file first.");

return;

}



setLoading(true);

setError("");

setSuccess("");



const formData = new FormData();


formData.append(
"file",
file
);



try{


const response = await apiFetch(

"/upload",

{

method:"POST",

body:formData

}

);




const result = await response.json();




if(!response.ok){

throw new Error(
result.detail || "Upload failed"
);

}




console.log(
"UPLOAD RESPONSE:",
result
);




setData(result);


setSuccess(
"Dataset analyzed successfully!"
);



}

catch(error:any){


console.error(
"UPLOAD ERROR:",
error
);


setError(
error.message || "Something went wrong."
);


}


finally{


setLoading(false);


}


}





return (


<div

className="
bg-[var(--color-accent)]/5
backdrop-blur-xl

border
border-white/10

rounded-xl

p-8



mt-6
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
rounded-xl
bg-[var(--color-accent-dim)]
"

>

<UploadCloud

className="text-[var(--color-accent)]"

size={30}

/>

</div>



<div>


<h2 className="text-2xl font-semibold">

Upload Dataset

</h2>


<p className="text-[var(--color-text-secondary)] text-sm">

Upload CSV and generate AI insights

</p>


</div>


</div>





<label


className="

cursor-pointer

border-2

border-dashed

border-[var(--color-border)]

rounded-xl

p-10

flex

flex-col

items-center

justify-center

hover:border-[var(--color-accent)]

transition

bg-[var(--color-ink)]/30

"

>



<UploadCloud

size={45}

className="text-[var(--color-text-secondary)] mb-4"

/>



<p className="text-[var(--color-text-secondary)] font-medium">

Drag & Drop CSV File

</p>



<p className="text-[var(--color-text-muted)] text-sm mt-2">

or click to browse

</p>



<input


type="file"

accept=".csv"


hidden


onChange={(e)=>{


const selected =
e.target.files?.[0];


if(selected){


setFile(selected);


}


}}


/>


</label>





{
file &&


<div

className="
mt-5

bg-[var(--color-ink)]

border
border-[var(--color-border)]

rounded-xl

p-4

flex
items-center
gap-3

"

>


<FileSpreadsheet

className="text-[var(--color-success)]"

/>



<div>

<p className="font-medium">

{file.name}

</p>


<p className="text-xs text-[var(--color-text-muted)]">

Ready for analysis

</p>


</div>



</div>

}





{
success &&


<div

className="
mt-4
flex
items-center
gap-2
text-[var(--color-success)]
text-sm
"

>

<CheckCircle size={18}/>

{success}

</div>


}





{
error &&


<div

className="
mt-4
flex
items-center
gap-2
text-[var(--color-danger)]
text-sm
"

>

<AlertCircle size={18}/>

{error}

</div>


}







<button


onClick={uploadFile}


disabled={!file || loading}



className="

mt-6

w-full

bg-[var(--color-accent)]

text-[var(--color-ink)]

rounded-xl

py-3

font-semibold

hover:opacity-90

transition

disabled:opacity-40

flex

items-center

justify-center

gap-2

"


>



{

loading ?

<>

<Loader2

className="animate-spin"

/>

Analyzing Dataset...

</>


:

"Analyze Dataset"


}



</button>



</div>


)

}