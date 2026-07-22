/**
 * Arrowhead / CCSD MTSS toolkit content curated from school 25-26 pack.
 * Process guidance only — no student PHI.
 */

export const ARROWHEAD_FLOW_STEPS = [
  'Student below grade level on STAR (or similar) → review Math / Literacy / Behavior / Language Tier 2 supports for gen-ed classroom implementation.',
  'Start collecting growth data on the MTSS Data Sheet while Tier 2 is in place.',
  'Collaborate with grade-level team / coaches for additional ideas.',
  'If adequate growth → continue supports. If not → contact family (parent input section of Data Sheet).',
  'Target one specific skill + choose a weekly progress-monitoring tool; provide Tier 2 small-group / individualized instruction.',
  'Progress monitor weekly for 4–6 weeks and record scores.',
  'If growth still inadequate → complete MTSS referral / consult form for scheduling.',
  'Before the MTSS meeting: finish Referral Form, Student Profile + parent input, Body of Evidence (MLL), and link the Data Sheet.',
  'After ~2 rounds (~12 weeks) without adequate growth → gather more information through evaluation (DAT + Enrich paths as required).',
] as const

export const TEACHER_CHECKLIST = [
  {
    id: 'cum-file',
    label:
      'Check cumulative records (prior academics, attendance, WIDA Access if MLL, previous interventions/accommodations).',
  },
  {
    id: 'nurse-els',
    label: 'Talk with nurse (hearing/vision/health). If MLL, consult ELS teacher.',
  },
  {
    id: 'grade-team',
    label:
      'Discuss with grade-level team (include prior / specials teachers as needed). Confirm Tier 1 fidelity + document classroom differentiation.',
  },
  {
    id: 'parent-contact',
    label: 'Contact parents/guardians — gather ideas, share concerns and classroom supports.',
  },
  {
    id: 'six-week',
    label:
      'Implement targeted intervention and collect data for ~6 weeks (dates, frequency, minutes, ratio, program, pre/post).',
  },
  {
    id: 'decide',
    label:
      'If adequate progress → continue/adjust and inform family. If little/no progress → submit Consult Request for multidisciplinary MTSS meeting.',
  },
  {
    id: 'referral-form',
    label: 'Complete MTSS Referral Form before the scheduled meeting (notes will be shared).',
  },
] as const

export const PM_TOOLS: { domain: string; tools: string[] }[] = [
  {
    domain: 'Reading',
    tools: [
      'Star CBM (my.cherrycreek / Renaissance)',
      'DIBELS (PA, NWF, ORF)',
      'Heggerty',
      'PAST',
      'Diagnostic Decoding Survey',
      'CORE Phonics Survey',
      'HMH comprehension measures',
    ],
  },
  {
    domain: 'Math',
    tools: [
      'Bridges Standards-Based Measuring Tools',
      'EasyCBM',
      'Acadience Math Probes',
      'Star CBM Math',
    ],
  },
  {
    domain: 'Writing',
    tools: ['MWIP Rubric', 'QSI (HMH)', 'Writing CBM / Probe Generator'],
  },
  {
    domain: 'Behavior',
    tools: ['PBIS World', 'Behavior charts / anecdotal notes', 'Discipline referral patterns'],
  },
  {
    domain: 'Language / Speech',
    tools: [
      'Grade-level SLP screening checklists (RTI Guide)',
      'Speech RTI Progress/Data Form (weekly 1–6)',
      'Teacher Progress/Data Form',
      'Classroom language samples / intelligibility ratings',
    ],
  },
]

export const SUPPORT_MENUS: {
  id: string
  title: string
  identify: string[]
  tier2: string[]
  materials: string[]
  intensify: string[]
  data: string[]
}[] = [
  {
    id: 'math',
    title: 'Math supports',
    identify: [
      'Number sense',
      'Place value',
      'Whole number ID/sequence',
      'Add/subtract',
      'Multiply/divide',
      'Algebraic thinking',
      'Reasoning / calculations',
    ],
    tier2: [
      '1:1 conferences',
      'Differentiated small-group instruction',
      'Condensed / differentiated assignments',
      'Flexible grouping',
      'Pre-teach vocabulary',
      'Build / access background knowledge',
      'Modeling + manipulatives',
    ],
    materials: ['Bridges Intervention', 'ST Math', 'StarMath CBM'],
    intensify: [
      'Parent contact for background',
      'Smaller group / 1:1',
      'Accommodations: Read&Write, breaks, oral presentation, extended time, preferential seating, manipulatives',
    ],
    data: ['CCSD baselines', 'STAR', 'Pre/post unit', 'Observational / anecdotal', 'Homework'],
  },
  {
    id: 'literacy',
    title: 'Literacy supports',
    identify: [
      'Sound discrimination',
      'Sound/symbol',
      'Power words',
      'Vocabulary',
      'Segmenting',
      'Literary elements',
      'Expository text',
      'Motivation / specific comprehension skill',
    ],
    tier2: [
      '1:1 conferences',
      'Differentiated instruction / assignments',
      'Thinking Maps',
      'Instructional-level materials',
      'Modality strengths',
      'Interactive read-aloud / pair reading',
      'Pre-teach vocabulary',
      'Modeling',
    ],
    materials: ['Fundations', 'STAR CBMs', 'Geodes', 'Orton-Gillingham', 'Comprehension Toolkit'],
    intensify: [
      'Parent contact',
      'Small group / 1:1',
      'Accommodations: Read&Write, breaks, oral presentation, extended time, preferential seating',
    ],
    data: [
      'Thinking Maps',
      'HMH weekly/unit',
      'CMAS',
      'Fundations work',
      'Running records / cold reads',
      'STAR / STAR-CBM',
    ],
  },
  {
    id: 'behavior',
    title: 'Behavior / SEL supports',
    identify: [
      'Noncompliance / directions',
      'Verbal or physical behavior',
      'Impulsivity / inattention / hyperactivity',
      'Executive functioning',
      'Peer conflict',
      'Transitions',
      'Emotional regulation',
    ],
    tier2: [
      '1:1 conferences',
      'Classwide behavior contract',
      'Second Step',
      'Consistent parent contact',
      'Morning / family meetings',
      'PRIDE practices',
      'De-escalation / trauma-informed (HEARTS)',
      'Relationship building',
    ],
    materials: ['Second Step handouts', 'Think sheets', 'Individual behavior contract'],
    intensify: [
      'Parent contact',
      'Lunch meeting',
      'Check-in / Check-out',
      'Individual behavior chart',
      'Preferential seating / Ready-Do-Done',
    ],
    data: ['Anecdotal notes', 'Behavior chart', 'Discipline referrals', 'Teacher observation'],
  },
]

export const REFERRAL_CONCERN_AREAS = [
  'Reading',
  'Math',
  'Writing / Spelling',
  'Speech / Articulation',
  'Language (expressive / receptive / pragmatic)',
  'Behavior / SEL',
  'Executive functioning',
  'Attendance / health',
] as const

export const PARENT_INPUT_PROMPTS = [
  "What is your child's educational history (retention, schools, preschool / Child Find speech or OT)?",
  'How would your child describe an average school day? How is homework going?',
  "Describe your child's strengths and any concerns you have.",
  'Any developmental milestone or pregnancy / birth concerns?',
  'Any medical concerns or family history of learning differences / ADHD?',
] as const

export const SST_PREMEETING_SECTIONS = [
  'Academic performance (benchmarks, classroom, work samples)',
  'Behavior & engagement (on-task, stamina, initiation, tracking)',
  'Interventions tried (start, frequency, group size, target, progress)',
  'Barriers (skill gaps, attention/EF, SEL, ELL, attendance)',
  'Student strengths & motivators',
  'Caregiver communication summary',
  'Next steps / SST referral Y/N / follow-up date',
] as const
