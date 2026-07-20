export default function PDFDownloadButton({
  reportPath,
}: {
  reportPath: string;
}) {

  const pdfUrl = `${reportPath.replace("\\", "/")}`;

return (
  <a
    href={pdfUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
  >
    📄 Download Business Report PDF
  </a>
);
} 