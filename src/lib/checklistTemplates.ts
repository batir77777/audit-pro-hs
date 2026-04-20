import { ChecklistTemplate } from '../types';

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'temp-site-safety',
    title: 'Daily Site Safety Inspection',
    category: 'General Safety',
    items: [
      { id: 'q1', question: 'Are all workers wearing correct PPE?' },
      { id: 'q2', question: 'Is the site perimeter secure and signed?' },
      { id: 'q3', question: 'Are access and egress routes clear of obstructions?' },
      { id: 'q4', question: 'Is all plant and equipment in good working order?' },
      { id: 'q5', question: 'Are hazardous substances stored correctly?' },
      { id: 'q6', question: 'Is the first aid kit accessible and fully stocked?' },
      { id: 'q7', question: 'Are fire extinguishers in place and inspected?' },
      { id: 'q8', question: 'Is site lighting adequate for the tasks?' },
      { id: 'q9', question: 'Are welfare facilities clean and functional?' },
      { id: 'q10', question: 'Is waste being managed and stored correctly?' }
    ]
  },
  {
    id: 'temp-dse-checklist',
    title: 'Computer DSE Checklist',
    category: 'Office Safety',
    items: [
      { id: 'd1', question: 'Is the chair height and backrest correctly adjusted?' },
      { id: 'd2', question: 'Is the screen at the correct height and distance?' },
      { id: 'd3', question: 'Is there enough space for the keyboard and mouse?' },
      { id: 'd4', question: 'Are there any reflections or glare on the screen?' },
      { id: 'd5', question: 'Is the workstation area clear of trip hazards?' }
    ]
  },
  {
    id: 'temp-construction-site',
    title: 'Construction Site Checklist',
    category: 'Construction',
    items: [
      { id: 'c1', question: 'Is the F10 notification displayed if required?' },
      { id: 'c2', question: 'Are excavations correctly shored or battered?' },
      { id: 'c3', question: 'Is edge protection in place for work at height?' },
      { id: 'c4', question: 'Are plant operators holding valid CPCS/NPORS cards?' },
      { id: 'c5', question: 'Is the site traffic management plan being followed?' }
    ]
  },
  {
    id: 'temp-lone-worker',
    title: 'Lone Worker Checklist',
    category: 'General Safety',
    items: [
      { id: 'l1', question: 'Is the lone worker carrying a functional mobile phone?' },
      { id: 'l2', question: 'Has a check-in schedule been established and followed?' },
      { id: 'l3', question: 'Does the worker have access to first aid facilities?' },
      { id: 'l4', question: 'Has a specific risk assessment been completed for the task?' },
      { id: 'l5', question: 'Is there an emergency procedure in place?' }
    ]
  },
  {
    id: 'temp-manual-handling',
    title: 'Manual Handling Checklist',
    category: 'General Safety',
    items: [
      { id: 'm1', question: 'Has the load been assessed for weight and stability?' },
      { id: 'm2', question: 'Is the path clear of obstructions and slip hazards?' },
      { id: 'm3', question: 'Are mechanical aids available and being used?' },
      { id: 'm4', question: 'Have workers been trained in correct lifting techniques?' },
      { id: 'm5', question: 'Is the task within the individual\'s capability?' }
    ]
  },
  {
    id: 'temp-general-hs',
    title: 'General H&S Checklist',
    category: 'General Safety',
    items: [
      { id: 'g1', question: 'Is the H&S Law poster displayed and up to date?' },
      { id: 'g2', question: 'Are fire exits clear and correctly signed?' },
      { id: 'g3', question: 'Is the accident book available and being used?' },
      { id: 'g4', question: 'Are electrical items within their PAT test date?' },
      { id: 'g5', question: 'Is the workplace temperature and ventilation adequate?' }
    ]
  }
];
