import { ExamSchema } from '@/features/exam/examSchema';

export function RequirementsPanel({ schema }: { schema: any }) {
  const enhancedReqs = Array.isArray(schema?.requirements) ? schema.requirements : null;
  const legacyTypes: string[] =
    schema?.properties?.documents?.items?.properties?.type?.enum || [];

  return (
    <section className="max-w-md mx-auto mb-6 text-sm bg-white p-4 rounded shadow">
      <h2 className="font-semibold mb-4">📋 Document Requirements</h2>
      <div className="space-y-4">
        {enhancedReqs && enhancedReqs.map((req: any) => (
          <div key={req.id} className="border rounded p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{req.displayName}</h3>
                <p className="text-gray-600 text-xs">{req.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                req.mandatory ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {req.mandatory ? 'Required' : 'Optional'}
              </span>
            </div>
            
            <div className="text-xs space-y-1">
              <p>
                <span className="font-medium">Format:</span> {req.format} |{' '}
                <span className="font-medium">Max Size:</span> {req.maxSizeKB}KB |{' '}
                <span className="font-medium">Dimensions:</span> {req.dimensions || 'Any'}
              </p>
              
              {req.validationRules && req.validationRules.length > 0 && (
                <div>
                  <h4 className="font-medium mt-2 mb-1">Validation Rules:</h4>
                  <ul className="ml-4 space-y-1">
                    {req.validationRules.map((rule: any, idx: number) => (
                      <li key={idx} className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          rule.type === 'strict' ? 'bg-red-500' :
                          rule.type === 'soft' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        {rule.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {req.subjective && req.subjective.length > 0 && (
                <div>
                  <h4 className="font-medium mt-2 mb-1">Additional Requirements:</h4>
                  <ul className="ml-4">
                    {req.subjective
                      .filter((sub: any) => sub.confidence >= 0.8) // Show only high confidence requirements
                      .map((sub: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{sub.requirement}</span>
                        </li>
                    ))}
                  </ul>
                </div>
              )}

              {req.commonMistakes && req.commonMistakes.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium text-red-600">Common Mistakes:</h4>
                  <ul className="ml-4">
                    {req.commonMistakes.slice(0, 2).map((mistake: string, idx: number) => (
                      <li key={idx} className="text-red-600 flex items-start gap-2">
                        <span>⚠️</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {req.helpText && (
                <p className="mt-2 text-blue-600">
                  💡 {req.helpText}
                </p>
              )}
            </div>
          </div>
        ))}

        {!enhancedReqs && legacyTypes.length > 0 && (
          <ul className="list-disc ml-4 space-y-1 text-gray-700">
            {legacyTypes.map((type) => (
              <li key={type}>
                <strong>{type}</strong>
                <span className="text-gray-500"> - Standard Document Requirements</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
