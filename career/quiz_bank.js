/* ============================================================================
 * DriveShowdown — CAREER MODE quiz bank  (content, not engine)
 * ----------------------------------------------------------------------------
 * Source: Sam's own FRC / robotics lectures (uploaded 2026-06-20). Every fact
 * here is distilled from one of those sheets — see each question's `src`.
 *
 * AUDIENCE / LEVEL (locked with Sam):
 *   Late-elementary → early-middle-school, up to a high-school freshman.
 *   "Focus on the basics." Only light algebra / multiply / divide. The VEX
 *   series-&-parallel sheet is the reference reading level.
 *
 * HOW THIS FEEDS THE GAME (see CAREER_PLAN.md §6):
 *   - Each row becomes a CAREER_QUIZ beat: prompt + options, `answer` is the
 *     index of the correct option, `explain` is the teach-back shown after.
 *   - KNOWLEDGE IS THE MOST REWARDING. Correct answers grant the bonuses;
 *     wrong answers just miss out (light replay, or look it up — you learn
 *     either way). `reward` tags the headline questions that grant a real
 *     in-match bonus (per §4.0): power-chemistry → speed / weapon damage;
 *     safety → a small durability/HP edge.
 *   - FACTOIDS are the "click a tool in the workshop → learn something"
 *     discovery layer (patience-gated). They prime the quiz answers.
 *
 * SCHEMA:
 *   TOPICS:   id → { label, reward }   reward = default gameplay nudge
 *   QUESTIONS: { id, topic, level, prompt, options[], answer, explain, src,
 *                reward? }
 *     level: 'core' | 'algebra' | 'headline'
 *     reward (optional, overrides topic): 'speed' | 'weapon' | 'hp' | 'money'
 *   FACTOIDS: { tool, tip, src }
 *
 * Loadable in Node (tests) and embeddable in the single-file HTML build.
 * ==========================================================================*/
(function (root) {
  'use strict';

  var TOPICS = {
    power:       { label: 'Batteries & Power',        reward: 'speed'  },
    electricity: { label: 'Electricity Basics',       reward: 'speed'  },
    design:      { label: 'Engineering Design',       reward: null     },
    materials:   { label: 'Materials',                reward: null     },
    tools:       { label: 'Tools & Shop Safety',      reward: 'hp'     },
    fasteners:   { label: 'Fasteners',                reward: null     },
    fab:         { label: '3D Printing & CAD',        reward: null     }
  };

  var QUESTIONS = [
    /* ---- POWER / BATTERIES  (headline topic → speed / weapon damage) ---- */
    { id:'pw01', topic:'power', level:'core',
      prompt:'A battery cell’s VOLTAGE is like what, in the water analogy?',
      options:['Water pressure (the push)','The size of the tank','The length of the hose','The temperature of the water'],
      answer:0,
      explain:'Voltage is the push — how hard the cell shoves electricity through the circuit, just like water pressure in a hose.',
      src:'vex_series_parallel' },

    { id:'pw02', topic:'power', level:'core',
      prompt:'A cell’s CAPACITY is measured in mAh. What does it tell you?',
      options:['How much energy it holds (how long it runs)','How hard it pushes','How heavy it is','How fast it charges'],
      answer:0,
      explain:'Capacity is the size of the tank. More mAh means the battery runs longer before it’s empty.',
      src:'vex_series_parallel' },

    { id:'pw03', topic:'power', level:'core',
      prompt:'The famous "18650" cell gets its name from…',
      options:['Its size: 18 mm wide, 65 mm long','The year it was invented','Its voltage','The company that made it'],
      answer:0,
      explain:'18650 = 18 mm diameter × 65 mm long, with a "0" for round. A 21700 is 21 mm × 70 mm — same naming trick.',
      src:'vex_series_parallel / robotics_study_sheet' },

    { id:'pw04', topic:'power', level:'core',
      prompt:'When you wire cells in SERIES (end to end), what adds up?',
      options:['The voltage','The capacity (mAh)','The weight only','Nothing changes'],
      answer:0,
      explain:'Series stacks the push: each cell adds its voltage. The capacity (mAh) stays the same.',
      src:'vex_series_parallel' },

    { id:'pw05', topic:'power', level:'core',
      prompt:'When you wire cells in PARALLEL (side by side), what adds up?',
      options:['The capacity (mAh) — it runs longer','The voltage','The voltage AND the capacity','Neither'],
      answer:0,
      explain:'Parallel is like extra tanks side by side: same pressure (voltage), but way more water (capacity).',
      src:'vex_series_parallel' },

    { id:'pw06', topic:'power', level:'algebra',
      prompt:'A power-tool pack has 5 cells in series, each 3.6 V. Total voltage?',
      options:['18 V','3.6 V','25 V','9 V'],
      answer:0,
      explain:'Series adds: 5 × 3.6 V = 18 V. That’s exactly how an "18 V" tool battery is built (a 5S pack).',
      src:'vex_series_parallel' },

    { id:'pw07', topic:'power', level:'algebra',
      prompt:'The VEX V5 battery is "4S" of 3.2 V LiFePO4 cells. Its nominal voltage?',
      options:['12.8 V','3.2 V','7.2 V','16 V'],
      answer:0,
      explain:'4 × 3.2 V = 12.8 V. VEX uses LiFePO4 cells (3.2 V each), not normal Li-ion (3.6 V).',
      src:'vex_series_parallel' },

    { id:'pw08', topic:'power', level:'algebra',
      prompt:'Three 1,100 mAh cells are wired in PARALLEL. Total capacity?',
      options:['3,300 mAh','1,100 mAh','366 mAh','11,000 mAh'],
      answer:0,
      explain:'Parallel adds capacity: 3 × 1,100 = 3,300 mAh. The voltage stays 3.6 V.',
      src:'vex_series_parallel' },

    { id:'pw09', topic:'power', level:'core',
      prompt:'A pack labelled "5S2P" means…',
      options:['5 cells in series, then 2 of those strings in parallel (10 cells)','5 parallel, 2 series','5.2 volts','5 amps, 2 packs'],
      answer:0,
      explain:'NSnP notation: 5S = 5 in series (the voltage), 2P = 2 strings in parallel (the capacity). 5 × 2 = 10 cells total.',
      src:'vex_series_parallel' },

    { id:'pw10', topic:'power', level:'headline', reward:'weapon',
      prompt:'Which battery chemistry is the SAFEST — very hard to catch fire — and is what the VEX V5 uses?',
      options:['LiFePO4 (lithium iron phosphate)','LCO (lithium cobalt, in phones)','NMC (in most EVs)','Lead-acid'],
      answer:0,
      explain:'LiFePO4 (LFP) is the safest lithium chemistry — nearly impossible to ignite — so it’s ideal around a gym full of students. Knowing your chemistry powers a higher-performance build.',
      src:'robotics_study_sheet / vex_series_parallel' },

    { id:'pw11', topic:'power', level:'core', reward:'hp',
      prompt:'Why do FIRST (FRC) robots use a sealed lead-acid (AGM) battery instead of lithium?',
      options:['It’s student-safe — no fire risk — and handles huge surge current','It’s lighter','It holds far more energy','It charges faster'],
      answer:0,
      explain:'AGM is heavy and low-energy, but it’s very forgiving: no fire/spill risk, survives charging mistakes, and shrugs off 100+ amp motor stalls. Safety first.',
      src:'robotics_study_sheet' },

    { id:'pw12', topic:'power', level:'core',
      prompt:'A "18 V" tool battery and a "20 V Max" tool battery are…',
      options:['The same pack, just labelled at different points (nominal vs peak)','Totally different sizes','20 V is always stronger','18 V has more cells'],
      answer:0,
      explain:'Marketing, not engineering: 5 cells read 5×3.6 = 18 V nominal, or 5×4.2 ≈ 20 V freshly charged. Same battery.',
      src:'robotics_study_sheet' },

    { id:'pw13', topic:'power', level:'core',
      prompt:'What does a Battery Management System (BMS) do in a lithium pack?',
      options:['Watches each cell, balances them when charging, and cuts off if unsafe','Makes the battery bigger','Adds voltage','Cools the motor'],
      answer:0,
      explain:'A pack is only as good as its weakest cell. The BMS keeps every cell even and shuts down before an over-charge or over-discharge becomes a fire.',
      src:'robotics_study_sheet' },

    /* ---- ELECTRICITY BASICS ---- */
    { id:'el01', topic:'electricity', level:'core',
      prompt:'In a metal wire, what actually carries the electric charge?',
      options:['Electrons','Protons','Neutrons','Atoms'],
      answer:0,
      explain:'Metals have lots of free electrons, and those moving electrons are the current.',
      src:'FRC_Electricity_Study_Sheet' },

    { id:'el02', topic:'electricity', level:'core',
      prompt:'Which of these is the best INSULATOR (blocks current)?',
      options:['Rubber','Copper','Silver','Aluminum'],
      answer:0,
      explain:'Rubber, plastic, and glass have no free charge carriers, so they block current. Copper, silver and aluminum are conductors.',
      src:'FRC_Electricity_Study_Sheet' },

    { id:'el03', topic:'electricity', level:'algebra',
      prompt:'Ohm’s Law is V = I × R. A current of 3 A flows through 4 Ω. What is the voltage?',
      options:['12 V','7 V','1.3 V','0.75 V'],
      answer:0,
      explain:'V = I × R = 3 × 4 = 12 V. Ohm’s Law links voltage, current, and resistance.',
      src:'FRC_Electricity_Study_Sheet' },

    { id:'el04', topic:'electricity', level:'algebra',
      prompt:'Using V = I × R, if 12 V is across 4 Ω, what is the current I?',
      options:['3 A','48 A','16 A','0.33 A'],
      answer:0,
      explain:'Rearrange to I = V ÷ R = 12 ÷ 4 = 3 A. Higher resistance means less current for the same voltage.',
      src:'FRC_Electricity_Study_Sheet' },

    { id:'el05', topic:'electricity', level:'algebra', reward:'weapon',
      prompt:'Power = Voltage × Current. A motor at 12 V pulls 50 A. How much power?',
      options:['600 W','62 W','0.24 W','24 W'],
      answer:0,
      explain:'P = V × I = 12 × 50 = 600 W. More power means a stronger, faster bot — that’s real watts on the field.',
      src:'FRC_Electricity_Study_Sheet' },

    { id:'el06', topic:'electricity', level:'core',
      prompt:'Wall power in the US is AC. What does AC do that DC does not?',
      options:['It reverses direction (about 60 times a second)','It is always a higher voltage','It flows only one way','It never heats wires'],
      answer:0,
      explain:'AC (alternating current) flips back and forth ~60×/sec; DC (a battery) flows one steady direction.',
      src:'FRC_Electricity_Study_Sheet / robotics_study_sheet' },

    { id:'el07', topic:'electricity', level:'core',
      prompt:'In the water analogy, CURRENT is like…',
      options:['The flow rate (how much water moves past)','The pressure','The pipe material','The tank size'],
      answer:0,
      explain:'Voltage = pressure, current = flow rate, resistance = a narrow pipe. A great way to picture a circuit.',
      src:'FRC_Electricity_Study_Sheet' },

    { id:'el08', topic:'electricity', level:'core',
      prompt:'What does a fuse or circuit breaker protect against?',
      options:['Too much current overheating the wire (fire risk)','Low voltage','A dead battery','Slow motors'],
      answer:0,
      explain:'Too much current through a too-small wire makes heat. A fuse/breaker trips first. (FRC: 120 A main, 20 A branches.)',
      src:'FRC_Electricity_Study_Sheet' },

    /* ---- ENGINEERING DESIGN PROCESS ---- */
    { id:'dz01', topic:'design', level:'core',
      prompt:'What is the FIRST step of the engineering design process?',
      options:['Define the problem','Build the final robot','Order parts','Paint it'],
      answer:0,
      explain:'You can’t solve what you haven’t defined. Step 1 is a clear problem statement; skipping it is the #1 cause of building the wrong thing.',
      src:'engineering_design_process' },

    { id:'dz02', topic:'design', level:'core',
      prompt:'A test fails, so the team goes back to brainstorm. What does that mean?',
      options:['The process is working — the test gave data to improve','The team failed and wasted time','Engineering isn’t for them','They should give up'],
      answer:0,
      explain:'Loops are features, not bugs. NASA, SpaceX, and Boeing all iterate — the only difference is how fast.',
      src:'engineering_design_process' },

    { id:'dz03', topic:'design', level:'core',
      prompt:'A prototype is best thought of as…',
      options:['A question: "does this concept work?"','The finished product','A waste of material','A decoration'],
      answer:0,
      explain:'Your prototype asks a question. Start simple — cardboard and wood — and prove the concept before adding complexity.',
      src:'engineering_design_process' },

    { id:'dz04', topic:'design', level:'core',
      prompt:'Which kind of requirement makes your design FAIL if you miss it?',
      options:['A "Must Have" (like fitting in the size box)','A "Nice to Have"','A stretch goal','A paint color'],
      answer:0,
      explain:'"Must Haves" are hard limits (size, weight, rules). "Nice to Haves" just make a good design better.',
      src:'engineering_design_process' },

    { id:'dz05', topic:'design', level:'core',
      prompt:'Catching a flaw at the BRAINSTORM stage vs. at the TEST stage is…',
      options:['Cheaper — it’s only ideas, not parts and time','More expensive','Exactly the same cost','Impossible'],
      answer:0,
      explain:'Brainstorm loops cost a day of sketching; test loops cost parts and time. Catching failures early saves both.',
      src:'engineering_design_process' },

    { id:'dz06', topic:'design', level:'core',
      prompt:'Why is the last step — "Communicate Results" — so important?',
      options:['It feeds the next iteration; shared knowledge isn’t wasted','It earns extra points','It’s just paperwork','It ends the project for good'],
      answer:0,
      explain:'Document what you built AND what you learned. Engineering knowledge that dies in one shop is wasted engineering.',
      src:'engineering_design_process' },

    /* ---- MATERIALS ---- */
    { id:'mt01', topic:'materials', level:'core',
      prompt:'Which plastic is the BEST low-friction sliding surface for robot parts?',
      options:['HDPE','PLA','Acrylic','MDF'],
      answer:0,
      explain:'HDPE is the #1 stock sliding plastic — game pieces glide instead of dragging. PLA and acrylic grab and hang up.',
      src:'frc_material_reference' },

    { id:'mt02', topic:'materials', level:'core',
      prompt:'PLA (the common 3D-print plastic) gets soft at a surprisingly LOW temperature — about…',
      options:['60°C','300°C','1,400°C','150°C'],
      answer:0,
      explain:'PLA softens near 60°C, so it can sag right next to a hot motor. Pick a tougher material near heat.',
      src:'frc_material_reference' },

    { id:'mt03', topic:'materials', level:'core',
      prompt:'Which is LIGHTER for the same size piece?',
      options:['Aluminum (~2.7 g/cm³)','Steel (~7.8 g/cm³)','They weigh the same','Iron'],
      answer:0,
      explain:'Aluminum is about a third the density of steel — a big reason robots are built from it.',
      src:'frc_material_reference' },

    { id:'mt04', topic:'materials', level:'core',
      prompt:'A material that is "ductile" will…',
      options:['Bend a lot before it breaks','Shatter with no warning','Melt instantly','Float'],
      answer:0,
      explain:'Ductile = bends/deforms first (mild steel, polycarbonate, HDPE). Brittle = snaps suddenly (acrylic, PLA, MDF).',
      src:'frc_material_reference' },

    { id:'mt05', topic:'materials', level:'core',
      prompt:'Why is acrylic a risky choice for a part that takes impacts?',
      options:['It’s brittle — it shatters suddenly','It’s too heavy','It melts at room temperature','It rusts'],
      answer:0,
      explain:'Acrylic, CFRP sheet, MDF and PLA all snap with no warning. For impacts you want a ductile material like polycarbonate.',
      src:'frc_material_reference' },

    /* ---- TOOLS & SHOP SAFETY  (→ small HP / durability edge) ---- */
    { id:'tl01', topic:'tools', level:'core',
      prompt:'You must drive 40 long deck screws and your wrist is sore from the twist. Best tool?',
      options:['Impact driver','Cordless drill','Hand screwdriver','Hacksaw'],
      answer:0,
      explain:'An impact driver delivers high-torque rotational "hammer" blows with almost no kickback on your wrist — built for big fasteners.',
      src:'FRC_Tool_Quiz_Addendum' },

    { id:'tl02', topic:'tools', level:'core',
      prompt:'The numbered "clutch" ring on a cordless drill sets the…',
      options:['Torque (where it slips, so you don’t overdrive screws)','Top RPM','Battery level','Drill bit size'],
      answer:0,
      explain:'The clutch caps torque to stop stripping screws. Speed is set by the trigger and the high/low gear.',
      src:'Tool_Quiz' },

    { id:'tl03', topic:'tools', level:'core',
      prompt:'You need a hole that is perfectly perpendicular (90°) through an aluminum plate. Best tool?',
      options:['Drill press','Handheld cordless drill','Jigsaw','Angle grinder'],
      answer:0,
      explain:'A drill press guides the bit straight down on its column — a handheld drill can’t guarantee 90° by eye.',
      src:'FRC_Tool_Quiz_Addendum' },

    { id:'tl04', topic:'tools', level:'headline', reward:'hp',
      prompt:'When is it NEVER okay to wear gloves?',
      options:['On spinning machines (drill press, lathe, grinder)','While carrying sheet metal','While soldering nearby','While painting'],
      answer:0,
      explain:'A glove can catch the spinning chuck and drag your whole hand in before you can react. Clamp the work instead — this rule keeps you whole.',
      src:'Tool_Quiz' },

    { id:'tl05', topic:'tools', level:'core',
      prompt:'"Kickback" on a table saw is when…',
      options:['The wood pinches the blade and is thrown back at you','The blade gets dull','The motor overheats','The saw runs out of power'],
      answer:0,
      explain:'A riving knife (keeps the cut open) and anti-kickback pawls (one-way fingers) are the two devices that stop it.',
      src:'Tool_Quiz' },

    { id:'tl06', topic:'tools', level:'core',
      prompt:'Which pliers grip and turn a rounded-off or stripped bolt?',
      options:['Locking pliers (Vise-Grip)','Needle-nose pliers','Wire strippers','Flush cutters'],
      answer:0,
      explain:'Locking pliers clamp tight and stay clamped — a last resort for damaged fasteners. (Never use plain pliers on a good bolt head.)',
      src:'Tool_Quiz' },

    { id:'tl07', topic:'tools', level:'core',
      prompt:'A file removes metal on which stroke?',
      options:['The forward (push) stroke only','Both push and pull','The pull stroke only','Neither — it grinds'],
      answer:0,
      explain:'Files cut only on the push. Dragging the teeth backward under pressure just dulls them — lift on the return.',
      src:'Tool_Quiz' },

    { id:'tl08', topic:'tools', level:'core', reward:'hp',
      prompt:'Why must you never leave a laser cutter running unattended?',
      options:['Materials can catch fire fast','It wastes electricity','It gets bored','The laser runs out'],
      answer:0,
      explain:'A laser cut can ignite the material in seconds, faster than any auto-suppressor. Also keep the fume fan ON — the smoke is toxic.',
      src:'Tool_Quiz' },

    { id:'tl09', topic:'tools', level:'core',
      prompt:'You must tell a 6 mm standoff from an 8 mm one — the difference matters. Best tool?',
      options:['Calipers (measure to ±0.001")','Tape measure','Your eye','A ruler'],
      answer:0,
      explain:'Calipers read tiny differences a tape measure can’t — down to a thousandth of an inch.',
      src:'FRC_Tool_Quiz_Addendum' },

    { id:'tl10', topic:'tools', level:'core',
      prompt:'A #2 Phillips bit keeps slipping and chewing up the screw. Most likely cause?',
      options:['Wrong bit (Pozidriv vs Phillips) or wrong size','The screw is upside down','The drill is too new','Low battery'],
      answer:0,
      explain:'Pozidriv looks like Phillips but has extra ribs — mixing them, or using the wrong size, causes "cam-out" (slipping).',
      src:'Tool_Quiz' },

    { id:'tl11', topic:'tools', level:'core',
      prompt:'You need to cut a curved notch in plywood for a motor mount. Best tool?',
      options:['Jigsaw','Miter saw','Table saw','Circular saw'],
      answer:0,
      explain:'A jigsaw’s narrow blade follows curves; the straight-cut saws can only go in a straight line.',
      src:'FRC_Tool_Quiz_Addendum' },

    /* ---- FASTENERS ---- */
    { id:'fs01', topic:'fasteners', level:'core',
      prompt:'What is the difference between a BOLT and a SCREW?',
      options:['A bolt uses a nut; a screw threads into the material itself','They’re the same thing','A bolt is always bigger','A screw never has threads'],
      answer:0,
      explain:'A bolt clamps parts between its head and a nut. A screw cuts/engages threads right in the part (wood, plastic, a tapped hole).',
      src:'fasteners_study_sheet' },

    { id:'fs02', topic:'fasteners', level:'core',
      prompt:'In "M5 × 0.8", what is the 0.8?',
      options:['The thread pitch — 0.8 mm between threads','The length','The strength grade','The number of threads'],
      answer:0,
      explain:'M5 = 5 mm diameter; ×0.8 = the pitch (distance between threads) in mm. M5×0.8 and M6×1.0 are the most common FRC bolts.',
      src:'fasteners_study_sheet' },

    { id:'fs03', topic:'fasteners', level:'core',
      prompt:'The SAE callout "¼-20" means…',
      options:['¼ inch diameter, 20 threads per inch','20 bolts of ¼ inch','¼ inch long, size 20','20 mm, quarter pitch'],
      answer:0,
      explain:'First number = diameter (¼"), second = threads per inch (20). ¼-20 is the most common SAE size in FRC.',
      src:'fasteners_study_sheet' },

    { id:'fs04', topic:'fasteners', level:'core',
      prompt:'A "stud" is a fastener that…',
      options:['Is threaded on both ends with no head','Has a giant head','Can’t use a nut','Is only for wood'],
      answer:0,
      explain:'A stud threads permanently into one part; a nut goes on the other end — handy where there’s no room for a bolt head.',
      src:'fasteners_study_sheet' },

    { id:'fs05', topic:'fasteners', level:'core',
      prompt:'Why did standardized threads (Whitworth, 1841) change the world?',
      options:['A nut from one shop would finally fit a bolt from another — interchangeable parts','They were prettier','They were cheaper to paint','They glowed in the dark'],
      answer:0,
      explain:'Before standards, every bolt was custom. Standard threads → interchangeable parts → assembly lines → mass production. Your robot is downstream of that.',
      src:'fasteners_study_sheet' },

    { id:'fs06', topic:'fasteners', level:'core',
      prompt:'Coarse threads vs. fine threads: coarse threads are…',
      options:['Stronger, faster to assemble, and more tolerant of damage','Always weaker','Only for tiny screws','The same as fine'],
      answer:0,
      explain:'Coarse (UNC / metric coarse) is the rugged default. Fine threads resist vibration better but strip more easily.',
      src:'fasteners_study_sheet' },

    /* ---- 3D PRINTING & CAD ---- */
    { id:'fb01', topic:'fab', level:'core',
      prompt:'What does an FDM/FFF 3D printer do?',
      options:['Melts plastic filament and builds the object layer by layer','Carves a block down to shape','Pours liquid metal into a mold','Glues paper together'],
      answer:0,
      explain:'FDM (Fused Deposition Modeling) = FFF (Fused Filament Fabrication): the same "melt filament, stack layers" process. It’s additive — you add material.',
      src:'FDM_FFF_Complete_Review_Sheet' },

    { id:'fb02', topic:'fab', level:'core',
      prompt:'What is the standard 3D-printer nozzle size on most machines?',
      options:['0.4 mm','4 mm','0.04 mm','1.8 mm'],
      answer:0,
      explain:'0.4 mm is the universal default. Smaller = finer detail but slower; bigger = faster but coarser.',
      src:'FDM_FFF_Complete_Review_Sheet' },

    { id:'fb03', topic:'fab', level:'core',
      prompt:'Which plastic is the easiest for a beginner to 3D print?',
      options:['PLA','ABS','Nylon','TPU'],
      answer:0,
      explain:'PLA prints cool (~190–220°C), barely warps, and needs no enclosure. ABS and nylon are fussier.',
      src:'FDM_FFF_Complete_Review_Sheet' },

    { id:'fb04', topic:'fab', level:'core',
      prompt:'"Infill" in a 3D print is…',
      options:['The internal fill pattern — more infill = stronger and heavier','The outer shell','The support material','The glue on the bed'],
      answer:0,
      explain:'Infill is the honeycomb inside. Low infill = light and weak; high infill = strong and heavy. More walls help too.',
      src:'FDM_FFF_Complete_Review_Sheet' },

    { id:'fb05', topic:'fab', level:'core',
      prompt:'A 3D-printed part is WEAKEST in which direction?',
      options:['Along Z — pulling the layers apart','Side to side','It’s equally strong everywhere','Diagonally only'],
      answer:0,
      explain:'Layers are only thermally fused, so prints split between layers (Z). Orient the part so loads run across the flat layers, not pull them apart.',
      src:'FDM_FFF_Complete_Review_Sheet' },

    { id:'fb06', topic:'fab', level:'core',
      prompt:'Resin (SLA) printing hardens liquid plastic using…',
      options:['UV light','Heat from a nozzle','A spinning blade','Glue'],
      answer:0,
      explain:'SLA cures (hardens) liquid resin layer by layer with UV light. It gives finer detail than FDM. Always wear nitrile gloves — uncured resin irritates skin.',
      src:'Engineering_3D_Printing_Reference' },

    { id:'fb07', topic:'fab', level:'core',
      prompt:'What does "CAD" stand for?',
      options:['Computer-Aided Design','Cardboard Assembly Drawing','Cutting And Drilling','Curved Angle Design'],
      answer:0,
      explain:'CAD = Computer-Aided Design: software that builds exact, mathematically defined models you can send to a printer or CNC machine.',
      src:'introtocad' },

    { id:'fb08', topic:'fab', level:'core',
      prompt:'In CAD, the operation that pushes a flat 2D sketch out into a solid is…',
      options:['Extrude','Fillet','Mirror','Sketch'],
      answer:0,
      explain:'Extrude is the workhorse: a rectangle becomes a box, a circle becomes a cylinder. (Revolve spins a profile to make round parts.)',
      src:'introtocad' },

    { id:'fb09', topic:'fab', level:'core',
      prompt:'"Parametric" CAD modeling means…',
      options:['Change one number and the whole model updates','You can never change it','It only works in 2D','It draws by hand'],
      answer:0,
      explain:'You set rules and named values (parameters). Change the frame length once and everything that depends on it updates automatically.',
      src:'introtocad' },

    { id:'fb10', topic:'fab', level:'core',
      prompt:'Which file format do you usually export to 3D-print a part?',
      options:['STL','MP3','DOCX','JPG'],
      answer:0,
      explain:'STL is the universal 3D-printing mesh. (STEP is the exact format for CNC; DXF is for 2D laser cutting.)',
      src:'introtocad' },

    { id:'fb11', topic:'fab', level:'core',
      prompt:'In CAD, what does a "fillet" do to an edge?',
      options:['Rounds it off (also makes it stronger)','Cuts a hole','Deletes it','Paints it'],
      answer:0,
      explain:'A fillet rounds an edge; a chamfer cuts a flat angled bevel. Rounded corners also relieve stress, so the part is stronger.',
      src:'introtocad' }
  ];

  /* FACTOIDS — the "click a tool in the workshop → learn a tip" discovery
     layer. Short, true, and they prime the quiz answers above. */
  var FACTOIDS = [
    { tool:'Drill press',     tip:'Never wear gloves — a glove can catch the spinning chuck and pull your hand in. Clamp the work instead.', src:'Tool_Quiz' },
    { tool:'Angle grinder',   tip:'Always keep the guard on and wear a face shield — it throws sparks and can kick back hard.', src:'Tool_Quiz' },
    { tool:'Impact driver',   tip:'No clutch! Great for big screws, but it can snap small ones if you’re not careful.', src:'FRC_Tool_Quiz_Addendum' },
    { tool:'Cordless drill',  tip:'The numbered ring sets TORQUE, not speed — lower numbers stop you from over-driving screws.', src:'Tool_Quiz' },
    { tool:'Table saw',       tip:'The riving knife and anti-kickback pawls are there to stop the wood being thrown back at you.', src:'Tool_Quiz' },
    { tool:'Laser cutter',    tip:'Never leave it running alone, and keep the fume fan ON — burning plastic smoke is toxic.', src:'Tool_Quiz' },
    { tool:'Soldering iron',  tip:'Use the lowest temperature that makes a clean joint (about 315–370°C). Hotter is not better.', src:'Tool_Quiz' },
    { tool:'Calipers',        tip:'Measure to a thousandth of an inch — they can tell a 6 mm part from an 8 mm one.', src:'FRC_Tool_Quiz_Addendum' },
    { tool:'File',            tip:'Cuts only on the push stroke. Lift it on the way back so you don’t dull the teeth.', src:'Tool_Quiz' },
    { tool:'Deburring tool',  tip:'Its little rotating blade shaves off the sharp burr a drill leaves around a hole.', src:'FRC_Tool_Quiz_Addendum' },
    { tool:'Heat gun',        tip:'Blows 200–600°C air to shrink heat-shrink tubing — no open flame near the electronics.', src:'Tool_Quiz' },
    { tool:'Hacksaw',         tip:'A fine 18–24 TPI blade cuts metal and pipe; install it with the teeth pointing forward.', src:'Tool_Quiz' },
    { tool:'3D printer',      tip:'Parts are weakest between layers (Z). Orient yours so the load doesn’t pull the layers apart.', src:'FDM_FFF_Complete_Review_Sheet' },
    { tool:'Bench vise',      tip:'Clamp small parts in the vise — never hold a tiny piece by hand near a moving blade.', src:'Tool_Quiz' },
    { tool:'VEX V5 battery',  tip:'It’s a 4S1P LiFePO4 pack: 4 × 3.2 V = 12.8 V. LiFePO4 is the safest lithium chemistry.', src:'vex_series_parallel' }
  ];

  var BANK = { TOPICS: TOPICS, QUESTIONS: QUESTIONS, FACTOIDS: FACTOIDS,
               version: '0.1.0', audience: 'late-elementary → HS freshman' };

  if (typeof module !== 'undefined' && module.exports) module.exports = BANK;
  root.CAREER_QUIZ = BANK;
})(typeof globalThis !== 'undefined' ? globalThis : this);
