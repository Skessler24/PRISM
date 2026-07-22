/**
 * SLP RTI Guide content — curated from Samantha Kessler, M.S. CCC-SLP
 * "Response to Intervention: A Guide for the Speech/Language Pathologist (Grades K-5)".
 * Companion toolkit only; not a substitute for clinical judgment.
 */

export const SLP_RTI_META = {
  title: 'Complete RTI Guide for the SLP',
  subtitle: 'Language & Articulation · Grades K–5',
  author: 'Samantha Kessler, M.S. CCC-SLP',
} as const

export const SLP_TIER_DEFS = [
  {
    tier: 1,
    name: 'Universal',
    summary:
      'All students receive high-quality, classroom-wide instruction in general education. Activities are research-based language-learning opportunities that can be tailored for individuals.',
    slpRole: [
      'Screen for communication needs that influence literacy (vocabulary, comprehension, print knowledge, oral language).',
      'Team with teachers to review work, assessments, and data for possible communication needs.',
      'Observe classroom expectations; help adapt them to improve communication access.',
      'Help design data-collection systems; connect with families for home language/literacy support.',
      'Provide language-rich materials, train aides, share accommodation guidelines (visuals, reminders), and model strategies.',
    ],
  },
  {
    tier: 2,
    name: 'Targeted',
    summary:
      'Students with known risk factors or lagging progress receive more intensive, specialized prevention/remediation (differentiated instruction) within general education — typically small groups.',
    slpRole: [
      'Push-in to assist Tier decisions (intensify / fade).',
      'Provide in-depth screening of strengths/weaknesses.',
      'Participate in progress monitoring for small-group instruction.',
      'Pre-teach / re-teach curricular concepts; adapt materials as needed.',
      'Instruction may be classroom-based or pull-out.',
    ],
  },
  {
    tier: 3,
    name: 'Intensive',
    summary:
      'For students who do not make expected progress with Tier 2. More intensive, frequent, individualized (often 1:1) intervention continues with progress monitoring — and/or the student is referred for a comprehensive multidisciplinary evaluation for SPED eligibility.',
    slpRole: [
      'Intensify intervention (very small group or one-on-one; may teach prerequisite skills).',
      'Continue repeated progress monitoring to guide decisions.',
      'Determine whether to refer for a full speech-language evaluation.',
    ],
  },
] as const

export const SLP_RTI_CYCLE = [
  'Complete screening → fill Screening Summary; share copies with educators/parents as appropriate.',
  'If deficit identified: teacher + SLP complete grade-level checklist, areas of concern, and an intervention plan (RTI Summary Form + Therapist & Teacher Progress/Data forms).',
  'Implement ~6 weeks of intervention with weekly data.',
  'Meet again: review goals/strategies; continue another cycle if needed (post-screening can guide this).',
  'If no further cycle needed: complete Continuation Plan for the student file so others can carry strategies forward.',
  'After second round: decide whether a full SLP evaluation is still indicated (post-screening + team judgment). Align with school MTSS / DAT / Enrich referral rules when moving to eval.',
] as const

export const SLP_RTI_CHECKLIST = [
  { id: 'screen', label: 'Screening completed + Screening Summary shared' },
  { id: 'grade-checklist', label: 'Grade-level checklist + areas of concern documented' },
  { id: 'plan', label: 'RTI Summary / intervention plan with goals & strategies' },
  { id: 'week-data', label: 'Therapist Progress/Data Form weeks 1–6 started' },
  { id: 'teacher-data', label: 'Teacher Progress/Data Form in use in classroom' },
  { id: 'six-week-meet', label: '6-week teacher + SLP progress meeting held' },
  { id: 'continue-or-eval', label: 'Continuation Plan OR second cycle OR eval decision documented' },
] as const

/** Compact articulation acquisition notes from the guide (K–1 focus). */
export const ARTIC_NORMS = [
  {
    band: 'By end of Kindergarten (≈ ages 5–6)',
    sounds: 'Prior sounds typically correct: h, w, m, n, b, p, f, d, t, k, g, y, ng (sing)',
  },
  {
    band: 'By age 6',
    sounds: 'Emerging/expected: l, v, j, sh (shoe), ch (chief)',
  },
  {
    band: 'Grade 1 talking target',
    sounds: 'Says all speech sounds clearly; most listeners understand the student',
  },
] as const

export const K_MILESTONE_CLUSTERS = [
  {
    title: 'Listening',
    items: [
      'Understands short conversations',
      'Listens to/understands short books written for kindergarten',
      'Understands what is taught in class',
    ],
  },
  {
    title: 'Talking',
    items: [
      'Answers yes/no and open-ended questions',
      'Speaks clearly enough for most people to understand',
      'Retells a story or parts of a story',
      'Takes turns / stays on topic; starts conversations',
    ],
  },
  {
    title: 'Reading readiness',
    items: [
      'Knows words are made of sounds; finds rhymes / shared sounds',
      'Finds uppercase and lowercase letters',
      'Tells a story from pictures',
    ],
  },
  {
    title: 'Writing readiness',
    items: [
      'Prints first and last name',
      'Writes uppercase and lowercase letters',
      'Draws pictures that tell a story; names/writes words about the picture',
    ],
  },
] as const

export function buildSpeechRtiDataFormTemplate(opts: {
  studentName: string
  grade: string
  teacher: string
  therapist: string
  goals: string[]
}): string {
  const goals = (opts.goals.length ? opts.goals : ['', '', '', '']).slice(0, 4)
  const weekRows = [1, 2, 3, 4, 5, 6]
    .map((w) => `Week ${w}: Goal1 ____  Goal2 ____  Goal3 ____  Goal4 ____`)
    .join('\n')
  return `Speech RTI Progress/Data Form
Student: ${opts.studentName || '_______________'}    Grade: ${opts.grade || '____'}
Teacher: ${opts.teacher || '_______________'}    Therapist: ${opts.therapist || '_______________'}

Therapist goals:
1. ${goals[0] || '________________________________'}
2. ${goals[1] || '________________________________'}
3. ${goals[2] || '________________________________'}
4. ${goals[3] || '________________________________'}

Weekly data:
${weekRows}

Intervention reflection:
- Significant progress on goals? 
- Strategies that worked best across settings?
- Strategies that hindered progress?
- Can the student use strategies independently? Where does support still need to fade?

Next decision: ☐ Continue Tier 2/3 cycle  ☐ Continuation Plan  ☐ Refer for full evaluation
`
}

export function buildOfflineEligibilityScaffold(opts: {
  studentName: string
  grade: string
  tier: number
  disability: string
  goals: string[]
  rtiCycles: number
  cycleWeeks: number
  dualReferral: boolean
}): string {
  return `ELIGIBILITY PREP SCAFFOLD (offline) — ${opts.studentName || 'Student'}
Grade: ${opts.grade || '—'} · MTSS tier: ${opts.tier || '—'} · Concern: ${opts.disability || '—'}

RTI gate (district): ${opts.rtiCycles} cycles × ${opts.cycleWeeks} weeks
DAT dual referral required: ${opts.dualReferral ? 'Yes (Groups DAT + Enrich)' : 'No'}

1) Referral reason
- Primary concern:
- Settings where difficulty requires 3+ prompts:
- Strengths / interests:

2) Intervention data checklist
- [ ] Tier 2/3 cycles documented with dates, minutes, ratio, PM tool
- [ ] Weekly scores attached (Data Sheet / Speech RTI form)
- [ ] Parent/guardian input completed
- [ ] Hearing/vision / health reviewed with nurse
- [ ] MLL Body of Evidence if applicable

3) Goals on file
${opts.goals.length ? opts.goals.map((g) => `- ${g}`).join('\n') : '- (none imported yet)'}

4) Eligibility criteria prompts
- Adverse educational impact:
- Need for specialized instruction (vs. continued MTSS only):
- Exclusionary factors considered:

5) Team recommendation placeholders
- Continue MTSS / adjust intervention:
- Move to evaluation (DAT + Enrich steps):
- Human review required before any Enrich finalize.
`
}
