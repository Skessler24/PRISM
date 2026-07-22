/** Offline FBA / BIP drafts when Azure AI keys are unavailable. */

import type { FbaSession } from '../fba/store'
import { tallyTotal } from '../fba/store'
import type { Student } from '../students/types'

export function draftFbaSummary(session: FbaSession, student?: Student | null): string {
  const name = student?.name || session.studentName || 'the student'
  const disability = student?.disability || 'not specified'
  const abc =
    session.abc
      .map(
        (r, i) =>
          `${i + 1}. ${r.date || '—'} | Setting: ${r.setting || '—'} | A: ${r.antecedent || '—'} | B: ${r.behavior || '—'} | C: ${r.consequence || '—'} | Fn guess: ${r.functionGuess || '—'}`,
      )
      .join('\n') || 'No ABC rows entered yet.'

  return `FBA SUMMARY (offline draft — review with team; not a live Enrich sync)

Student: ${name}
Grade / disability: ${student?.grade || '—'} / ${disability}
Target behavior: ${session.targetBehavior || 'Not yet operationally defined'}
Hypothesized function(s): ${session.functions.join(', ') || 'Not selected'}
Live tally total: ${tallyTotal(session)} across ${session.tallies.length} event(s)

1. Operational definition
${session.targetBehavior || 'Define the target behavior in observable, measurable terms (topography, duration/intensity thresholds, examples/non-examples).'}

2. Setting events / context
Triggers / notes from Student Tile: ${student?.triggers || '—'}
Calming / supports: ${student?.calming || '—'}
Accommodations on file: ${(student?.accommodations || []).slice(0, 5).join('; ') || '—'}

3. ABC pattern summary
${abc}

4. Hypothesized function & rationale
Selected: ${session.functions.join(', ') || 'Team to select Escape/Avoidance, Attention, Tangible, and/or Sensory/Automatic based on ABC patterns and tallies.'}
Rationale: Summarize which antecedents reliably precede the behavior and which consequences maintain it. Prefer the function with the strongest repeated pattern across settings.

5. Recommended next steps toward BIP
- Confirm operational definition with the IEP team
- Continue ABC + frequency tallies across 3+ settings / days
- Draft BIP prevention, replacement, and reinforcement aligned to the hypothesized function
- Copy reviewed language into Enrich after human approval

Generated offline by PRISM when AI chat is unavailable.`
}

export function draftBipPlan(session: FbaSession, student?: Student | null): string {
  const name = student?.name || session.studentName || 'the student'
  return `BIP DRAFT (offline — team review required)

Student: ${name}
Target behavior: ${session.targetBehavior || '—'}
Function: ${session.functions.join(', ') || '—'}

Prevention / antecedent strategies
- Review Student Tile accommodations and apply consistently
- Premack / first-then for non-preferred tasks
- Visual supports and clear start/end of work

Replacement behavior
- Teach a functionally equivalent replacement (e.g., request break, request help, use calm-down routine)
- Prompt → practice → fade; reinforce replacement immediately

Reinforcement
- Catch appropriate behavior; specific praise + preferred reinforcer per preference assessment
- Thin schedule once fluency is established

Crisis / safety
- Follow building crisis protocol; prioritize safety; document
- Do not invent restraints/seclusion language — use district-approved procedures only

Progress monitoring
- Continue PRISM FBA tallies / ABC during implementation
- Review data biweekly with case manager

FBA context on file:
${(session.fbaOut || '(none yet)').slice(0, 1200)}

Companion: paste into Enrich after team approval. Not a live sync.`
}
