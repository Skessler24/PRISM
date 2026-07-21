import type { Student } from '../students/types'

export type FormTemplate = {
  id: string
  name: string
  cat: string
  status: string
  body: string
  genType?: string
  custom?: boolean
}

export const BUILTIN_FORMS: FormTemplate[] = [
  {
    id: 'iep-agenda',
    name: 'IEP Meeting Agenda',
    cat: 'IEP',
    status: 'Ready',
    genType: 'IEP Meeting Agenda',
    body: `IEP MEETING AGENDA

Student: {{name}}
Grade / Teacher: {{grade}} · {{teacher}}
Case Manager: {{caseManager}}
IEP Due: {{iepDue}}
Date: {{date}}

1. Introductions & parent rights
2. Review purpose of meeting
3. Present levels of academic achievement and functional performance
4. Goals review / proposed goals
   Current goals:
{{goals}}
5. Special education & related services
6. Accommodations / modifications
{{accommodations}}
7. LRE / placement
8. ESY determination (if applicable)
9. Prior Written Notice
10. Next steps & signatures
`,
  },
  {
    id: 'nom',
    name: 'NOM Template',
    cat: 'Compliance',
    status: 'Ready',
    genType: 'NOM Letter',
    body: `NOTICE OF MEETING (NOM)

Student: {{name}}
Grade: {{grade}}
Case Manager: {{caseManager}}
Date of notice: {{date}}

Dear Parent/Guardian,

You are invited to an IEP team meeting for {{name}}.

Purpose: Annual IEP review / educational planning
Proposed date/time: ________________
Location: ________________

Required participants will include the case manager, general education teacher, and other service providers as appropriate.

Parent rights are enclosed. Please contact {{caseManager}} if you need to reschedule or request an interpreter.

Home language (if known): {{homeLanguage}}
`,
  },
  {
    id: 'progress',
    name: 'Progress Report Template',
    cat: 'IEP',
    status: 'Ready',
    genType: 'Progress Report',
    body: `PROGRESS REPORT — {{date}}

Student: {{name}} ({{grade}})
Teacher: {{teacher}}
Case Manager: {{caseManager}}
Program: {{disability}}
IEP Due: {{iepDue}}

Goals:
{{goals}}

Progress summary:
- Goal 1: ________________ (met / progressing / not progressing)
- Goal 2: ________________ (met / progressing / not progressing)

Accommodations in use:
{{accommodations}}

Next steps / recommendations:
________________
`,
  },
  {
    id: 'fba',
    name: 'FBA Data Collection Form',
    cat: 'Behavior',
    status: 'Ready',
    body: `FBA DATA COLLECTION — {{name}}

Target behavior (operational): ________________
Setting events: ________________
Antecedents: {{triggers}}
Typical calming / replacement context: {{calming}}

ABC log:
Date | Setting | Antecedent | Behavior | Consequence | Function
`,
  },
  {
    id: 'bip',
    name: 'BIP Template',
    cat: 'Behavior',
    status: 'Ready',
    genType: 'BIP Draft',
    body: `BEHAVIOR INTERVENTION PLAN — {{name}}

Target behavior: ________________
Hypothesized function: ________________
Triggers: {{triggers}}
Calming strategies already known: {{calming}}

Prevention strategies:
________________

Replacement behavior:
________________

Reinforcement plan:
________________

Crisis / safety plan:
________________

Data collection method: ________________
`,
  },
  {
    id: 'parent-input',
    name: 'Parent Input Form',
    cat: 'Communication',
    status: 'Ready',
    body: `PARENT INPUT FORM

Student: {{name}}
Grade: {{grade}}
Date: {{date}}

1. What are your child's strengths and interests?
{{interests}}

2. What concerns do you have about school?
________________

3. What strategies work well at home?
{{calming}}

4. Goals you would like the team to consider:
________________

5. Preferred contact method / language: {{homeLanguage}}
`,
  },
  {
    id: 'consent-eval',
    name: 'Consent for Evaluation',
    cat: 'Compliance',
    status: 'Ready',
    body: `CONSENT FOR INITIAL / REEVALUATION

Student: {{name}}
Grade: {{grade}}
Date: {{date}}

I give / do not give (circle one) consent for the district to conduct an evaluation of my child.

Areas proposed: ________________
Parent signature: ________________  Date: ________
`,
  },
  {
    id: 'teacher-input',
    name: 'Teacher Input Form',
    cat: 'Assessment',
    status: 'Ready',
    body: `TEACHER INPUT FORM

Student: {{name}}
Teacher: {{teacher}}
Grade: {{grade}}
Date: {{date}}

Academic performance: ________________
Classroom behavior: ________________
Accommodations currently used:
{{accommodations}}

Concerns / referral reason: ________________
`,
  },
  {
    id: '504-notice',
    name: '504 Meeting / PWN Notice',
    cat: '504',
    status: 'Ready',
    body: `SECTION 504 — MEETING / PRIOR WRITTEN NOTICE

Student: {{name}}
Grade / Teacher: {{grade}} · {{teacher}}
Case Manager: {{caseManager}}
504 Review Due: {{section504Due}}
Impairment: {{section504Impairment}}
Date: {{date}}

Dear Parent/Guardian,

This notice concerns {{name}}'s Section 504 plan.
Please contact the case manager to confirm attendance or request an interpreter.

Accommodations on file:
{{accommodations}}
`,
  },
  {
    id: '504-plan',
    name: '504 Accommodation Plan',
    cat: '504',
    status: 'Ready',
    body: `SECTION 504 ACCOMMODATION PLAN

Student: {{name}}
Grade: {{grade}}  Teacher: {{teacher}}
Impairment: {{section504Impairment}}
Annual review due: {{section504Due}}
Date: {{date}}

Major life activities affected: ________________

Accommodations:
{{accommodations}}

Responsible staff: {{caseManager}}
Parent acknowledgment: ________________
`,
  },
  {
    id: 'mll-family',
    name: 'MLL Family Communication',
    cat: 'MLL',
    status: 'Ready',
    body: `MLL / FAMILY COMMUNICATION

Student: {{name}}
Grade: {{grade}}
Home language: {{homeLanguage}}
ELD level: {{eldLevel}}
Interpreter needed: {{interpreterNeeded}}
Date: {{date}}

Dear Family,

This message concerns educational planning for {{name}}.
Preferred language for notices: {{homeLanguage}}

Please reply with questions or preferred meeting times.
`,
  },
  {
    id: 'accommodation-sheet',
    name: 'Accommodation One-Pager',
    cat: 'IEP',
    status: 'Ready',
    genType: 'Accommodation Sheet',
    body: `TEACHER ONE-PAGER — ACCOMMODATIONS

Student: {{name}} ({{grade}})
Program flags: {{programs}}
Disability / category: {{disability}}

Must-use accommodations:
{{accommodations}}

Triggers to avoid: {{triggers}}
Calming supports: {{calming}}
Interests: {{interests}}
`,
  },
]

export const DISTRICT_TEMPLATES_KEY = 'prism_district_templates_v1'
export const TEMPLATE_INSTANCES_KEY = 'prism_template_instances_v1'
export const DISTRICT_SETTINGS_KEY = 'prism_district_settings_v1'

export type SuiteMode = 'companion' | 'standalone'

export type TemplateInstance = {
  id: string
  formId: string
  type: string
  studentId: string | null
  studentName: string
  title: string
  body: string
  status: string
  createdAt: string
  updatedAt: string
}

export function readSuiteMode(): SuiteMode {
  try {
    const raw = localStorage.getItem(DISTRICT_SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { suiteMode?: string }
      if (parsed.suiteMode === 'standalone') return 'standalone'
    }
  } catch {
    /* ignore */
  }
  return 'companion'
}

export function writeSuiteMode(mode: SuiteMode) {
  let prev: Record<string, unknown> = {}
  try {
    const raw = localStorage.getItem(DISTRICT_SETTINGS_KEY)
    if (raw) prev = JSON.parse(raw) as Record<string, unknown>
  } catch {
    /* ignore */
  }
  localStorage.setItem(
    DISTRICT_SETTINGS_KEY,
    JSON.stringify({
      ...prev,
      suiteMode: mode,
    }),
  )
}

export function loadCustomTemplates(): FormTemplate[] {
  try {
    const raw = localStorage.getItem(DISTRICT_TEMPLATES_KEY)
    const parsed = JSON.parse(raw || '[]') as FormTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomTemplates(list: FormTemplate[]) {
  localStorage.setItem(DISTRICT_TEMPLATES_KEY, JSON.stringify(list))
}

export function loadTemplateInstances(): TemplateInstance[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_INSTANCES_KEY)
    const parsed = JSON.parse(raw || '[]') as TemplateInstance[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTemplateInstances(list: TemplateInstance[]) {
  localStorage.setItem(TEMPLATE_INSTANCES_KEY, JSON.stringify(list))
}

export function allForms(custom: FormTemplate[] = loadCustomTemplates()): FormTemplate[] {
  return BUILTIN_FORMS.concat(
    custom.map((t) => ({ ...t, cat: t.cat || 'Custom', status: t.status || 'Custom', custom: true })),
  )
}

export function suiteModeNote(mode: SuiteMode, iepSystem = 'Enrich') {
  return mode === 'standalone'
    ? '[Standalone] This draft can be saved as a PRISM district template instance.'
    : `[Companion] Copy into ${iepSystem} / your district SoR — PRISM does not live-sync.`
}

export function fillTemplateBody(tpl: string, student?: Student | null) {
  const s = student || ({} as Partial<Student>)
  const map: Record<string, string> = {
    name: s.name || '________________',
    grade: s.grade || '—',
    teacher: s.teacher || '—',
    caseManager: s.caseManager || s.provider || '—',
    disability: s.disability || '—',
    iepDue: s.iepDue || '—',
    section504Due: s.section504Due || '—',
    section504Impairment: s.section504Impairment || '—',
    homeLanguage: s.homeLanguage || '—',
    eldLevel: s.eldLevel || '—',
    interpreterNeeded: s.interpreterNeeded ? 'Yes' : 'No',
    interests: s.interests || '—',
    triggers: s.triggers || '—',
    calming: s.calming || '—',
    goals:
      s.goals && s.goals.length ? s.goals.map((g) => `- ${g}`).join('\n') : '- (goals not yet entered)',
    accommodations:
      s.accommodations && s.accommodations.length
        ? s.accommodations.map((a) => `- ${a}`).join('\n')
        : '- (none entered)',
    programs:
      [s.hasIEP ? 'IEP' : null, s.has504 ? '504' : null, s.hasMLL ? 'MLL' : null]
        .filter(Boolean)
        .join(' · ') || '—',
    date: new Date().toLocaleDateString('en-US', { timeZone: 'America/Denver' }),
  }
  return String(tpl || '').replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    map[key] != null ? map[key] : '',
  )
}
