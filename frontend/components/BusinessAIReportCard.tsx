export default function BusinessAIReportCard({
  report,
}: {
  report: string;
}) {

  return (

    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full mt-6">

      <h2 className="text-xl font-semibold text-white mb-5">
        📊 Business AI Report
      </h2>


      <div className="text-zinc-300 leading-7 whitespace-pre-line">
        {report}
      </div>


    </div>

  );
}