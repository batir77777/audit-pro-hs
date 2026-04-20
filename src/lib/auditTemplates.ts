import { AuditTemplate } from '../types';

export const AUDIT_TEMPLATES: AuditTemplate[] = [
  {
    id: 'audit-hs-form',
    title: 'H&S Audit Form',
    category: 'Compliance',
    sections: [
      {
        id: 'sec-general',
        title: 'General Management',
        questions: [
          { id: 'g1', question: 'Is the Health and Safety Policy available?' },
          { id: 'g2', question: 'Are risk assessments in place for all activities?' },
          { id: 'g3', question: 'Is there a designated H&S representative?' }
        ]
      },
      {
        id: 'sec-environment',
        title: 'Work Environment',
        questions: [
          { id: 'e1', question: 'Is the workplace clean and tidy?' },
          { id: 'e2', question: 'Is lighting and ventilation adequate?' },
          { id: 'e3', question: 'Are emergency exits clearly marked?' }
        ]
      }
    ]
  },
  {
    id: 'audit-monthly-safety',
    title: 'Monthly Site Safety Audit',
    category: 'Compliance',
    sections: [
      {
        id: 'sec-admin',
        title: 'Documentation & Admin',
        questions: [
          { id: 'q1', question: 'Is the Health & Safety Law poster displayed?' },
          { id: 'q2', question: 'Are insurance certificates valid and displayed?' },
          { id: 'q3', question: 'Is the F10 notification displayed (if applicable)?' },
          { id: 'q4', question: 'Are training records up to date for all staff?' }
        ]
      },
      {
        id: 'sec-site',
        title: 'Site Conditions',
        questions: [
          { id: 'q5', question: 'Is the site perimeter secure and well-maintained?' },
          { id: 'q6', question: 'Are all walkways clear of trip hazards and debris?' },
          { id: 'q7', question: 'Is site lighting adequate for all work areas?' },
          { id: 'q8', question: 'Are welfare facilities clean and correctly stocked?' }
        ]
      },
      {
        id: 'sec-ppe',
        title: 'PPE & Equipment',
        questions: [
          { id: 'q9', question: 'Is mandatory PPE being worn by all personnel?' },
          { id: 'q10', question: 'Are all power tools PAT tested and in good condition?' },
          { id: 'q11', question: 'Is lifting equipment within its inspection date?' }
        ]
      },
      {
        id: 'sec-fire',
        title: 'Fire & Emergencies',
        questions: [
          { id: 'q12', question: 'Are fire escape routes clearly marked and clear?' },
          { id: 'q13', question: 'Are fire extinguishers correctly positioned and serviced?' },
          { id: 'q14', question: 'Is the fire alarm system tested weekly?' }
        ]
      }
    ]
  }
];
