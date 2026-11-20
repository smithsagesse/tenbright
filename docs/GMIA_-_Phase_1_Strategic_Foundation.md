# GMIA — Phase 1 Strategic Foundation

Nov 3, 2026 · @Smith

## Executive summary and approval gates

Recommendation: launch GMIA as a no-ads, mastery-certified math program for US families with children aged 7–10 (grades 2–4), web-first, with one narrow strand built end to end before anything else. The lifelong eight-stage vision stays as architecture, not as scope.

What the research changed in the directive:

- **The market gap is real but specific.** 24% of US 4th graders scored below NAEP Basic in math in 2024, 5 points worse than 2019. The leading game (Prodigy) is criticized for practice without instruction and aggressive upselling; the leading AI tutor (Synthesis) for thin content. The opening is *instruction + verified mastery + honest monetization*.
- **Soroban is evidence-backed but slow.** A 3-year RCT found arithmetic gains; a 1-year US trial found none. It belongs in the product as a long-horizon track and a place-value tool, not as an MVP promise.
- **"Vedic" must be framed carefully.** The methods come from a 1965 book; scholars, and the book's own editor, say the sutras are not found in the Vedas. We teach the techniques on their mathematical merits and say so plainly.
- **An LLM must never be the source of math truth.** Studies document arithmetic and reasoning errors in tutoring LLMs. All answers are generated and checked by a deterministic math engine; the AI only explains.
- **Compliance is already live.** The amended COPPA Rule's compliance date was April 22, 2026. Using children's data to train AI now needs separate parental consent.
- **"Learning styles" is out.** The directive's own wording avoids it; we design to evidence on multiple representations instead.
- **Stage 1 (12–24 months) cannot be a screen product.** AAP guidance is no screen media under 18 months except video chat. Stage 1 becomes caregiver-led offline activity cards.

### Decisions for your approval

1. **Beachhead**: US families, children 7–10, grades 2–4, plus homeschool families. Web app (installable on tablets) first; native apps later.
2. **MVP strand**: place value → multi-digit addition and subtraction → meaning of multiplication and facts to 10×10, in one world (Number Kingdom), with the virtual abacus as a place-value tool and 3–5 mental strategies.
3. **Vedic positioning**: name the program "Mental Math Strategies" with a clearly labeled history panel on the Vedic Mathematics tradition.
4. **AI tutor scope at launch**: no open-ended chat for under-13s; the tutor gives scripted, verified hints and explanations chosen by the engine. Voice and free-form questions come after a safety review.
5. **Business model**: free core curriculum; family subscription for the full tutor and parent tools; no ads, no in-game purchases, nothing sold to the child.
6. **Build path**: lean founder-led build with AI-assisted engineering and paid human expert reviewers, versus raising money for a team. Section 8 costs both.
7. **Shared platform**: decide whether GMIA and Piano Quest share one learner, progress and parent-dashboard engine.

Once approved, Phase 2 (Educational Blueprint) starts with the full competency map for the MVP strand.

## Global Expert AI Council

The council is one AI applying ten disciplined review lenses, not ten independent experts. Every major decision is run through the lenses below, conflicts are logged, and anything that needs real authority goes to a named human reviewer.

| Role (lens) | Owns | Decides alone | Must escalate | Phase 1–4 deliverable |
| --- | --- | --- | --- | --- |
| Chief Executive Intelligence | Vision, trade-offs, decision register | Sequencing, scope cuts | Anything changing beachhead, price or brand | This blueprint, decision register |
| Chief Academic | Curriculum integrity, standards alignment | Lesson order inside a strand | Adding or dropping a strand | Competency map, Common Core alignment |
| Chief Mathematics | Correctness of every item, method and hint | Rejecting any item that fails verification | Disputed method choices | Item verifier spec, method notes |
| Chief Child Development | Age fit, session length, emotional safety | Session caps, language level | Any mechanic touching rewards or failure | Age-fit rules per stage |
| Chief AI & Technology | Architecture, adaptive engine, AI tutor | Stack choices inside budget | Any open-ended AI exposure to children | Architecture, ADRs |
| Chief Product & Experience | Learner and parent journeys, MVP quality | UX within the design system | Cutting an MVP acceptance criterion | Journeys, wireframes, PRD |
| Chief Creative & Entertainment | Universe, characters, art, sound | Art direction | Brand name and mascot final | Style guide, mascot, cover |
| Chief Financial Intelligence | Money and business-sim curriculum | Scenario content | Anything resembling real financial advice | Phase 5 curriculum |
| Chief Security & Privacy | COPPA, GDPR-K, security program | Blocking any data flow | Launch go/no-go | Privacy design, retention and security policies |
| Chief Quality & Research | Testing, efficacy measurement | Failing a release on quality | Publishing any efficacy claim | QA plan, pilot study design |

**Governance rules**

- Every decision gets an entry: options, evidence, the lens that objected, the call, and who can reverse it.
- Evidence is graded on four levels: Strong (multiple RCTs or meta-analyses), Moderate, Emerging, and Opinion. A claim to parents must be Strong or Moderate.
- Ties go to learner safety, then educational effectiveness, then accessibility, then commercial value, as the directive requires.

**Human review that the AI cannot replace** (budgeted in section 8)

- A math-education specialist (elementary) to review the competency map and items.
- A developmental psychologist or experienced K–3 teacher for age fit and usability sessions.
- A children's-privacy attorney for COPPA notices, consent flows and retention policy before launch.
- An accessibility auditor (WCAG 2.2 AA) before public release.
- An independent evaluator for any efficacy study whose results will be published.

## Executive product strategy

GMIA wins by being the program a parent can trust: it teaches before it tests, certifies mastery with delayed retention checks, and never sells to the child.

**Problem.** [NAEP 2024](https://www.nationsreportcard.gov/reports/mathematics/2024/g4_8/): 39% of 4th graders were Proficient in math and 24% were below Basic, 5 points worse than 2019. Families supplementing at home face two bad options: engaging games that mostly drill, or rigorous materials that need a parent to teach.

**Beachhead customer.** A parent of a 7–10-year-old who already pays for enrichment and wants proof the child is learning. Two segments:

| Segment | Size signal | Why they buy | Primary channel |
| --- | --- | --- | --- |
| After-school supplement families | \~54M US K–12 students; grades 2–4 is \~11M | Child is behind, bored, or ahead | Parent communities, pediatric and school word of mouth, app stores |
| Homeschool families | 3.4M students in 2024–25 ([NHERI](https://nheri.org/?p=309582)) | Need a full, structured math core with records | Co-ops, homeschool conventions, ESA/voucher-eligible vendor lists |

Georgia, where you are, is among the largest homeschool states, so local co-ops are a practical first pilot pool.

**Value proposition (one line).** "Real teaching, verified mastery, and a weekly plain-English report on what your child understands, with no ads and nothing for sale inside the game."

**Wedge features** (what competitors do not combine):

1. Instruction, not just questions: every skill follows discover → demonstrate → guided → independent.
2. Mastery certificates that require a 7-, 30- and 90-day retention check.
3. A parent report that names the misconception and the next at-home activity.
4. Mental-math strategies and a virtual soroban as genuine tools, not gimmicks.
5. A clean monetization promise, written into the terms.

**Business model.** Free core lessons for one learner; a family plan unlocks the full curriculum, adaptive tutor, multiple learners, printables and reports. Working price hypothesis: $9–12 per month or $79–99 per year per family, between Khanmigo ($44/yr) and Synthesis ($99–129/yr+). School and co-op licensing follows only after an efficacy pilot. To validate in Phase 4 with a pricing test.

**What we will not do.** Ads, in-game currency for sale, member-only cosmetics shown to free players, streak-loss punishment, public leaderboards for children, or efficacy claims without a study.

**Business objectives (first 12 months after MVP launch, to be confirmed)**

- 300 pilot learners with complete pre/post data on the MVP strand.
- Retention: 40% of pilot learners active weekly at week 8.
- Learning: a measurable gain on an independent place-value and addition test versus a waitlist comparison group.
- Revenue: 500 paying families as the proof point before any school sales.

## Competitive landscape

No current product combines real instruction, verified retention, strong game engagement and a clean monetization model for ages 7–10; each leader is strong on one or two of these.

| Product | Ages / grades | Price (2026) | Strength | Weakness GMIA exploits |
| --- | --- | --- | --- | --- |
| [Prodigy Math](https://www.edweek.org/technology/popular-interactive-math-game-prodigy-is-target-of-complaint-to-federal-trade-commission/2021/02) | Grades 1–8 | Free; premium \~$60–107/yr | 100M+ registered users, high engagement, school reach | 2021 FTC complaint over upselling to kids; advocates found more ads than math in a sample; mostly practice, little teaching ([Markey letter](https://www.markey.senate.gov/download/ftc-prodigy?download=1)) |
| [Synthesis Tutor](https://vantaige.io/ai-tool/synthesis-tutor) | Ages 5–11, K–5 | \~$99–129/yr family | Voice-first AI tutor, visual manipulatives | Parent reviews cite thin content advanced kids finish in weeks ([Trustpilot](https://nl-be.trustpilot.com/review/www.synthesis.is)) |
| [Khan Academy / Khanmigo](https://nibble-app.com/blog/khan-academy-pricing) | PreK–12 | Core free; Khanmigo $44/yr | Free, broad, mastery tracking, trusted nonprofit | Video-and-exercise format is light on play for 7-year-olds; Khanmigo has made arithmetic errors ([CNN](https://krdo.com/?p=1032965)) |
| [Beast Academy](https://brighterly.com/blog/beast-academy-vs-khan-academy/) | Ages 6–13 | \~$100/yr online; $160 with books | Rigorous problem solving, beloved by advanced families | Aimed at strong students; heavy reading; little support for struggling learners |
| [DreamBox Math](https://discoveryeducation.com/?p=164808) | K–8, mostly schools | District licensing | Adaptive lessons with virtual manipulatives; quasi-experimental Harvard CEPR evidence | Sold to schools, not families; evidence is mostly vendor-reported correlations with usage |
| IXL, Zearn, i-Ready | K–12, schools | District or \~$10–20/mo | Standards coverage, teacher reports | Worksheet feel; low intrinsic motivation |
| Soroban apps and franchise abacus classes | Ages 5–12 | Apps low cost; classes roughly $80–150/mo (unverified estimate) | Strong parent demand in some communities | Speed-drill focus; rarely checks conceptual understanding |

Prices from third-party review sites as of 2026; confirm on each vendor's site before using in pricing.

**Positioning map in one sentence:** Prodigy and Synthesis own engagement, Khan and Beast own rigor, and nobody owns *trusted proof of learning for parents*. That is GMIA's lane.

**Lessons we adopt**

- From Prodigy: a persistent world and avatar drive return visits. We keep the world and remove the money pressure.
- From DreamBox: virtual manipulatives inside lessons, with usage recommendations tied to outcomes.
- From Khan: free core access builds trust and word of mouth.
- From Synthesis: parents will pay $100+ a year for something that feels like a tutor; the risk is running out of content, so the MVP must be deep in one strand rather than shallow across many.

## Educational philosophy and evidence base

GMIA's philosophy is *understand, then practice, then prove it later*: concepts are built with concrete and visual representations, practice is spaced and mixed, and mastery counts only when it survives a delay.

**Seven design commitments**

1. Concrete → representational → abstract (CPA) for every new idea, with the number line as a core representation.
2. Explicit, systematic instruction with worked examples before independent work.
3. Precise mathematical language, taught on purpose.
4. Spaced, interleaved review built into every session, not left to the learner.
5. Fluency practice after understanding, short and low-pressure, never as the first exposure.
6. Multiple representations chosen by what works for the concept and the learner's evidence, not by a "learning style."
7. Retention and transfer are the definition of mastery.

**Evidence register**

| Method | Evidence grade | Key finding | GMIA use | Limits |
| --- | --- | --- | --- | --- |
| Systematic instruction, math language, representations, number line, word-problem schemas, timed fluency activities | Strong–Moderate | The six recommendations of the IES [WWC 2021 practice guide](https://ies.ed.gov/ncee/WWC/Docs/PracticeGuide/WWC2021006-Math-PG.pdf) for K–6 math intervention | Core lesson template | Evidence base is intervention for struggling students; apply with care to advanced learners |
| Spaced practice | Moderate | Math-specific meta-analysis: g = 0.28 across 27 studies, smaller than in other domains ([Murray et al., 2025](https://eprints.whiterose.ac.uk/id/eprint/229807)) | Review scheduler; 7/30/90-day checks | Effect is real but modest; don't overclaim |
| Interleaved practice | Moderate–Strong | Preregistered RCT, 54 grade-7 classes: d = 0.83 on a test a month later ([Rohrer et al., 2019](https://Www.Gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf)); also shown in grade 4 | Mixed review sets after a skill is first learned | Blocked practice first; interleave only once a schema exists |
| Retrieval practice (testing vs restudy) in math | Emerging | Math meta-analysis g = 0.18 with a confidence interval crossing zero | Used, but measured, not promised | Not yet robust in math specifically |
| Mental abacus (soroban) | Moderate, long horizon | 3-year RCT (204 children, India): arithmetic gains, no change in working memory ([Barner et al., 2016](https://dash.harvard.edu/entities/publication/6ede5ea3-5cef-4451-8993-b7f5eeb2f500)). 1-year US trial: no computation advantage; hints of place-value benefit ([Barner et al., 2017](https://jnc.psychopen.eu/article/view/106)) | Optional multi-year track; place-value tool in MVP | Benefits need years and high practice; no "brain training" claims |
| Vedic mathematics techniques | Emerging, low quality | Small Indian studies report speed and accuracy gains with weak designs; historical claims rejected by S. G. Dani and others ([summary](https://hindutone.com/hinduism/vedic-mathematics-myth-vs-fact-bharati-krishna-tirtha/)) | Taught as alternative strategies with the math explained | No superiority claims; no claim of Vedic origin |
| Learning-styles matching | Not supported | No adequate evidence that matching instruction to a preferred style improves learning ([Pashler et al., 2008](https://digitalcommons.usf.edu/psy_facpub/1765/)) | Not used | Preferences still inform motivation, not instruction |
| Adaptive software with manipulatives | Moderate, mostly correlational | DreamBox: usage linked to MAP gains; one RCT met ESSA "Strong" with effect size +0.11 | Adaptive engine design | Effects are small; usage fidelity drives results |

**Rules that follow from this register**

- Speed is measured separately and never gates understanding.
- No claims about IQ, brain development or "intelligence" gains, in product copy or to investors.
- Numerology may appear only as cultural history, labeled as not mathematics.
- Every new method added later enters this table with a grade before it ships.

## Curriculum architecture

The curriculum is a single competency graph, not a set of grade-level courses: age sets the wrapper (language, session length, safeguards), and demonstrated mastery sets what the learner may study next.

**Two independent axes per learner**

- *Age band* (from caregiver-entered birth year only) controls interface, reading level, session caps, AI exposure and safeguards. It never relaxes because a child is advanced.
- *Mastery position* (from placement and certified skills) controls which competencies unlock. A 7-year-old who has mastered multiplication may start fractions while keeping every 7-year-old safeguard.

**Competency graph structure** (built in Phase 2)

- Strand → Domain → Competency → Micro-skill, each micro-skill tagged with prerequisites, Common Core code, representations used, and known misconceptions.
- Example chain: *Place value to 1,000* → *Regrouping in addition* → *Multi-digit addition* → *Estimation and reasonableness*.
- Signature programs (Mental Math Strategies, Soroban) attach to the graph as alternative methods for the same competencies, so they reinforce rather than compete with the core.

**Eight stages: scope and our position**

| Stage | Age | Primary focus | Delivery | Build phase |
| --- | --- | --- | --- | --- |
| 1 | 12–24 mo | Quantity awareness | Caregiver-led printable activity cards only; no child screen use under 18 months, per AAP guidance | 6 (cards only) |
| 2 | 2–3 yr | Counting, number recognition | Co-play with a caregiver; under 1 hr/day total media for ages 2–5 | 6 |
| 3 | 3–5 yr | Subitizing, comparing, early patterns | Short co-play sessions plus offline play | 6 |
| 4 | 5–7 yr | Foundational arithmetic, place value to 100 | App with audio-first instructions | 5 (as a placement floor) |
| 5 | 7–10 yr | Fluency, multi-digit operations, multiplication, early fractions | **Beachhead; full app** | 4 (MVP), 5 |
| 6 | 10–13 yr | Fractions, decimals, ratios, percent, pre-algebra | App plus business simulations | 5–6 |
| 7 | 13–18 yr | Algebra, statistics, financial independence | App; teen consent rules | 7 |
| 8 | 18+ | Lifelong quantitative and financial skills | Adult product line | 7 |

**MVP strand detail (Stage 5, grades 2–3)**

1. Place value to 1,000: build, read, compare, round. Representations: base-ten blocks, number line, soroban rods.
2. Addition and subtraction within 1,000: strategies first (make-ten, compensation, splitting), then the standard algorithm.
3. Meaning of multiplication: equal groups, arrays, skip counting, repeated addition.
4. Multiplication facts to 10×10 through derived-fact strategies, then spaced fluency practice.
5. Word problems using schema diagrams across all four topics.

This strand covers roughly a year of grade 2–3 core content, which is enough depth to avoid the "finished it in a few weeks" complaint seen in competitors' reviews.

## Mastery engine definition

A skill moves through four states, Learning → Practiced → Mastered → Certified, and only Certified (mastery that survived the 30-day check) earns a certificate; a missed 90-day check sends that one skill back to Practiced without resetting the strand.

**Instructional cycle per micro-skill** (the directive's ten steps, compressed into what the engine tracks)

1. Discover: a short story hook in the world.
2. Introduce and demonstrate: worked example with a concrete or visual model, narrated.
3. Explore: the learner manipulates the model; no scoring.
4. Guided practice: graduated hints (nudge → strategy reminder → partial worked step → full worked example).
5. Independent practice: no hints; scored.
6. Apply: one unfamiliar context problem.
7. Explain: the learner chooses or builds the reasoning (picking the correct model or ordering steps), since 7-year-olds can't type explanations reliably.
8. Assess and schedule retention checks.

**Proposed mastery thresholds** (configurable; to validate in the pilot)

| Gate | Requirement | Notes |
| --- | --- | --- |
| Practiced → Mastered | ≥90% on at least 10 independent items, across ≥3 problem formats, plus 1 transfer item and 1 explain item correct | Matches the directive; 90% on ≥10 items keeps a single slip from blocking progress |
| 7-day check | ≥80% on 4–5 mixed items | Lower bar because items are interleaved with other skills |
| 30-day check → Certified | ≥80% on 4–5 mixed items | Certificate issued here |
| 90-day check | ≥80%; a miss returns the skill to Practiced with targeted review | Never a full restart |

The 80% delayed bars are a proposal: a 90% bar on 4–5 interleaved items fails a learner for one slip. The pilot will test both.

**Measured separately, never blended into one score**

| Dimension | How measured |
| --- | --- |
| Accuracy | % correct on independent items |
| Fluency | Median response time on mastered facts, tracked only after accuracy ≥90% |
| Conceptual understanding | Explain items, model-choice items, misconception probes |
| Transfer | Novel-context items |
| Retention | 7/30/90-day results |
| Strategy | Which method the learner chose (e.g., counting on vs make-ten) |
| Error pattern | Tagged against a misconception library (e.g., subtracting smaller digit from larger in every column) |
| Independence | Hint level used per item |
| Confidence | Optional one-tap self-rating, compared with actual accuracy |

**Remediation rule.** When an error matches a known misconception, the engine returns the learner to the specific prerequisite micro-skill with a different representation, then retests the original item; it never restarts the whole topic.

**No permanent labels.** Profiles store evidence, not identities: no "slow learner" or "gifted" tags, and all estimates decay and update.

## Technical feasibility, architecture and child safety

The MVP is technically feasible for a small team because the hard part, correct and adaptive math, is deterministic code; generative AI is confined to wording that the math engine has already verified.

&#91;embedded content: MVP architecture · 7 components\]

The child and parent apps talk only to the API; the AI service never sees a question the math engine has not already solved.

**Architecture decisions (proposed ADRs)**

| # | Decision | Why | Trade-off |
| --- | --- | --- | --- |
| ADR-1 | Web app (TypeScript, installable PWA) first; wrap for iOS/Android later | One codebase, works on tablets and Chromebooks, no app-store revenue share at first | Weaker offline and push than native; app-store discovery comes later |
| ADR-2 | Curriculum as versioned content files (competency graph + item templates) in source control | Reviewable by human experts, diffable, testable | Needs a simple authoring tool by Phase 5 |
| ADR-3 | Deterministic math engine generates every item, answer and worked step | Removes LLM arithmetic errors from anything graded | More engineering per item type |
| ADR-4 | Knowledge tracing per micro-skill + spaced-review scheduler, rules-based first | Explainable to parents; works with little data | Less sophisticated than ML models until data exists |
| ADR-5 | LLM used server-side only, to phrase hints and explanations from engine-supplied facts, with an output checker | Warmth and variety without risking wrong math | Latency and per-call cost; vendor terms must forbid training on our data |
| ADR-6 | Managed Postgres + serverless API; parent is the only account holder; children are profiles | Minimal child data; simple consent model | Vendor lock-in, mitigated by standard SQL |
| ADR-7 | Offline-first lessons with sync | Car rides, weak Wi-Fi, homeschool co-ops | Conflict handling on sync |
| ADR-8 | First-party analytics only; no third-party SDKs in the child experience | COPPA disclosure risk and trust | Fewer off-the-shelf growth tools |

**Child data we collect, and nothing else**

- From the parent: email, password, payment (via processor), child first name or nickname, birth year.
- From the child's use: answers, timings, hint use, strategy choices, session length.
- Not collected: child email, photos, precise location, contacts, free-text chat (MVP), voice recordings (MVP).

**COPPA and AI obligations** (amended Rule; compliance date April 22, 2026, per the [Federal Register](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule))

- Verifiable parental consent before any child data is collected; the amended Rule adds methods such as "text plus."
- *Separate* parental consent for any third-party disclosure that isn't integral to the service; the FTC lists disclosure to train AI as not integral ([Perkins Coie](https://perkinscoie.com/print/pdf/node/9535)). Our default: no child data used for AI training, so no such consent is requested.
- A written data retention policy with deletion timeframes, published in the privacy notice.
- A written information security program with a named coordinator, risk assessments and vendor assurances.
- Parents can review and delete a child's data at any time.
- GDPR/UK Children's Code compliance deferred to Phase 6, when we sell outside the US.

**AI tutor safety at launch**

- The tutor is presented as "a helper character made by a computer," never a person or friend.
- No open text or voice input from children in the MVP; children choose from offered responses.
- No persistent "relationship" features, no messages outside sessions, no secrecy prompts.
- Every AI-phrased explanation is checked against engine facts and a blocklist before display; failures fall back to a pre-written script.
- This posture also keeps us clear of the scrutiny the FTC opened on AI "companion" chatbots and minors in September 2025 ([FTC 6(b) study](https://www.dlapiper.com/en-cl/insights/publications/2025/09/ftc-ai-chatbots)).

**Feasibility verdict.** Green for the MVP. Amber for open-ended AI conversation with under-13s (needs a dedicated safety program before it ships). Red for any claim of cognitive or IQ improvement.

## MVP definition, roadmap and budget

The MVP is one complete world, Number Kingdom, that takes a 7–9-year-old from placement through certified mastery of the strand in section 5, with a working parent dashboard. Target: pilot in summer 2027, public launch for back-to-school, September 2027.

**MVP features and acceptance criteria**

| # | Feature | Acceptance criterion | Priority |
| --- | --- | --- | --- |
| 1 | Parent onboarding + verifiable consent | No child data stored before consent is recorded; consent is revocable and deletes data | P0 |
| 2 | Child profiles (age band + nickname) | Age band drives session cap and UI; no child login credentials | P0 |
| 3 | Placement assessment | ≤15 minutes; places learner on the graph; re-test agrees with first placement on ≥80% of micro-skills in a pilot sample | P0 |
| 4 | Adaptive path | Next activity always has prerequisites met; parent can see why it was chosen | P0 |
| 5 | Core strand lessons (4 topics) | Every micro-skill has the full cycle; 100% of items pass the automated verifier and human review | P0 |
| 6 | Guided practice with 4-level hints | Hint levels logged; full worked example always available | P0 |
| 7 | Independent assessments + 7/30/90-day checks | Scheduler fires checks within ±1 day; results update mastery state | P0 |
| 8 | Misconception-targeted remediation | ≥15 common misconceptions detected and routed for the strand | P0 |
| 9 | Parent dashboard + weekly report | Report states understood / struggling / why / next home activity in plain language | P0 |
| 10 | Virtual soroban (place-value mode) | Bead state always matches the displayed number; used in place-value lessons | P1 |
| 11 | Mental Math Strategies (3–5 techniques) | Each technique has the math explained, compared with the standard method, and assessed for accuracy | P1 |
| 12 | Printable offline exercises | Generated from the learner's current skills with an answer key | P1 |
| 13 | Accessibility baseline | WCAG 2.2 AA on the parent side; audio for all child instructions; color-independent feedback | P0 |

**Deliberately excluded from the MVP:** open AI chat, voice input, fractions and beyond, the other 13 worlds, business simulations, school licensing and multiple languages.

**Phase gates**

| Gate | When (target) | Pass criteria |
| --- | --- | --- |
| G1: Strategy approved | Nov 2026 | You approve section 1 decisions |
| G2: Blueprint approved | Dec 2026 | Competency map and item specs reviewed by a math-education specialist |
| G3: Design approved | Feb 2027 | Brand, mascot and clickable prototype tested with 5–8 children |
| G4: MVP feature-complete | May 2027 | All P0 criteria met; privacy attorney sign-off |
| G5: Pilot results | Aug 2027 | Pre/post gain vs waitlist group; ≥40% week-8 weekly activity |
| G6: Public launch | Sep 2027 | Accessibility audit passed; pricing test complete |

**Budget assumptions** (estimates for planning, not quotes)

| Line item | Lean path (founder + AI-assisted build) | Funded team path (year 1) |
| --- | --- | --- |
| Engineering | Founder time + AI coding tools, \~$100–300/mo | 2–3 engineers, \~$400–600k |
| Learning design and content | Math-education specialist review, \~$5–10k | Learning designer FTE, \~$120–160k |
| Art, mascot, sound | Contract illustrator and composer, \~$8–25k | Designer/artist FTE + contractors, \~$150–220k |
| Child-development usability | Teacher or psychologist sessions, \~$2–5k | Included above + research contractor, \~$30–50k |
| Legal and privacy | COPPA review, notices, terms, \~$5–15k | Retained counsel, \~$30–60k |
| Accessibility audit | \~$3–10k | \~$10–20k |
| Infrastructure + LLM | \~$100–500/mo during pilot | \~$20–50k |
| Pilot incentives and evaluation | \~$3–8k | Independent evaluator, \~$40–80k |
| **Total (approx.)** | **\~$30–80k over 9–10 months** | **\~$0.9–1.3M** |

The lean path is realistic only with disciplined scope; it delays everything after the MVP. The funded path should not start until the pilot (G5) shows learning gains, because that result is what investors and schools will ask for.

## Risk register and decision register

The three risks most likely to sink GMIA are scope creep, content that runs out, and an efficacy claim we cannot back; all three are controlled by the narrow MVP and the pilot gate.

**Risk register**

| # | Risk | Likelihood | Impact | Mitigation | Owner (lens) |
| --- | --- | --- | --- | --- | --- |
| R1 | Scope creep from the 30-deliverable vision stalls the MVP | High | High | One world, one strand; new scope only through the decision register | Executive |
| R2 | Content depth runs out for advanced learners | Medium | High | Year-long strand; Phase 5 fractions queued; placement lets advanced kids skip ahead | Academic |
| R3 | An item or hint is mathematically wrong | Medium | High | Deterministic engine, property-based tests, human review of every template | Mathematics |
| R4 | LLM produces unsafe or wrong text for a child | Low (by design) | High | No free input; engine-checked facts; scripted fallback | AI & Technology |
| R5 | COPPA non-compliance (consent, retention, vendors) | Medium | High | Attorney review before G4; vendor data-processing agreements; no third-party SDKs | Security & Privacy |
| R6 | Engagement too low without manipulative mechanics | Medium | High | Story, avatar, unlockable world areas, mastery celebrations; measure at G3 and G5 | Creative |
| R7 | Pilot shows no measurable learning gain | Medium | High | Fix before scaling; report honestly; this is the point of G5 | Quality & Research |
| R8 | Vedic content draws cultural or accuracy criticism | Medium | Medium | Accurate history panel; techniques taught on mathematical merit | Academic |
| R9 | Customer acquisition cost exceeds lifetime value | Medium | High | Homeschool co-ops and parent communities first; free core for word of mouth | Product |
| R10 | Founder time limited by a full-time role and other ventures | High | High | Lean scope; contracted specialists; scheduled build blocks | Executive |
| R11 | A well-funded competitor ships similar features | Medium | Medium | Trust and evidence as the moat; publish the pilot | Executive |

**Decision register (Phase 1)**

| ID | Decision | Status | Evidence | Reversible by |
| --- | --- | --- | --- | --- |
| D1 | Beachhead: US families, ages 7–10, plus homeschoolers | Approved Nov 3 | NAEP gap; homeschool growth; competitor gaps | You |
| D2 | MVP strand: place value → add/subtract → multiplication | Approved Nov 3 | Prerequisite chain for all later Stage 5–6 content | You, with Academic lens |
| D3 | "Mental Math Strategies" naming with honest Vedic history | Approved Nov 3 | Dani; book's own editor | You |
| D4 | Soroban as long-horizon track; place-value mode in MVP | Approved Nov 3 | Barner 2016, 2017 | Academic lens after pilot |
| D5 | No open AI chat for under-13s at launch | Approved Nov 3 | LLM math errors; FTC companion-chatbot study; COPPA | Security & Privacy lens |
| D6 | No ads, no in-game purchases | Approved Nov 3 | Prodigy complaint and reviews | You |
| D7 | Web-first PWA | Approved Nov 3 | Cost, reach, single codebase | AI & Technology lens |
| D8 | Stage 1–3 as caregiver-led co-play and printables | Approved Nov 3 | AAP media guidance | Child Development lens |
| D9 | Lean vs funded build path | Assumed lean (Phase 2) | Section 8 budget | You |
| D10 | Shared engine with Piano Quest | Open | Not yet assessed | You |

**Open questions for you**

- [ ] Is the product name "Global Mathematics Intelligence Academy" final for the consumer brand, or a company name with a friendlier product name for children?
- [ ] How many hours per week can you commit to the build through May 2027?
- [ ] Do you want the pilot run through local homeschool co-ops, schools you have contacts with, or both?

## Sources

Research as of November 3, 2026. Figures from third-party review sites are marked as such in the text and should be confirmed with each vendor.

**Need and market**

- [NAEP 2024 Mathematics, grades 4 and 8](https://www.nationsreportcard.gov/reports/mathematics/2024/g4_8/)
- [NHERI: homeschool students in 2024–25](https://nheri.org/?p=309582)
- [Homeschool states ranking (Kidsmoney, citing NHERI)](https://www.kidsmoney.org/?p=4825)

**Competitors**

- [EdWeek: Prodigy FTC complaint](https://www.edweek.org/technology/popular-interactive-math-game-prodigy-is-target-of-complaint-to-federal-trade-commission/2021/02)
- [Sen. Markey letter to FTC on Prodigy](https://www.markey.senate.gov/download/ftc-prodigy?download=1)
- [Synthesis Tutor profile and pricing (Vantaige)](https://vantaige.io/ai-tool/synthesis-tutor)
- [Synthesis parent reviews (Trustpilot)](https://nl-be.trustpilot.com/review/www.synthesis.is)
- [Khan Academy and Khanmigo pricing (Nibble)](https://nibble-app.com/blog/khan-academy-pricing)
- [CNN on Khanmigo math errors](https://krdo.com/?p=1032965)
- [Beast Academy pricing (Brighterly)](https://brighterly.com/blog/beast-academy-vs-khan-academy/)
- [DreamBox / Harvard CEPR study summary](https://discoveryeducation.com/?p=164808)

**Learning science**

- [IES What Works Clearinghouse, Assisting Students Struggling with Mathematics (2021)](https://ies.ed.gov/ncee/WWC/Docs/PracticeGuide/WWC2021006-Math-PG.pdf)
- [Murray, Horner & Göbel (2025), spacing and retrieval meta-analysis for math](https://eprints.whiterose.ac.uk/id/eprint/229807)
- [Rohrer et al. (2019), RCT of interleaved math practice](https://Www.Gwern.net/doc/psychology/spaced-repetition/2019-rohrer.pdf)
- [Barner et al. (2016), 3-year RCT of mental abacus](https://dash.harvard.edu/entities/publication/6ede5ea3-5cef-4451-8993-b7f5eeb2f500)
- [Barner et al. (2017), 1-year US trial of mental abacus](https://jnc.psychopen.eu/article/view/106)
- [Pashler et al. (2008), Learning Styles: Concepts and Evidence](https://digitalcommons.usf.edu/psy_facpub/1765/)
- [Vedic Mathematics history and Dani's critique (summary)](https://hindutone.com/hinduism/vedic-mathematics-myth-vs-fact-bharati-krishna-tirtha/)
- [AAP media guidance for young children (summary)](https://www.consultant360.com/exclusives/aap-changes-media-use-guidelines-children)

**AI and regulation**

- [Federal Register: amended COPPA Rule](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule)
- [Perkins Coie: separate consent, AI training, retention](https://perkinscoie.com/print/pdf/node/9535)
- [Benesch: COPPA amendments guidance](https://www.beneschlaw.com/insight/the-ftc-finalizes-changes-to-the-coppa-rule-updated-guidance-for-businesses-in-the-new-era-of-childrens-privacy/)
- [DLA Piper: FTC 6(b) study of AI companion chatbots](https://www.dlapiper.com/en-cl/insights/publications/2025/09/ftc-ai-chatbots)
- [LLM math reasoning errors (arXiv 2508.09932)](https://arxiv.org/html/2508.09932v1)
- [Steinbach et al. (2025), erroneous LLM feedback in math tutoring](https://educationaldatamining.org/EDM2025/proceedings/2025.EDM.doctoral-consortium-papers.254/index.html)
