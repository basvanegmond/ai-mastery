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
        text: 'Your chain-of-thought prompt is accurate but inflating token costs at high volume. You need to preserve accuracy. What is the most targeted architectural fix?',
        options: [
          'Set temperature to 0 — deterministic outputs reduce unnecessary elaboration',
          'Append "respond concisely" to the instruction — this typically halves CoT length while preserving accuracy',
          'Route inputs through a lightweight classifier first; send only complex cases to the CoT prompt',
          'Truncate outputs at a token limit and post-process the answer out of partial reasoning',
        ],
        correct: 2,
        explanation:
          'The root problem is applying heavy reasoning universally. A classifier that routes simple inputs to a cheaper path keeps quality on hard cases without paying the CoT cost across the board.',
        missInsight:
          'Temperature and truncation reduce output size but do not reduce thinking — they risk cutting reasoning that was needed. "Be concise" can help at the margins but does not fix the structural issue of invoking CoT on inputs that do not require it.',
      },
      {
        id: 'pc-2',
        text: 'A long system prompt (1,200 tokens) produces great results on simple tasks but drifts on complex ones. All the instructions are correct. What is the most likely cause of the drift?',
        options: [
          'Complex tasks consume more reasoning tokens, crowding out the system prompt in the window',
          'The model averages long sets of instructions rather than following any one precisely',
          'The context limit is being approached, causing the model to truncate the system prompt internally',
          'Instructions placed in the middle of a long prompt are systematically underweighted compared to those at the top and bottom',
        ],
        correct: 3,
        explanation:
          'LLMs exhibit a "lost-in-the-middle" effect — content near the start and end of a long prompt is attended to most reliably. Critical rules buried in the middle of a 1,200-token system prompt are effectively invisible on complex tasks that demand more of the model.',
        missInsight:
          'Reasoning crowding and context truncation would typically degrade all tasks, not just complex ones. The "averaging" hypothesis is not how attention actually works. The structural diagnosis is positional: important instructions in the middle of long prompts are the graveyard.',
      },
      {
        id: 'pc-3',
        text: 'You need the model to always output valid JSON but cannot use a JSON-enforcing API parameter. Which prompting technique is most reliably effective?',
        options: [
          'Seed the assistant turn with the opening brace — begin your prefill with \'{\' so the model must complete a valid JSON token sequence',
          'Embed the JSON schema in the system prompt and ask the model to validate its own output before returning it',
          'Use a two-step chain: generate the content, then format it into JSON in a second call',
          'Repeat the output format instruction at the very end of the user message as a final reminder',
        ],
        correct: 0,
        explanation:
          'Seeding the response with \'{\' is the most reliable constraint available without a structured-output parameter — the model is forced to complete a valid JSON token sequence rather than choosing whether to produce JSON at all.',
        missInsight:
          'Self-validation often produces a confident restatement rather than a real check. A two-step chain adds latency and a second opportunity for drift. End-of-prompt reminders help but do not force the structure. Seeding the actual output token removes the choice entirely.',
      },
    ],
    masteryInsight:
      'You are approaching prompt construction at the architectural level — routing by complexity instead of tuning globally, diagnosing position effects in long prompts, and constraining output structure at the token level rather than through instruction alone.',
  },
  {
    domainId: 'context-engineering',
    questions: [
      {
        id: 'ce-1',
        text: 'You are building a RAG pipeline with a fixed budget of 10 retrieved chunks. Which ordering of chunks in the context window produces the best model performance?',
        options: [
          'Highest-similarity chunk first, descending by relevance — the model processes sequentially and benefits from the most relevant content up front',
          'Interleave high- and low-similarity chunks to give the model contrast between relevant and irrelevant material',
          'Most relevant chunk first AND last, with less-relevant chunks in the middle — exploit the model\'s attention peaks at both ends',
          'Chronological order if documents have timestamps; similarity order otherwise',
        ],
        correct: 2,
        explanation:
          'The "lost-in-the-middle" phenomenon means models pay the most attention to content near the beginning and end of a long context. Placing your most relevant chunk in both positions maximises the chance it influences the output.',
        missInsight:
          'Similarity-descending order front-loads the best material but buries it under less-relevant content — the model\'s attention tapers off precisely where the remaining relevant chunks sit. The U-shape placement directly exploits the attention pattern rather than fighting it.',
      },
      {
        id: 'ce-2',
        text: 'A multi-turn coding session worked well for the first hour. Now answers are getting vague and unhelpful. Nothing changed in the system prompt or model. What is the highest-signal first move?',
        options: [
          'Switch to a larger model — degrading quality over a session often signals the current model is near its reasoning ceiling',
          'Audit what is actually filling the window — if it is mostly stale assistant turns, compact or prune them before deciding whether to restart',
          'Restart the session with the original task description to restore a clean context',
          'Ask the model to summarise what it knows so far to reset its working understanding',
        ],
        correct: 1,
        explanation:
          'Restarting discards potentially useful early context. Switching models does not fix a window full of stale reasoning. Auditing what is in the window first tells you whether targeted compaction or a full restart is the right call — and often targeted compaction recovers quality without losing the first hour of productive context.',
        missInsight:
          'A model summary is itself generated from the degraded context and tends to inherit its problems. Restarting is sometimes correct but is the blunt instrument — the diagnostic move is understanding what is crowding the window before deciding how to address it.',
      },
      {
        id: 'ce-3',
        text: 'You need to analyse an 80k-token document in a 128k context window. What arrangement of instruction, few-shot examples, and document maximises performance?',
        options: [
          'Document first, then instruction and examples — the model reads sequentially and needs the document as foundation before it can act on instructions',
          'Instruction, document, examples — the standard pattern for retrieval-augmented generation',
          'Examples first, instruction, document — examples prime the model\'s behaviour before it encounters the document',
          'Instruction, examples, document — the model reads the entire document through the lens of an already-established task framing and example patterns',
        ],
        correct: 3,
        explanation:
          'When a long document dominates the context, the model cannot revisit earlier content after reading it. Placing both the instruction and examples before the document means every token of reading is guided by the established task framing from the start.',
        missInsight:
          'Document-first means the model processes 80k tokens before receiving its task — it reads without a lens. Examples-instruction-document separates the priming from the task definition. The instruction-examples-document sequence gives the model its complete operating context before it encounters the material it must analyse.',
      },
    ],
    masteryInsight:
      'You are engineering context deliberately — exploiting attention patterns in retrieval ordering, diagnosing window composition before reaching for blunt restarts, and sequencing instruction and material so the model reads with its full operating context already in place.',
  },
  {
    domainId: 'output-evaluation',
    questions: [
      {
        id: 'oe-1',
        text: 'Claude produces an analysis containing twelve claims. Eleven are specific and verifiable. One is an unfalsifiable assertion: "this approach tends to work well in practice." Where should your verification effort focus first?',
        options: [
          'On the unfalsifiable assertion — it cannot be audited but carries the same rhetorical weight as the facts around it, and is where subtle bias or sycophancy hides',
          'Evenly across all twelve claims — selective spot-checking introduces bias into what you examine',
          'On the two or three claims that most directly support the headline recommendation',
          'On whichever claims feel most surprising or counter-intuitive given your domain knowledge',
        ],
        correct: 0,
        explanation:
          'Verifiable facts can be checked and corrected if wrong. An unfalsifiable assertion shapes the framing and conclusion and cannot be audited — it needs to be named and either removed or replaced with a falsifiable claim.',
        missInsight:
          'Surprising claims are worth checking, and load-bearing claims are high-leverage, but both approaches operate only in the falsifiable space. The unfalsifiable assertion is the one place where no amount of verification effort can give you a clean answer — it has to be structurally challenged, not verified.',
      },
      {
        id: 'oe-2',
        text: 'You ask Claude to compare two strategies. It clearly favours Strategy A. You push back: "Are you sure B isn\'t better?" It reverses to favour Strategy B. What is the right response?',
        options: [
          'Probe Strategy B with equal scepticism — if it holds up under pressure it may genuinely be better',
          'Treat the reversal as a sycophancy signal and re-run the comparison with neutral framing to get an independent read',
          'Average the two positions — the oscillation indicates the strategies are genuinely close in merit',
          'Accept Strategy A as the more reliable answer since the initial response was less influenced by your input',
        ],
        correct: 1,
        explanation:
          'A reversal under pushback without new information is a sycophancy signal. Probing the reversed position continues to work from a sycophantically-derived premise. The correct move is to re-frame the prompt and get a clean comparison uncontaminated by your expressed preference.',
        missInsight:
          'Probing B sounds rigorous but you are now pressure-testing a position the model adopted to agree with you, not because the evidence warranted it. Oscillation does not mean the gap is small — it means the model is tracking your approval. The fix is a clean re-prompt, not deeper interrogation of the second position.',
      },
      {
        id: 'oe-3',
        text: 'You need to evaluate a 3,000-word AI-written report for accuracy but cannot check every claim. Which strategy gives the highest signal per minute?',
        options: [
          'Read the conclusion first — if the conclusion is sound, the supporting evidence is usually sound too',
          'Sample the five most specific numerical claims and verify each one directly',
          'Identify the two or three load-bearing premises the entire argument depends on and audit those',
          'Check citations and sources — correct references indicate the underlying content is reliable',
        ],
        correct: 2,
        explanation:
          'Every argument has a small number of premises that the conclusion structurally depends on. Auditing those collapses the most risk fastest: if a load-bearing premise falls, the conclusion falls regardless of how well-supported the secondary points are.',
        missInsight:
          'Numerical claims are verifiable, but a wrong number in a non-load-bearing point does not sink the argument. Correct citations can still support a misleading synthesis. Working backwards from the conclusion to its dependencies — not the other way around — is the highest-leverage evaluation path.',
      },
    ],
    masteryInsight:
      'You are evaluating AI output at the structural level — auditing the unfalsifiable rather than just the verifiable, recognising sycophancy signals in reversals, and working backwards from conclusions to their load-bearing premises rather than checking facts opportunistically.',
  },
  {
    domainId: 'agentic-architecture',
    questions: [
      {
        id: 'aa-1',
        text: 'Your agent workflow can resume from checkpoints after partial failures. One step sends an external email. What property must that step have for the architecture to be correct?',
        options: [
          'It should run last so that partial reruns triggered earlier in the workflow cannot reach it',
          'It should check agent memory to confirm whether it already ran before executing',
          'It should be wrapped in error handling that suppresses failures so the workflow does not stall on transient issues',
          'It must be idempotent — the same email must be safe to trigger multiple times without duplicate sends',
        ],
        correct: 3,
        explanation:
          'When workflows can rerun from checkpoints, any step with external side effects must be idempotent. Memory checks rely on memory being reliable in a partially-failed state. "Run last" only works if the checkpoint is always before this step. Idempotency is the structural guarantee that makes the step safe regardless of how many times the workflow reruns.',
        missInsight:
          'Memory-check approaches are brittle in partial-failure scenarios — the memory may itself be incomplete or inconsistent. Run-last assumes a specific checkpoint structure. Error suppression hides failures rather than preventing duplicates. The design contract is idempotency: this step must produce the same outcome whether called once or five times.',
      },
      {
        id: 'aa-2',
        text: 'An agent browsing a website to collect scoped data unexpectedly discovers it has access to an admin panel — an access control bug on the site. What should it do?',
        options: [
          'Stop immediately and surface the discovery to the human operator before any further action',
          'Continue collecting only the originally scoped data and log the admin panel discovery for review later',
          'Close the browser tab containing the admin panel and continue with the original task — accessing it would be out of scope',
          'Make one non-destructive read in the admin panel to assess what data is accessible, then stop and report',
        ],
        correct: 0,
        explanation:
          'An agent that discovers an unexpected privilege escalation must stop entirely and escalate to human review. Continuing — even within the original scope — means operating in an environment whose integrity is now unknown. You do not know what else may be misconfigured.',
        missInsight:
          'Closing the tab and continuing treats the discovery as incidental. Logging it for later accepts that the current run may continue in a compromised environment. A single "safe" read still constitutes acting on an unauthorised access path. The correct response to discovering an unexpected capability is always a full stop before any further action.',
      },
      {
        id: 'aa-3',
        text: 'You are designing an agent that can take both reversible and irreversible actions. What confirmation pattern gives the best balance of safety and usability?',
        options: [
          'Require confirmation before every action so the human always knows what the agent is about to do',
          'Classify actions by reversibility upfront and require explicit confirmation only for irreversible ones',
          'Log all actions in real time so that any action can be audited or rolled back if needed',
          'Run the agent in shadow mode during rollout, reviewing the full action plan before enabling live execution',
        ],
        correct: 1,
        explanation:
          'Requiring confirmation for every action makes the agent unusable in practice. Logging and shadow mode are useful for testing and forensics but do not prevent irreversible actions at runtime. Surgically placed gates — only at the boundary of irreversibility — preserve usability while protecting where it actually matters.',
        missInsight:
          'All-or-nothing confirmation is safe in theory but collapses into confirmation fatigue or abandonment in practice. Logging gives you a record of what happened, not a gate on what is about to happen. Shadow mode is a rollout strategy, not a production safety pattern. The right abstraction is reversibility classification applied as the gate criterion.',
      },
    ],
    masteryInsight:
      'You are designing agentic systems with the right safety primitives in place — idempotency for side-effecting steps, full stops on unexpected capabilities, and reversibility-based confirmation gates rather than blanket permission or blanket friction.',
  },
  {
    domainId: 'tool-selection',
    questions: [
      {
        id: 'ts-1',
        text: 'You built a tiered routing system: simple tasks → small model, medium → mid-tier, complex → flagship. In production, the mid-tier performs disappointingly on "medium" tasks. What is the most likely root cause?',
        options: [
          'The classifier routes too many tasks to the mid tier — it is overloaded with inputs that should be simple',
          'The mid-tier model underperforms on this domain relative to its benchmark scores',
          'The definitions of simple, medium, and complex were set by intuition rather than measured task characteristics, making the boundaries inconsistent',
          'Medium tasks have higher output variance, which makes mid-tier performance look worse on average',
        ],
        correct: 2,
        explanation:
          'Routing hierarchies degrade when tier boundaries are defined vaguely. If "medium" means whatever does not feel simple or hard, routing will be inconsistent and the mid tier will receive a noisy mix. The fix is empirical: define thresholds by measuring actual task properties, not by feel.',
        missInsight:
          'A misclassifying router or a weak model are possible but secondary. The most common failure in multi-tier routing is that the tiers themselves were never operationally defined — they are intuitions about complexity, not measured categories with clear decision boundaries.',
      },
      {
        id: 'ts-2',
        text: 'A colleague proposes using an AI tool to flag potentially unfavourable contract clauses before legal review. What is the most important question to answer before deploying it?',
        options: [
          'Whether the model has been trained on legal documents — domain coverage drives recall on specialised content',
          'Whether the flagging rate will be low enough that legal review is not overwhelmed with false positives',
          'Whether the organisation has an enterprise API agreement that covers this business use case',
          'Whether a missed unfavourable clause (false negative) or an unnecessary flag (false positive) is the more costly error in this context',
        ],
        correct: 3,
        explanation:
          'The error cost asymmetry is the deployment decision. If missing a clause causes a bad contract, you need high recall even at the cost of more false positives. If false positives overwhelm reviewers, precision matters more. This determines the operating threshold, the calibration target, and whether AI augmentation is net-positive here at all.',
        missInsight:
          'Domain training and API agreements are real concerns but downstream from the fundamental question. Volume concerns about false positives address one side of the asymmetry. The question that determines whether and how to deploy is which type of error is more expensive — that shapes everything else.',
      },
      {
        id: 'ts-3',
        text: 'You are choosing between (A) one powerful agent with all tools enabled, and (B) multiple specialised agents each with a minimal tool set. When does option B win on architectural grounds?',
        options: [
          'When minimising blast radius matters — narrow tool access limits how far a single mistake can propagate through the system',
          'When the task requires more parallelism than a single agent can provide within its context window',
          'When governance policies restrict multi-tool access to a single agent identity',
          'When API costs for a fully-equipped agent exceed the budget allocated to the workflow',
        ],
        correct: 0,
        explanation:
          'The minimal footprint principle is a safety argument: a single agent with all tools enabled can make a mistake anywhere in the system. Specialised agents with narrow tool sets constrain the failure surface by design — errors are localised because the tools available are localised.',
        missInsight:
          'Parallelism, governance, and cost are all valid reasons, but they are operational concerns, not architectural ones. The architectural argument for option B is blast radius: you want mistakes to be local, and narrow tool access enforces that structurally rather than through policy or monitoring.',
      },
    ],
    masteryInsight:
      'You are making tool and model decisions from first principles — operational routing thresholds set by measurement, error cost asymmetry as the deployment criterion, and minimal footprint as a structural safety property rather than a cost optimisation.',
  },
  {
    domainId: 'failure-diagnosis',
    questions: [
      {
        id: 'fd-1',
        text: 'An AI pipeline runs 1,000 times per day and produces wrong outputs about 2% of the time. No individual run looks obviously different from a correct one. How do you isolate the failing cases systematically?',
        options: [
          'Lower the quality threshold and flag any run scoring below 4/5 — review those for patterns',
          'Build a golden-set evaluator: define correct reference outputs and score all runs against them automatically',
          'Log all inputs and outputs, then search for patterns in the runs that human reviewers later mark as wrong',
          'Prompt the model to self-assess confidence on each run and flag those it marks as uncertain',
        ],
        correct: 1,
        explanation:
          'A golden-set evaluator is the correct instrument at this scale — it creates an automated, consistent signal for what counts as wrong without requiring human review of every run. Without this, you are pattern-hunting in noise rather than measuring a defined failure mode.',
        missInsight:
          'Human-review-then-search is slow and does not scale to 1,000 daily runs. Self-assessed confidence is unreliable — models are often confidently wrong. Threshold-lowering creates a proxy signal but not a definition of failure. A reference-output evaluator turns a pattern-hunting problem into a measurement problem.',
      },
      {
        id: 'fd-2',
        text: 'A prompt worked reliably for three months. Last week it started failing on a subset of inputs. Nothing in your code or configuration changed. What is the most likely explanation?',
        options: [
          'A background model update from the provider changed inference behaviour on this prompt',
          'Accumulated session context from long-running conversations degraded the prompt\'s effectiveness over time',
          'The input distribution shifted — inputs that now fail are structurally different from the ones that have always passed',
          'The prompt crossed an undocumented length threshold that increases the model\'s parsing error rate',
        ],
        correct: 2,
        explanation:
          'When code and config have not changed but failures appear on a subset of inputs, input distribution shift is the first hypothesis: what you are sending has changed in character. Model updates are less common and would typically affect a broader range of inputs immediately, not a specific subset.',
        missInsight:
          'Model updates do happen but providers usually announce breaking changes and they tend to affect all inputs, not a specific subset. Session context drift requires long-running sessions with accumulated history. A specific subset of failures pointing to no code change is the signature of data drift — the inputs themselves changed.',
      },
      {
        id: 'fd-3',
        text: 'You are debugging an agent that occasionally "skips" a step. Adding logging reveals the step IS being called but produces empty output. The next step silently treats empty as "no action needed." What is the actual root bug?',
        options: [
          'The step implementation is flawed — it sometimes produces empty output when it should not',
          'Logging was absent, which masked the failure and made it look like a skip rather than an empty-output event',
          'A race condition in the orchestration layer sometimes calls the step before its dependencies are ready',
          'The downstream step\'s empty-handling logic is the bug — it should treat unexpected empty output as an error, not a valid no-op',
        ],
        correct: 3,
        explanation:
          'The step producing empty output is a symptom. The root bug is the downstream assumption that empty equals a valid no-op. Resilient pipelines treat unexpected empty output from upstream steps as an error signal, not a valid state. The fix there — not in the step — closes the failure mode regardless of what upstream produces.',
        missInsight:
          'Fixing the upstream step treats the symptom — you still have a pipeline where empty passes through silently. Even if this step stops producing empty, any future step that does will propagate the same way. The systemic fix is enforcing that unexpected empty output is an error at every handoff, making the pipeline intolerant of silent failures by design.',
      },
    ],
    masteryInsight:
      'You are diagnosing failures at the structural level — building measurement infrastructure rather than hunting patterns, suspecting data drift before code changes, and identifying the silent-empty-handler as the root bug rather than the upstream step that produced it.',
  },
  {
    domainId: 'multi-agent-orchestration',
    questions: [
      {
        id: 'ma-1',
        text: 'An orchestrator dispatches five sub-agents in parallel. Two fail. It retries them using the original inputs — not the updated state that the three successful agents already produced. What category of bug is this?',
        options: [
          'State staleness — the retry inputs are stale because successful agent outputs were not fed back before the retry was issued',
          'Idempotency failure — the successful agents should not have modified shared state before all five agents completed',
          'Race condition — the retried agents and the successful ones are competing for access to the same shared resource',
          'Deadlock — the retried agents are waiting for outputs that the three successful agents have already consumed',
        ],
        correct: 0,
        explanation:
          'The orchestrator is retrying with stale inputs — it did not incorporate the successful agents\' outputs into the inputs for the failed agents\' retry. This is a state synchronisation bug: partial-success retry logic must explicitly gather intermediate state before issuing retries.',
        missInsight:
          'Idempotency, race conditions, and deadlocks are real concerns but describe different failure modes. The scenario specifically describes stale inputs on retry — the orchestrator\'s retry logic did not account for the state changes already produced by the successful agents, which is the canonical partial-success retry failure.',
      },
      {
        id: 'ma-2',
        text: 'Agent B always depends on Agent A\'s output. A sometimes produces partial results before it has finished. How do you prevent B from acting on incomplete output?',
        options: [
          'Add a time delay between A and B long enough for A to consistently finish before B starts',
          'Define a completion contract for A — a schema with required fields — that B validates before proceeding',
          'Have B poll the size of A\'s output and wait if it is below a minimum threshold',
          'Run A and B in separate queues so B is only triggered when A\'s queue entry is fully consumed',
        ],
        correct: 1,
        explanation:
          'A completion contract — a defined schema with required fields — gives B an explicit, enforceable gate: it proceeds only when A has produced a structurally complete output. This is a semantic definition of "done," not a timing assumption.',
        missInsight:
          'Delays and size thresholds are timing-based guards that break when A\'s execution time or output size varies — both of which will happen in production. Queue consumption signals job completion at the infrastructure level, not semantic completeness at the data level. A schema contract defines what "done" actually means for B\'s purposes, which is the only definition that matters.',
      },
      {
        id: 'ma-3',
        text: 'A human-in-the-loop escalation triggers when agent confidence drops below 0.7. In production, 40% of tasks are being escalated — far above the expected 5%. What is the most likely root cause?',
        options: [
          'The confidence threshold is too high — 0.7 is aggressive and catches tasks that the agent handles correctly',
          'The agents were trained on different data than what they encounter in production, causing systematically low confidence scores',
          'The confidence score reflects the model\'s self-assessed uncertainty, which is miscalibrated and does not correspond reliably to actual task difficulty',
          'The escalation rate is correct — the production task set is simply harder than the design assumptions predicted',
        ],
        correct: 2,
        explanation:
          'LLM self-assessed confidence scores are frequently miscalibrated — a model expressing 0.65 confidence may be correct 90% of the time, or wrong 60% of the time. Using raw self-reported confidence as an escalation threshold without calibration against actual accuracy is the design gap that produces this pattern.',
        missInsight:
          'Threshold tuning and training distribution mismatch are real possibilities but secondary. The fundamental issue is that model-reported confidence is not a reliable probability estimate without calibration — treating it as one is what produces a 40% escalation rate from an expected 5%. The fix is calibration, not threshold adjustment.',
      },
    ],
    masteryInsight:
      'You are designing multi-agent systems with the right failure primitives — state synchronisation in partial-success retries, semantic completion contracts instead of timing guards, and calibration-first thinking about confidence signals rather than naive threshold tuning.',
  },
  {
    domainId: 'business-value-translation',
    questions: [
      {
        id: 'bv-1',
        text: 'An AI tool raised your team\'s throughput 35%. Leadership asks for the ROI. What is the most credible framing?',
        options: [
          'Multiply hours saved by the fully-loaded hourly cost and present as hard savings',
          'Present a three-scenario range — conservative, base, and optimistic — to show confidence bounds on the estimate',
          'Describe the gain as a productivity improvement and let leadership connect it to financial outcomes',
          'Tie the throughput gain to its downstream business impact — what work that could not be done before can now get done, and what is that worth to the business',
        ],
        correct: 3,
        explanation:
          'Hours-saved times rate produces a compelling-looking number that a finance team will immediately deflate: "Did you reduce headcount, or just make people less busy?" The credible ROI frame connects throughput to what newly unlocked capacity is actually used for — new revenue, faster delivery, or avoided hires.',
        missInsight:
          'Scenario ranges are honest but still hours-focused, which is the wrong unit for a board conversation. Leaving the translation to leadership puts the hard work on the audience. Hours-times-rate counts time saved but not value created. The board-level frame is what the capacity is used for, not how much of it was freed.',
      },
      {
        id: 'bv-2',
        text: 'A sceptical executive says: "We tried AI tools two years ago and they did not work. Why is this different?" What is the strongest response?',
        options: [
          'Name the specific capability gap that caused the previous failure and show concrete evidence that gap is now closed',
          'Acknowledge the concern and offer a small pilot to rebuild confidence incrementally before committing to a larger rollout',
          'Point to the broader market — most competitors are now deploying similar tools with demonstrable results',
          'Explain that AI capabilities have improved substantially since then and this generation of tools is categorically more capable',
        ],
        correct: 0,
        explanation:
          'The strongest response addresses the specific failure — was it hallucination, integration complexity, adoption resistance, or cost? Naming exactly what was wrong then and showing specific evidence it is resolved makes the objection lose its force. Generic "AI has improved" is the same argument vendors made two years ago.',
        missInsight:
          '"AI has improved" is exactly what the sceptic expects to hear and will not move them — it was the vendor argument the last time too. A pilot is cautious but does not address the past failure. Competitor references shift the question to social proof rather than answering whether the specific problem was solved. Only naming the failure and its closure turns the sceptic\'s evidence against them.',
      },
      {
        id: 'bv-3',
        text: 'You need to help a CEO choose between three AI initiatives: (A) saves 200 hours/month in ops, (B) reduces customer churn by 0.5%, (C) accelerates a key product feature by 6 weeks. What framing gives the clearest basis for a decision?',
        options: [
          'Present all three options with their metrics and let the CEO decide based on strategic priorities you may not be aware of',
          'Convert B and C into revenue-equivalent terms, let A compete as cost savings, then recommend based on the company\'s current OKRs',
          'Lead with option A — it is the most concrete and measurable, which makes it the easiest to defend',
          'Lead with option C — time-to-market acceleration is typically the highest-leverage strategic variable',
        ],
        correct: 1,
        explanation:
          'Leaving the options in different units (hours, churn rate, weeks) hands the CEO an apples-to-oranges comparison. Converting B and C into a common financial currency, letting A compete on cost, then recommending based on what the company is actually optimising for — that is the professional translation move.',
        missInsight:
          'Presenting all three without conversion puts the translation burden on the audience. Defaulting to A (measurable) or C (time-to-market feels strategic) reflects the presenter\'s bias, not the company\'s priorities. The move that earns credibility is creating a common unit and recommending based on what the business is actually optimising for right now.',
      },
    ],
    masteryInsight:
      'You are translating AI value into the language of business decisions — connecting throughput gains to downstream impact rather than cost hours, naming specific past failures to address scepticism, and converting heterogeneous options into a common currency before recommending.',
  },
]

export function findDomainSet(domainId: string): AssessmentDomainSet | undefined {
  return ASSESSMENT.find((d) => d.domainId === domainId)
}
