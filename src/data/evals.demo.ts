export type EvalRecord = {
  name: string
  type: 'Initial' | 'Annual' | 'Reevaluation' | 'Transfer'
  stage: number
  evaluator: string
  referral: string
  consent: string
  deadline: string
  daysLeft: number
  status: string
}

export const EVAL_STAGES = [
  'Referral Received',
  'Consent Obtained',
  'Assessment Underway',
  'Report Writing',
  'Eligibility Meeting',
  'IEP Meeting',
] as const

export const DEMO_EVALS: EvalRecord[] = [
  {
    name: 'Lily S.',
    type: 'Initial',
    stage: 2,
    evaluator: 'Dr. Reyes',
    referral: '2026-05-15',
    consent: '2026-06-01',
    deadline: '2026-07-31',
    daysLeft: 11,
    status: 'At Risk',
  },
  {
    name: 'Emma T.',
    type: 'Reevaluation',
    stage: 1,
    evaluator: 'Dr. Reyes',
    referral: '2026-06-10',
    consent: '2026-06-20',
    deadline: '2026-08-19',
    daysLeft: 30,
    status: 'On Track',
  },
  {
    name: 'Maya P.',
    type: 'Annual',
    stage: 4,
    evaluator: 'Samantha K.',
    referral: '—',
    consent: '—',
    deadline: '2026-08-25',
    daysLeft: 36,
    status: 'Overdue',
  },
  {
    name: 'Aiden M.',
    type: 'Annual',
    stage: 3,
    evaluator: 'Samantha K.',
    referral: '—',
    consent: '—',
    deadline: '2026-11-15',
    daysLeft: 118,
    status: 'On Track',
  },
  {
    name: 'Noah R.',
    type: 'Transfer',
    stage: 1,
    evaluator: 'Dr. Reyes',
    referral: '2026-07-10',
    consent: 'Pending',
    deadline: '2026-08-09',
    daysLeft: 20,
    status: 'Pending',
  },
]

export const EVAL_CHECKLIST_STEPS = [
  'Referral received',
  'Parent notified of referral (within 5 days)',
  'Consent for Evaluation sent',
  'Consent received (60-day clock STARTS)',
  'Team assembled — evaluators assigned',
  'Assessments underway',
  'Health update completed',
  'Teacher input forms sent & received',
  'Rating scales completed',
  'Observations completed',
  'All reports written',
  'NOM sent (10 calendar days before meeting)',
  'Eligibility meeting held',
  'Eligibility determination made',
  'PWN for eligibility sent',
  'If eligible: Consent for Services sent',
  'IEP meeting scheduled',
  'IEP finalized in Enrich / PRISM',
]
