"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import UploadCSV from "@/components/UploadCSV";

import DashboardHeader from "@/components/DashboardHeader";
import MetricCards from "@/components/MetricCards";
import HealthCard from "@/components/HealthCard";
import DatasetCard from "@/components/DatasetCard";
import DataQualityCards from "@/components/DataQualityCards";
import DatasetPreviewTable from "@/components/DatasetPreviewTable";
import ColumnStatsTable from "@/components/ColumnStatsTable";

import AISummaryCard from "@/components/AISummaryCard";
import BusinessAIReportCard from "@/components/BusinessAIReportCard";

import ChartGallery from "@/components/ChartGallery";

import AIRecommendations from "@/components/AIRecommendations";
import InsightsTimeline from "@/components/InsightsTimeline";
import PredictiveModelCard from "@/components/PredictiveModelCard";

import PDFDownloadButton from "@/components/PDFDownloadButton";

import AIChat from "@/components/AIChat";
import OnboardingBot from "@/components/OnboardingBot";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api";

import AnomalyDetectionCard from "@/components/AnomalyDetectionCard";
import BusinessRecommendationsCard from "@/components/BusinessRecommendationsCard";

import ScenarioSimulatorCard from "@/components/ScenarioSimulatorCard";

function DashboardContent(){

const { user, loading: authLoading } = useAuth();
const router = useRouter();
const searchParams = useSearchParams();

const [data,setData] = useState<any>(null);
const [showUploader,setShowUploader] = useState(true);
const [chatSignal,setChatSignal] = useState(0);

useEffect(() => {
  if (!authLoading && !user) {
    router.push("/login");
  }
}, [authLoading, user, router]);

// Handle cross-page navigation: /?dataset=<id> (from History page) and
// /?openChat=1 (from Sidebar's Ava link when not already on this page).
useEffect(() => {

  if (!user) return;

  const datasetId = searchParams.get("dataset");
  const openChat = searchParams.get("openChat");

  if (datasetId) {

    apiFetch(`/datasets/${datasetId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result) setData(result);
      })
      .catch((err) => console.error("Failed to load dataset:", err));

  }

  if (openChat) {
    setChatSignal((s) => s + 1);
  }

  if (datasetId || openChat) {
    router.replace("/");
  }

}, [user]); // eslint-disable-line react-hooks/exhaustive-deps

// Handle same-page section links coming in as a URL hash (e.g. /#insights
// after Sidebar navigates back from another route).
useEffect(() => {

  if (!data?.dataset_info) return;

  const hash = window.location.hash?.replace("#", "");

  if (hash) {

    const timeout = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timeout);

  }

}, [data]);

useEffect(() => {

  if (data?.dataset_info) {
    setShowUploader(false);
  }

}, [data]);

if (authLoading || !user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-ink)] text-[var(--color-text-secondary)]">
      Loading...
    </div>
  );
}


return (

<div className="flex">


<Sidebar onOpenChat={()=>setChatSignal(s=>s+1)}/>


<main

className="
md:ml-64
min-h-screen
flex-1
min-w-0

bg-[var(--color-ink)]

text-[var(--color-text-primary)]

p-6
md:p-8
"

>


<DashboardHeader/>


<OnboardingBot

message={`Welcome, ${user.full_name || user.email}! Here's how to get started:

1. Upload a CSV using the panel below.
2. I'll profile it, flag data-quality issues, and generate charts automatically.
3. Head to Predictive Modeling to train a real model, or ask me anything about your data in the chat.`}

storageKey={`onboarding_dashboard_${user.id}`}

/>




{showUploader ? (

<UploadCSV

setData={setData}

/>

) : (

<button

onClick={()=>setShowUploader(true)}

className="
flex
items-center
gap-2
text-sm
text-[var(--color-text-secondary)]
hover:text-[var(--color-accent)]
bg-[var(--color-surface)]
border
border-[var(--color-border)]
hover:border-[var(--color-accent)]
rounded-lg
px-4
py-2.5
transition-colors
"

>

📤 Upload a different dataset

</button>

)}




{
data?.dataset_info &&

<div

className="
mt-10
space-y-8
"

>


{/* Top Metrics */}

<div id="dashboard">

<MetricCards

data={data}

/>

</div>



{/* Health */}

<HealthCard

score={data.health_score ?? 0}

status={data.status ?? "Analyzed"}

grade={data.grade ?? "N/A"}

/>





{/* Dataset */}

<DatasetCard

data={data.dataset_info}

/>


{/* Quality */}

<DataQualityCards

data={data}

/>





{/* Preview Table */}

<div id="dataset">

<DatasetPreviewTable

data={data}

/>

</div>





{/* Column Statistics */}

<ColumnStatsTable

data={data}

/>





{/* Insights */}

<div id="insights">

<InsightsTimeline

data={data}

/>

</div>



{/* Anomaly Detection */}

<AnomalyDetectionCard

data={data}

/>

{/* Predictive Modeling */}

<div id="predictive">

<PredictiveModelCard

data={data}

/>

</div>


<div id="scenario">
  <ScenarioSimulatorCard data={data} />
</div>


{/* Recommendations */}

<AIRecommendations

data={data}

/>


{/* Business Recommendations */}

<BusinessRecommendationsCard

data={data}

/>


{/* AI Summary */}

<AISummaryCard

summary={
data.ai_summary ??
"No AI summary available."
}

/>





{/* Business Report */}

<BusinessAIReportCard

report={
data.business_ai ??
"No business report available."
}

/>





{/* Charts */}

<div id="reports" className="space-y-6">

{
data.charts?.length > 0 &&

<ChartGallery

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





</div>

}





{/* AI Chat always available */}

<AIChat

dataset={data}

openSignal={chatSignal}

/>





</main>


</div>

)

}


export default function Home() {

  return (

    <Suspense

      fallback={

        <div className="min-h-screen flex items-center justify-center bg-[var(--color-ink)] text-[var(--color-text-secondary)]">
          Loading...
        </div>

      }

    >

      <DashboardContent />

    </Suspense>

  );

}