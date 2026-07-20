"use client";

import { useState } from "react";

export default function UploadCSV({setData}: {setData:any}) {

  const [loading,setLoading] = useState(false);


  const uploadFile = async(e:any)=>{

    const file = e.target.files[0];

    if(!file) return;


    const formData = new FormData();

    formData.append("file",file);


    setLoading(true);


    try{

      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method:"POST",
          body:formData
        }
      );


      const result = await response.json();

      console.log(result);

      setData(result);


    }catch(error){

      console.log(error);

    }


    setLoading(false);

  }



return (

<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">

<h2 className="text-xl text-white mb-4">
Upload Dataset
</h2>


<input
type="file"
accept=".csv"
onChange={uploadFile}
className="text-white"
/>


{
loading && 
<p className="text-zinc-400 mt-3">
Analyzing Dataset...
</p>
}


</div>

)

}