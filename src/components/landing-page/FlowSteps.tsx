export function FlowSteps() {
  const steps = [
    { icon: '🎯', label: 'Select Exam' },
    { icon: '📂', label: 'Upload Files' },
    { icon: '📦', label: 'Download ZIP' },
  ];

  return (
    <section className="py-8 px-4 bg-gray-50 text-center">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">How It Works</h2>
      <div className="flex justify-center gap-6">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col items-center text-sm">
            <span className="text-3xl">{step.icon}</span>
            <span className="mt-2 text-gray-600">{step.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
