export type ExamConfig = {
  examId: string;
  examName: string;
  portalUrl: string;
  selectors: {
    photoSpec: string;
    signSpec: string;
    otherDocs?: Record<string, string>;
  };
  requiresAuth?: boolean;
  notes?: string;
};

export const ExamConfigs: Record<string, ExamConfig> = {
  upsc: {
    examId: 'upsc',
    examName: 'UPSC Civil Services',
    portalUrl: 'https://upsc.gov.in/document-guidelines',
    selectors: {
      photoSpec: '#photo-spec',
      signSpec: '#sign-spec',
    },
    notes: 'Selectors may vary across years. Check for dynamic content.',
  },

  ssc: {
    examId: 'ssc',
    examName: 'SSC CGL',
    portalUrl: 'https://ssc.nic.in/Uploads',
    selectors: {
      photoSpec: '.photo-guidelines',
      signSpec: '.signature-guidelines',
    },
    requiresAuth: true,
    notes: 'Requires login to access document specs.',
  },

  ielts: {
    examId: 'ielts',
    examName: 'IELTS Academic',
    portalUrl: 'https://ielts.org/upload-documents',
    selectors: {
      photoSpec: '#passport-photo',
      signSpec: '#signature-upload',
    },
  },
};