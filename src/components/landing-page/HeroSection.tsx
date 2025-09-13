export function HeroSection() {
  return (
    <section className="text-center py-12 px-4 bg-white">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">📄 ExamDoc Uploader</h1>
      <p className="text-gray-600 text-sm max-w-xl mx-auto">
        Schema-aware document validation and packaging for SSC, UPSC, and IELTS. Upload your files, validate them instantly, and download a submission-ready ZIP — all in one flow.
      </p>
      <a
        href="/select"
        className="mt-6 inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 text-sm"
      >
        Start Uploading
      </a>
    </section>
  );
}
