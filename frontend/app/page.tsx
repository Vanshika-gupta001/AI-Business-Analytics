"use client";

import { useState } from "react";

import UploadCSV from "@/components/UploadCSV";
import HealthCard from "@/components/HealthCard";
import DatasetCard from "@/components/DatasetCard";
import AISummaryCard from "@/components/AISummaryCard";
import BusinessAIReportCard from "@/components/BusinessAIReportCard";
import ChartGallery from "@/components/ChartGallery";
import PDFDownloadButton from "@/components/PDFDownloadButton";
import DashboardStats from "@/components/DashboardStats";
import RecommendationCard from "@/components/RecommendationCard";
import HealthGauge from "@/components/HealthGauge";
import ChartCard from "@/components/ChartCard";
import AIChat from "@/components/AIChat";


export default function Home() {

  const [data,setData] = useState<any>(null);


  return (

    <main className="min-h-screen bg-black text-white p-8">


      {/* Header */}

      <div className="mb-10">

        <h1 className="text-4xl font-bold">
          AI Business Analytics Dashboard
        </h1>

        <p className="text-zinc-400 mt-2">
          Upload your dataset and get AI-powered business insights.
        </p>

      </div>


      {/* Upload Section */}

      <UploadCSV setData={setData}/>



      {
        data &&

        <div className="mt-10 space-y-6">


          {/* Top Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            <HealthCard

              score={data.health_score}

              status={data.status}

              grade={data.grade}

            />
            <HealthGauge
              score={data.health_score}
            />

            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">

              <h2 className="text-lg text-zinc-400">
                File Name
              </h2>

              <p className="text-2xl font-bold mt-3">
                {data.filename}
              </p>

            </div>


          </div>


          {/* Dataset Information */}

          <DatasetCard

            data={data.dataset_info}

          />

          <DashboardStats data={data}/>
          <RecommendationCard
           recommendations={data.recommendations}
          />


          {/* AI Summary */}

          <AISummaryCard

            summary={data.ai_summary}

          />

          {/* Business Report */}

          {
            data.business_ai &&

            <BusinessAIReportCard

              report={data.business_ai}

            />

          }
          <AIChat dataset = {data}/>


          {/* Charts */}

          {
            data.charts &&

            <ChartCard
              charts={data.charts}
            />

          }


          {/* PDF */}

          {
            data.report &&

            <PDFDownloadButton

              reportPath={data.report}

            />

          }



        </div>

      }



    </main>

  );
}