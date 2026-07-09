export interface AssessmentQuestion {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  /** Shown in the domain summary if this question is answered wrong. */
  missInsight: string
}

export interface AssessmentDomainSet {
  domainId: string
  questions: AssessmentQuestion[]
  /** Shown in the domain summary if all questions in the set are answered correctly. */
  masteryInsight: string
}

export const ASSESSMENT: AssessmentDomainSet[] = [
  {
    domainId: 'prompt-construction',
    questions: [
      {
        id: 'pc-1',
        text: 'You need Claude to produce consistent JSON output across all runs — same fields, same structure. Which approach is most reliable?',
        options: [
          'Ask "please respond in JSON format" at the end of the prompt',
          'Specify the exact schema with field names, types, and an example output',
          'Use a larger model which is better at following format instructions',
          'Set temperature to 0 to reduce variability',
        ],
        correct: 1,
        explanation:
          'Telling Claude to "respond in JSON" leaves the structure open. An actual schema with an example removes the guesswork.',
        missInsight:
          'Model size and temperature affect consistency at the margins, but the real gap is usually an underspecified schema — the model is guessing at structure you never actually defined.',
      },
      {
        id: 'pc-2',
        text: 'Your prompt works on simple cases but fails on edge cases. What do you try first?',
        options: [
          'Lengthen the main instruction with more detail',
          'Add 2-3 few-shot examples that specifically cover the failing edge cases',
          'Split the prompt into a chain of smaller prompts',
          'Lower the temperature to make outputs more deterministic',
        ],
        correct: 1,
        explanation:
          'Examples that show the edge cases do more than extra instructions. The model picks up what you demonstrate, not just what you describe.',
        missInsight:
          'More instruction text or a lower temperature can polish an already-working prompt, but neither teaches the model what an edge case actually looks like — only a concrete example does that.',
      },
      {
        id: 'pc-3',
        text: "A colleague shows you their prompt. It's 900 words. It still doesn't work. What's probably wrong?",
        options: [
          'The prompt is simply too long',
          'Role definition is missing at the start',
          'Multiple unrelated tasks are mixed into a single instruction',
          'It needs more examples',
        ],
        correct: 2,
        explanation:
          "Long prompts usually fail because they're asking for several things at once. Each task pulls focus away from the others.",
        missInsight:
          'Length by itself rarely breaks a prompt. What breaks it is asking for three different outcomes in one breath — the model has to split attention across tasks that were never separated.',
      },
    ],
    masteryInsight:
      'Solid instincts here: schema over vague instructions, examples over more description, one task per prompt. The failure modes that trip up most people at this stage are already off your list.',
  },
  {
    domainId: 'context-engineering',
    questions: [
      {
        id: 'ce-1',
        text: "You're deep into a coding session. The first hour was great. Now Claude's answers are getting vague and generic. What's going on?",
        options: [
          'The model has learned your bad habits',
          'Context window is filling with stale earlier conversation turns',
          'You need to switch to a more capable model',
          'The system prompt is too long',
        ],
        correct: 1,
        explanation:
          "The early turns are filling up the window and drowning out what you're working on now. Use /clear or summarize the old context before continuing.",
        missInsight:
          "A model doesn't accumulate habits between turns, and swapping models won't fix a window that's full of stale context — clearing or compacting it will.",
      },
      {
        id: 'ce-2',
        text: 'You want Claude to write new code that matches the style of your existing codebase. What actually works?',
        options: [
          'Tell Claude to "match the existing style" in each prompt',
          'Paste 2-3 representative code samples into the system prompt as style reference',
          'Use the same Claude session throughout the refactor without clearing',
          'Ask Claude to describe the style first, then proceed',
        ],
        correct: 1,
        explanation:
          'Telling Claude to "match the style" is vague. Showing it 2-3 real examples from your codebase is not.',
        missInsight:
          'A description of style is still an abstraction the model has to guess at. Real samples in context give it something concrete to pattern-match against.',
      },
      {
        id: 'ce-3',
        text: 'What does "context engineering" mean in practice — distinct from prompt writing?',
        options: [
          'Choosing which model to use for a given task',
          'Deciding what information to include, exclude, and sequence in the context window to achieve the goal',
          'Writing longer, more detailed prompts',
          'Optimizing your API costs by reducing token usage',
        ],
        correct: 1,
        explanation:
          "Context engineering is deciding what's in the window: what to include, what to leave out, and in what order. It's a different skill from writing the prompt itself.",
        missInsight:
          "Model choice and cost optimization are real considerations, but they're not what the term refers to — this is specifically about curating what's actually sitting in the window.",
      },
    ],
    masteryInsight:
      "This is the domain most people don't know they're missing, and you're already thinking about it correctly: what's in the window matters as much as what you ask for.",
  },
  {
    domainId: 'output-evaluation',
    questions: [
      {
        id: 'oe-1',
        text: 'Claude hands you a market analysis with a specific, confident-sounding statistic embedded in it. What do you do before using it?',
        options: [
          'Trust it — specific numbers read as more credible than vague ones',
          'Verify the specific claim against a real source before using it',
          "Ask Claude to double-check its own work and go with what it says",
          'Rewrite the sentence to sound more cautious and move on',
        ],
        correct: 1,
        explanation:
          "A specific, confident number is exactly the kind of claim worth verifying — specificity reads as credibility, but it isn't evidence of accuracy.",
        missInsight:
          "Asking a model to double-check itself often just produces a more confident restatement of the same claim, not independent verification. Softening the wording doesn't fix an unverified fact either.",
      },
      {
        id: 'oe-2',
        text: "An output gives you two recommendations that quietly contradict each other — one says move fast, the other says proceed cautiously. What's the right move?",
        options: [
          'Go with whichever recommendation sounds more actionable',
          'Name the contradiction directly and ask for it to be resolved explicitly',
          'Blend both into a softened middle-ground recommendation yourself',
          'Ignore it — minor inconsistencies are normal in AI output',
        ],
        correct: 1,
        explanation:
          'Naming the contradiction forces a real resolution. Picking a side or quietly blending both just hides the tension instead of resolving it.',
        missInsight:
          "Picking the more 'actionable-sounding' option or blending both yourself papers over a real disagreement in the reasoning — the contradiction is a signal worth surfacing, not smoothing over.",
      },
      {
        id: 'oe-3',
        text: 'You ask Claude to review a document for issues. It comes back with: "No significant issues found." What now?',
        options: [
          "Accept it — a clean review is good news",
          "Push for specifics: what was checked, and what would a flaw have looked like",
          'Have a second AI tool review it as a sanity check',
          'Plan to always do a fully manual review from now on',
        ],
        correct: 1,
        explanation:
          "\"No issues found\" without any description of what was actually checked is unfalsifiable. Asking what would count as a problem is how you find out if the review was real.",
        missInsight:
          "A second tool or a manual pass are reasonable long-term habits, but they don't address the immediate problem: you still don't know what the first review actually checked for.",
      },
    ],
    masteryInsight:
      "You don't take confident-sounding output at face value — you push on specificity, name contradictions instead of smoothing them over, and ask what a real check actually looked like. That's the core discipline of this domain.",
  },
  {
    domainId: 'agentic-architecture',
    questions: [
      {
        id: 'aa-1',
        text: "You're designing a workflow where an orchestrator agent can delegate parts of a task to specialist sub-agents. What should decide whether a piece of work gets delegated?",
        options: [
          'Delegate as much as possible — more agents signals a more sophisticated system',
          'Delegate when the task is genuinely independent or needs different context/expertise than the orchestrator has',
          'Delegate only tasks the orchestrator would otherwise take the longest to do',
          'Delegate everything except the final output step',
        ],
        correct: 1,
        explanation:
          "Delegation should track real independence or expertise mismatch, not task count or duration. Splitting work that doesn't need splitting just adds coordination overhead.",
        missInsight:
          "More sub-agents isn't more sophisticated if the work didn't actually need splitting — it just adds handoffs, and each handoff is a place things can go wrong silently.",
      },
      {
        id: 'aa-2',
        text: 'In a multi-step agent workflow, one sub-agent fails partway through, but the orchestrator continues on to the next step anyway without noticing. What is the actual architectural gap?',
        options: [
          "The sub-agent needs to be replaced with a more reliable model",
          "There's no verification step confirming a sub-agent's output before the orchestrator proceeds",
          "The workflow needs more logging",
          "The task should never have been delegated in the first place",
        ],
        correct: 1,
        explanation:
          "The gap isn't the sub-agent's competence or the delegation decision — it's that nothing checks the handoff. A failed step should stop the chain or trigger a fallback, not pass through silently.",
        missInsight:
          "Swapping models or logging more detail doesn't fix a workflow that has no verification gate — the orchestrator needs to actually confirm the output is usable before moving on, every time.",
      },
      {
        id: 'aa-3',
        text: "You're deciding whether a business process needs a genuine multi-agent system or would be better served by one well-scoped agent. What's the deciding factor?",
        options: [
          'Whether the process feels complex enough to justify multiple agents',
          'Whether there are genuinely independent or specialized work streams that benefit from separation',
          'Whether a single agent would take too long to run',
          'Whether the team wants to show off a more advanced architecture',
        ],
        correct: 1,
        explanation:
          'Multi-agent design earns its complexity when there are real independent or specialized streams of work. "Feels complex" or "takes a while" are not the same thing as needing separation.',
        missInsight:
          "Runtime and perceived complexity are the wrong signals — plenty of long, complex tasks are still best handled by one well-scoped agent with the right tools, not a fleet of them.",
      },
    ],
    masteryInsight:
      "You're making delegation decisions on the right basis: real independence and expertise mismatch, not agent count for its own sake, and you know a missing verification gate when you see one.",
  },
  {
    domainId: 'tool-selection',
    questions: [
      {
        id: 'ts-1',
        text: "You have a quick one-off text edit and, separately, a six-step workflow spanning multiple files. How should model choice differ between the two?",
        options: [
          'Use the most capable model for both, for consistency',
          'Match the model tier to the task — fast/cheap for the quick edit, more capable for the multi-step work',
          'Use the cheapest model for both to control cost',
          'Let the tool auto-select the model without reviewing the choice',
        ],
        correct: 1,
        explanation:
          "Using the same tier for everything is either wasteful (overkill on the simple task) or risky (underpowered on the complex one). Deliberately matching tier to task is the actual skill.",
        missInsight:
          "Defaulting to always-most-capable or always-cheapest skips the judgment call entirely — the cost and quality trade-off is different for a one-line edit than for a six-step orchestration.",
      },
      {
        id: 'ts-2',
        text: 'A repetitive business task (say, scheduling) needs to actually take action — not just draft a suggestion. What kind of tool should you reach for?',
        options: [
          'A general chat assistant, since it can describe what to do',
          'A tool with real action capability (API/integration access), since drafting alone leaves the work undone',
          'Whichever tool is already open',
          "It doesn't matter as long as the output text is correct",
        ],
        correct: 1,
        explanation:
          "If the task requires action, a tool that can only describe the action leaves you doing the actual work by hand. Match the tool's capability to whether the task needs drafting or doing.",
        missInsight:
          "A well-written draft doesn't complete a task that requires action — convenience or output quality doesn't substitute for whether the tool can actually execute the step.",
      },
      {
        id: 'ts-3',
        text: 'A colleague uses the exact same AI tool for every task regardless of what the task actually needs. What does that reveal about their mental model?',
        options: [
          "That they've found an efficient default and stuck with it",
          "That they don't have deliberate criteria for when one tool wins over another",
          "That the tool they use must be unusually capable",
          "Nothing — tool choice rarely matters much either way",
        ],
        correct: 1,
        explanation:
          "Using one tool for everything usually means there's no explicit model of when each tool is the right fit — not that the tool happens to be right for every job.",
        missInsight:
          "'It works most of the time' isn't the same as tool selection — the tell is the absence of any criteria for when a different tool would clearly perform better.",
      },
    ],
    masteryInsight:
      "You're matching tool and model choice to what the task actually needs — tier to complexity, action capability to whether the task requires action. That's a deliberate mental model, not a default.",
  },
  {
    domainId: 'failure-diagnosis',
    questions: [
      {
        id: 'fd-1',
        text: 'An automated report pipeline produced a broken output overnight. You want to fix it. What do you do first?',
        options: [
          'Rerun it and hope it works this time',
          'Reproduce the failure with the same inputs and confirm you can trigger it reliably',
          'Add error handling that suppresses the failure so the pipeline keeps running',
          'Escalate to the vendor immediately',
        ],
        correct: 1,
        explanation:
          "A fix for a failure you can't reliably reproduce is a guess. Confirming the exact conditions that trigger it is what makes the fix that follows actually address the cause.",
        missInsight:
          "Rerunning and hoping, or suppressing the symptom, both skip the step that actually tells you what's wrong — you're patching around an unknown rather than fixing a known cause.",
      },
      {
        id: 'fd-2',
        text: 'Claude gives you a factually wrong answer. Someone suggests: "just re-prompt with \'are you sure?\'" Is that a real fix?',
        options: [
          "Yes — it's a fast, reliable way to correct wrong answers",
          "No — re-prompting for confidence doesn't address why it was wrong, it just produces a differently-confident answer",
          "Yes, but only works for factual questions specifically",
          "No — the only real fix is switching to a different model",
        ],
        correct: 1,
        explanation:
          '"Are you sure?" prompts the model to reconsider its confidence, not to re-derive the answer from better information. It can flip a wrong answer to a different wrong answer just as easily as a right one.',
        missInsight:
          "The apparent fix doesn't touch the actual cause — whatever made the first answer wrong (bad assumption, missing context, stale information) is still there after a confidence check.",
      },
      {
        id: 'fd-3',
        text: 'An agent workflow occasionally skips a step. Someone adds a hardcoded retry, and the symptom stops showing up. Is this resolved?',
        options: [
          'Yes — the symptom is gone, so the problem is fixed',
          "No — this likely suppressed the symptom without addressing why the step was skipped, and it can resurface elsewhere",
          "Yes, as long as it hasn't recurred in about a week",
          "No, but only because retries are always a bad pattern",
        ],
        correct: 1,
        explanation:
          "A retry that hides the symptom isn't the same as understanding why the step gets skipped. The underlying cause is still there and can show up in a different form later.",
        missInsight:
          "Absence of the symptom for a while isn't evidence the cause is gone — and the objection isn't to retries generally, it's to using one as a substitute for actually knowing why the failure happens.",
      },
    ],
    masteryInsight:
      "You're not settling for a fix that just makes the symptom go away — reproducing failures, distinguishing a real fix from a confidence check, and telling suppression apart from resolution are the right instincts here.",
  },
  {
    domainId: 'multi-agent-orchestration',
    questions: [
      {
        id: 'ma-1',
        text: 'Two agents in a workflow need to share information from earlier steps. What has to happen for that to actually work?',
        options: [
          "Nothing extra — agents in the same workflow share context automatically",
          "The state has to be explicitly passed or persisted between them",
          "They need to run in the same terminal session",
          "One agent needs to be given admin privileges over the other",
        ],
        correct: 1,
        explanation:
          "Agents don't share a context window by default. Anything one needs from another has to be deliberately written somewhere and read back — a file, a return value, a shared store.",
        missInsight:
          "Assuming shared context is the most common multi-agent bug there is — running things in the same session or granting broader permissions doesn't create a data pathway that doesn't otherwise exist.",
      },
      {
        id: 'ma-2',
        text: 'A long-running multi-agent workflow needs to be able to resume if it gets interrupted partway through. What does that require?',
        options: [
          'Persisting intermediate state or checkpoints so it can pick up where it left off',
          "Making sure the workflow always completes within one uninterrupted session",
          "Re-running the entire workflow from scratch every time",
          "Nothing specific — most orchestration tools handle this automatically",
        ],
        correct: 0,
        explanation:
          'Resumability is a design choice, not a default. Without checkpointed state, an interruption means starting over, which gets expensive fast on long workflows.',
        missInsight:
          "Hoping for an uninterrupted run or accepting a full restart both dodge the actual design question — and this isn't automatic behavior in most orchestration setups, it has to be built in.",
      },
      {
        id: 'ma-3',
        text: 'A workflow needs to hand off to a human when confidence is low or the stakes are high. How should that escalation trigger be designed?',
        options: [
          "Let the agent decide when it feels uncertain and escalate then",
          "Define explicit, concrete conditions for escalation upfront, rather than relying on the agent to self-assess",
          "Escalate everything, to be safe",
          "Skip escalation design — handle exceptions as they come up",
        ],
        correct: 1,
        explanation:
          "Relying on an agent to know when it's uncertain is unreliable — confident-sounding wrong answers are exactly the failure mode escalation is meant to catch. Concrete, predefined triggers close that gap.",
        missInsight:
          "Self-assessed uncertainty is not a dependable signal, and escalating everything just defeats the purpose of automation — the actual skill is defining specific conditions in advance.",
      },
    ],
    masteryInsight:
      "You're treating state-sharing, resumability, and escalation as deliberate design decisions rather than assumptions the system will just handle — that's exactly the discipline this domain is testing for.",
  },
  {
    domainId: 'business-value-translation',
    questions: [
      {
        id: 'bv-1',
        text: "You're presenting AI-driven productivity gains to a board. Should you lead with the technical capability or the business outcome?",
        options: [
          'Lead with the technical capability — it establishes credibility first',
          'Lead with the business outcome — the capability is supporting detail',
          'Split time evenly between both from the start',
          "It doesn't matter as long as both are mentioned somewhere",
        ],
        correct: 1,
        explanation:
          "A board is evaluating outcomes, not architecture. Leading with capability makes them do the translation work themselves — leading with outcome does it for them.",
        missInsight:
          "Technical detail can support the case, but opening with it puts the burden of translating 'so what does this mean for us' on the audience instead of on you.",
      },
      {
        id: 'bv-2',
        text: "You've cut a task from 2 hours to 20 minutes using AI. How do you turn that into a board-ready value statement?",
        options: [
          'State the time saved and let them draw their own conclusions',
          'Connect it to a business metric that matters to them — cost, capacity, or speed-to-market',
          'Emphasize how advanced the underlying technology is',
          'Compare it to what competitors are probably doing',
        ],
        correct: 1,
        explanation:
          "Time saved is a means, not the value itself. Translating it into cost, capacity, or speed-to-market is what makes it legible as a business result rather than a productivity anecdote.",
        missInsight:
          "Raw time saved and technical sophistication both stop short of the translation step — the board needs the number connected to something they already track.",
      },
      {
        id: 'bv-3',
        text: 'A skeptical stakeholder asks: "How do we know this isn\'t just hype?" What is the strongest response?',
        options: [
          'Point to industry trends showing broad AI adoption',
          'Point to specific, measured evidence — before/after data on your own outcomes',
          'Express confidence that the results speak for themselves',
          "Note that most competitors are already using similar tools",
        ],
        correct: 1,
        explanation:
          "Industry trends and competitor behavior are context, not proof. Specific, measured evidence from your own before/after results is what actually answers the skepticism.",
        missInsight:
          "General enthusiasm or 'everyone else is doing it' arguments are exactly the kind of response that reads as hype — concrete, specific evidence is what distinguishes a real case from one.",
      },
    ],
    masteryInsight:
      "You're translating capability into outcome by default — leading with what matters to the audience, tying results to metrics they track, and backing claims with specific evidence instead of general enthusiasm.",
  },
]

export function findDomainSet(domainId: string): AssessmentDomainSet | undefined {
  return ASSESSMENT.find((d) => d.domainId === domainId)
}
