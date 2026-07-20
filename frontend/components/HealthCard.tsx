"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";


export default function HealthCard({
  score,
  status,
  grade,
}: {
  score: number;
  status: string;
  grade: string;
}) {

  return (

    <motion.div
      initial={{opacity:0, y:20}}
      animate={{opacity:1, y:0}}
      transition={{duration:0.5}}

      className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 
      hover:border-blue-500 transition"
    >

      <div className="flex items-center gap-3">

        <Activity className="text-blue-400" size={28}/>

        <h2 className="text-lg text-zinc-300">
          Data Health Score
        </h2>

      </div>


      <div className="mt-5 text-5xl font-bold">

        {score}

        <span className="text-zinc-500 text-2xl">
          /100
        </span>

      </div>


      <div className="flex gap-3 mt-5">

        <span className="px-4 py-1 rounded-full bg-green-600 text-sm">
          {status}
        </span>


        <span className="px-4 py-1 rounded-full bg-blue-600 text-sm">
          Grade {grade}
        </span>

      </div>


    </motion.div>

  );
}