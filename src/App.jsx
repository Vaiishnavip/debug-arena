import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — Coordinator fills this once before the event
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG_KEY = "debugarena-gsheet-config";

// ─── C DEBUGGING CHALLENGES ──────────────────────────────────────────────────
const CHALLENGES = [
  {
    id: 1, title: "Array Out of Bounds",
    description: "This program should print numbers 1 to 5 using an array, but it crashes. Find and fix the bug.",
    buggyCode: `#include <stdio.h>\nint main() {\n    int arr[5] = {1, 2, 3, 4, 5};\n    for (int i = 0; i <= 5; i++) {\n        printf("%d\\n", arr[i]);\n    }\n    return 0;\n}`,
    hint: "Check the loop boundary condition carefully.",
    expectedOutput: "1\n2\n3\n4\n5", points: 10, bugLine: 4,
    explanation: "Loop uses i <= 5 causing out-of-bounds access. Should be i < 5."
  },
  {
    id: 2, title: "Missing Return Statement",
    description: "This function should return the sum of two integers but gives wrong results. Find and fix the bug.",
    buggyCode: `#include <stdio.h>\nint add(int a, int b) {\n    int sum = a + b;\n}\nint main() {\n    int result = add(3, 7);\n    printf("Sum = %d\\n", result);\n    return 0;\n}`,
    hint: "What should the add() function return?",
    expectedOutput: "Sum = 10", points: 10, bugLine: 3,
    explanation: "The add() function computes sum but never returns it. Add 'return sum;'."
  },
  {
    id: 3, title: "Pointer Dereference Error",
    description: "This program should swap two numbers using pointers but doesn't work. Fix the bug.",
    buggyCode: `#include <stdio.h>\nvoid swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\nint main() {\n    int x = 10, y = 20;\n    swap(x, y);\n    printf("x=%d y=%d\\n", x, y);\n    return 0;\n}`,
    hint: "Are you passing the right things to the swap function?",
    expectedOutput: "x=20 y=10", points: 15, bugLine: 9,
    explanation: "swap(x, y) passes values, not addresses. Should be swap(&x, &y)."
  },
  {
    id: 4, title: "Infinite Loop",
    description: "This program should print numbers 1 to 10, but it runs forever. Fix the bug.",
    buggyCode: `#include <stdio.h>\nint main() {\n    int i = 1;\n    while (i <= 10) {\n        printf("%d\\n", i);\n        i--;\n    }\n    return 0;\n}`,
    hint: "Trace through the loop manually. What happens to i?",
    expectedOutput: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10", points: 10, bugLine: 6,
    explanation: "i-- decrements i, causing it to never reach 10. Should be i++."
  },
  {
    id: 5, title: "Buffer Too Small",
    description: "This program should copy a string but causes a segmentation fault. Fix the bug.",
    buggyCode: `#include <stdio.h>\n#include <string.h>\nint main() {\n    char *src = "Hello World";\n    char dest[5];\n    strcpy(dest, src);\n    printf("%s\\n", dest);\n    return 0;\n}`,
    hint: "Is the destination buffer large enough?",
    expectedOutput: "Hello World", points: 15, bugLine: 5,
    explanation: "dest[5] is too small for 'Hello World' (12 chars). Should be dest[12] or larger."
  },
  {
    id: 6, title: "Wrong Format Specifier",
    description: "This program should print a float but prints garbage. Fix the bug.",
    buggyCode: `#include <stdio.h>\nint main() {\n    float pi = 3.14159;\n    printf("Pi = %d\\n", pi);\n    return 0;\n}`,
    hint: "What format specifier should be used for float?",
    expectedOutput: "Pi = 3.141590", points: 10, bugLine: 4,
    explanation: "%d is for integers. Use %f for float variables."
  },
  {
    id: 7, title: "Uninitialized Variable",
    description: "This program should calculate factorial of 5 but gives wrong output. Fix the bug.",
    buggyCode: `#include <stdio.h>\nint main() {\n    int n = 5, fact, i;\n    for (i = 1; i <= n; i++) {\n        fact = fact * i;\n    }\n    printf("Factorial = %d\\n", fact);\n    return 0;\n}`,
    hint: "What should fact start as before the loop?",
    expectedOutput: "Factorial = 120", points: 10, bugLine: 3,
    explanation: "fact is uninitialized. Initialize it to 1: int n=5, fact=1, i;"
  },
  {
    id: 8, title: "Wrong Logical Operator",
    description: "This program checks if a number is between 1 and 100 but gives wrong results. Fix the bug.",
    buggyCode: `#include <stdio.h>\nint main() {\n    int n = 50;\n    if (n > 1 || n < 100) {\n        printf("In range\\n");\n    } else {\n        printf("Out of range\\n");\n    }\n    return 0;\n}`,
    hint: "Think about which logical operator connects the two conditions.",
    expectedOutput: "In range", points: 15, bugLine: 4,
    explanation: "|| (OR) makes any number satisfy the condition. Should be && (AND)."
  },
  {
    id: 9, title: "Missing Address Operator",
    description: "This program reads an integer but crashes. Fix the bug. (Assume input is 42)",
    buggyCode: `#include <stdio.h>\nint main() {\n    int num;\n    scanf("%d", num);\n    printf("You entered: %d\\n", num);\n    return 0;\n}`,
    hint: "scanf needs to know WHERE to store the value.",
    expectedOutput: "You entered: 42", points: 10, bugLine: 4,
    explanation: "scanf requires the address of num. Should be scanf(\"%d\", &num)."
  },
  {
    id: 10, title: "Division by Zero",
    description: "This function divides two numbers but can crash. Add proper error handling.",
    buggyCode: `#include <stdio.h>\nfloat divide(int a, int b) {\n    return a / b;\n}\nint main() {\n    printf("%.2f\\n", divide(10, 0));\n    return 0;\n}`,
    hint: "What happens when b is zero? Add a check before dividing.",
    expectedOutput: "Error: Division by zero", points: 20, bugLine: 3,
    explanation: "No check for b==0. Add: if(b==0){ printf(\"Error: Division by zero\"); return 0; }"
  }
];

const COORDINATOR_PASS = "coordinator2024";

// ─── UTILITIES ───────────────────────────────────────────────────────────────
function fmtTime(ms) {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}
function fmtClock(s) {
  return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
}
function scoreColor(score) {
  return score >= 80 ? "#39ff14" : score >= 40 ? "#ffcc00" : "#ff6b35";
}

// ─── GOOGLE SHEETS API ───────────────────────────────────────────────────────
// Uses a Google Apps Script Web App as a middleware
// The coordinator sets up once and pastes the Web App URL

async function sheetsCall(webAppUrl, action, payload = {}) {
  try {
    const url = `${webAppUrl}?action=${action}&payload=${encodeURIComponent(JSON.stringify(payload))}`;
    const res = await fetch(url);
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Sheets error:", e);
    return { error: e.message };
  }
}

async function sheetsPost(webAppUrl, action, payload = {}) {
  try {
    const res = await fetch(webAppUrl, {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
    });
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    return { error: e.message };
  }
}

// ─── AI VALIDATION ───────────────────────────────────────────────────────────
async function validateWithAI(challenge, submittedCode) {
  const normalize = s => s.replace(/\s+/g, " ").trim();
  const userCode = normalize(submittedCode);

  // Check if the known fix is present
  const fixes = {
    1: "i < 5",
    2: "return sum;",
    3: "swap(&x, &y)",
    4: "i++",
    5: "dest[12]",
    6: "%f",
    7: "fact = 1",
    8: "&&",
    9: "scanf(\"%d\", &num)",
    10: "if(b==0)"
  };

  const expectedFix = fixes[challenge.id];
  const isCorrect = expectedFix
    ? normalize(submittedCode).includes(normalize(expectedFix))
    : false;

  return {
    correct: isCorrect,
    feedback: isCorrect
      ? "Great fix! That's the correct solution."
      : `Not quite. Hint: ${challenge.hint}`,
    simulatedOutput: isCorrect ? challenge.expectedOutput : "Incorrect output"
  };
}
// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [participant, setParticipant] = useState(null);
  const [webAppUrl, setWebAppUrl] = useState(() => localStorage.getItem(CONFIG_KEY) || "");
  const [configSet, setConfigSet] = useState(() => !!localStorage.getItem(CONFIG_KEY));

  function saveConfig(url) {
    localStorage.setItem(CONFIG_KEY, url);
    setWebAppUrl(url); setConfigSet(true);
  }

  return (
    <div style={S.app}>
      <style>{CSS}</style>
      {!configSet && screen !== "setup" && (
        <div style={S.setupBanner}>
          ⚠️ Google Sheets not configured.&nbsp;
          <button style={S.inlineBtnLink} onClick={() => setScreen("setup")}>Configure Now →</button>
        </div>
      )}
      {screen === "setup"       && <SetupScreen onSave={saveConfig} current={webAppUrl} onBack={() => setScreen("landing")} />}
      {screen === "landing"     && <LandingScreen webAppUrl={webAppUrl} onParticipant={p => { setParticipant(p); setScreen("challenge"); }} onCoordinator={() => setScreen("coordinator")} onLeaderboard={() => setScreen("leaderboard")} onSetup={() => setScreen("setup")} />}
      {screen === "challenge"   && <ChallengeScreen participant={participant} webAppUrl={webAppUrl} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "leaderboard" && <LeaderboardScreen webAppUrl={webAppUrl} onBack={() => setScreen(participant ? "challenge" : "landing")} />}
      {screen === "coordinator" && <CoordinatorScreen webAppUrl={webAppUrl} onBack={() => setScreen("landing")} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETUP SCREEN — coordinator configures once
// ══════════════════════════════════════════════════════════════════════════════
const APPS_SCRIPT_CODE = `// Paste this entire script into Google Apps Script
// (Extensions > Apps Script in your Google Sheet)

function doGet(e) {
  return handleRequest(e.parameter.action, JSON.parse(decodeURIComponent(e.parameter.payload || "{}")));
}
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  return handleRequest(body.action, body);
}
function handleRequest(action, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let result = {};
  if (action === "register") {
    const sh = ss.getSheetByName("Participants") || ss.insertSheet("Participants");
    if (sh.getLastRow() === 0) sh.appendRow(["Name","USN","Branch","JoinedAt"]);
    const rows = sh.getDataRange().getValues();
    const exists = rows.some(r => r[1] === data.usn);
    if (!exists) sh.appendRow([data.name, data.usn, data.branch, new Date().toISOString()]);
    result = { ok: true };
  } else if (action === "submit") {
    const sh = ss.getSheetByName("Submissions") || ss.insertSheet("Submissions");
    if (sh.getLastRow() === 0) sh.appendRow(["USN","Name","Branch","QuestionID","QuestionTitle","TimeTakenMs","TimeTakenFormatted","Attempts","Correct","SubmittedAt"]);
    sh.appendRow([data.usn, data.name, data.branch, data.qId, data.qTitle, data.timeTakenMs, data.timeFmt, data.attempts, data.correct ? "YES" : "NO", new Date().toISOString()]);
    result = { ok: true };
  } else if (action === "leaderboard") {
    const pSh = ss.getSheetByName("Participants");
    const sSh = ss.getSheetByName("Submissions");
    const participants = pSh ? pSh.getDataRange().getValues().slice(1) : [];
    const submissions  = sSh ? sSh.getDataRange().getValues().slice(1) : [];
    result = { participants, submissions };
  } else if (action === "ping") {
    result = { ok: true, msg: "Connected!" };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}`;

function SetupScreen({ onSave, current, onBack }) {
  const [url, setUrl] = useState(current || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function testConnection() {
    setTesting(true); setTestResult(null);
    const r = await sheetsCall(url, "ping");
    setTestResult(r.ok ? "success" : "error");
    setTesting(false);
  }
  function copy() {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={S.setupRoot}>
      <div style={S.setupBox}>
        <div style={S.logoMark}><span style={{color:"#00d4ff"}}>DEBUG</span><span style={{color:"#ff6b35"}}>ARENA</span></div>
        <div style={S.setupTitle}>Google Sheets Setup</div>
        <p style={S.setupDesc}>Do this once before the event. Takes about 5 minutes.</p>

        <div style={S.steps}>
          {[
            { n:"1", title:"Create a Google Sheet", body: <>Go to <a href="https://sheets.google.com" target="_blank" rel="noreferrer" style={{color:"#00d4ff"}}>sheets.google.com</a> and create a new spreadsheet. Name it <b>Debug Arena Results</b>.</> },
            { n:"2", title:"Open Apps Script", body: <>In your sheet, click <b>Extensions → Apps Script</b>. Delete the existing code.</> },
            { n:"3", title:"Paste the script", body: <>Copy the script below and paste it into the Apps Script editor. Click <b>Save</b>.</> },
            { n:"4", title:"Deploy as Web App", body: <>Click <b>Deploy → New Deployment</b>. Choose type: <b>Web App</b>. Set "Who has access" to <b>Anyone</b>. Click Deploy and copy the Web App URL.</> },
            { n:"5", title:"Paste URL below", body: <>Paste your Web App URL below, test it, then save.</> },
          ].map(s => (
            <div key={s.n} style={S.step}>
              <div style={S.stepN}>{s.n}</div>
              <div><div style={S.stepTitle}>{s.title}</div><div style={S.stepBody}>{s.body}</div></div>
            </div>
          ))}
        </div>

        <div style={S.scriptBox}>
          <div style={S.scriptHdr}>
            <span style={{fontSize:"0.7rem",color:"#3a5a7a",letterSpacing:1}}>APPS SCRIPT CODE</span>
            <button style={S.copyBtn} onClick={copy}>{copied ? "✓ COPIED" : "COPY"}</button>
          </div>
          <pre style={S.scriptPre}>{APPS_SCRIPT_CODE}</pre>
        </div>

        <div style={{marginTop:20}}>
          <label style={S.lbl}>WEB APP URL</label>
          <input value={url} onChange={e=>setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            style={S.input} />
        </div>
        {testResult === "success" && <div style={S.okMsg}>✅ Connected successfully!</div>}
        {testResult === "error"   && <div style={S.errMsg}>❌ Connection failed. Check the URL and deployment settings.</div>}
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button style={S.btnGhost2} onClick={testConnection} disabled={!url||testing}>{testing?"Testing…":"TEST CONNECTION"}</button>
          <button style={{...S.btnPrimary2, opacity: !url||testResult!=="success"?.5:1}} disabled={!url||testResult!=="success"} onClick={()=>onSave(url)}>SAVE & CONTINUE →</button>
        </div>
        {onBack && <button style={{...S.btnGhost2,marginTop:10,width:"100%"}} onClick={onBack}>← BACK</button>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LANDING SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LandingScreen({ webAppUrl, onParticipant, onCoordinator, onLeaderboard, onSetup }) {
  const [tab, setTab] = useState("participant");
  const [name, setName] = useState(""); const [usn, setUsn] = useState(""); const [branch, setBranch] = useState("");
  const [coordPass, setCoordPass] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!name.trim()||!usn.trim()||!branch.trim()) { setErr("All fields are required."); return; }
    if (!webAppUrl) { setErr("Platform not configured yet. Contact coordinator."); return; }
    setLoading(true); setErr("");
    const r = await sheetsPost(webAppUrl, "register", { name: name.trim(), usn: usn.trim().toUpperCase(), branch: branch.trim() });
    setLoading(false);
    if (r.error) { setErr("Could not connect to Google Sheets. Try again."); return; }
    onParticipant({ name: name.trim(), usn: usn.trim().toUpperCase(), branch: branch.trim() });
  }
  function handleCoord() {
    if (coordPass === COORDINATOR_PASS) { setErr(""); onCoordinator(); }
    else setErr("Incorrect password.");
  }

  return (
    <div style={S.landing}>
      <div style={S.landingBox}>
        <div style={S.logoMark}><span style={{color:"#00d4ff"}}>DEBUG</span><span style={{color:"#ff6b35"}}>ARENA</span></div>
        <p style={S.landingSub}>C Language Debugging Championship</p>
        <div style={S.tabRow}>
          {["participant","coordinator"].map(t=>(
            <button key={t} style={{...S.tabBtn,...(tab===t?S.tabBtnActive:{})}} onClick={()=>{setTab(t);setErr("");}}>
              {t==="participant"?"⚡ PARTICIPANT":"🎛 COORDINATOR"}
            </button>
          ))}
        </div>
        {tab==="participant" && <>
          <Field label="FULL NAME" value={name} onChange={setName} placeholder="e.g. Ravi Kumar" />
          <Field label="USN" value={usn} onChange={setUsn} placeholder="e.g. 1MS21CS001" />
          <Field label="BRANCH" value={branch} onChange={setBranch} placeholder="e.g. CSE, ECE, ME" />
          {err && <p style={S.err}>{err}</p>}
          <button style={S.btnPrimary} onClick={handleJoin} disabled={loading}>{loading?"Registering…":"ENTER ARENA →"}</button>
        </>}
        {tab==="coordinator" && <>
          <Field label="PASSWORD" value={coordPass} onChange={setCoordPass} type="password" placeholder="Coordinator password" />
          {err && <p style={S.err}>{err}</p>}
          <button style={S.btnPrimary} onClick={handleCoord}>ACCESS DASHBOARD →</button>
          <button style={S.btnGhost} onClick={onSetup}>⚙ Configure Google Sheets</button>
        </>}
        <button style={S.btnGhost} onClick={onLeaderboard}>📊 VIEW LIVE LEADERBOARD</button>
      </div>
      <div style={S.statsRow}>
        {[["10","Challenges"],["150","Max Points"],["200+","Participants"]].map(([n,l])=>(
          <div key={l} style={S.statBox}><div style={S.statN}>{n}</div><div style={S.statL}>{l}</div></div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CHALLENGE SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function ChallengeScreen({ participant, webAppUrl, onLeaderboard }) {
  const [qIdx, setQIdx] = useState(0);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [solvedTimes, setSolvedTimes] = useState({});
  const [code, setCode] = useState(CHALLENGES[0].buggyCode);
  const [output, setOutput] = useState(""); const [outputType, setOutputType] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(""); const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef(null);
  const ch = CHALLENGES[qIdx];
  const alreadySolved = solvedIds.has(ch.id);
  const totalScore = CHALLENGES.reduce((a, c) => solvedIds.has(c.id) ? a + c.points : a, 0);

  useEffect(() => {
    setCode(ch.buggyCode); setOutput(""); setOutputType("idle");
    setFeedback(""); setResult(null); setAttempts(0); setElapsed(0);
    startRef.current = Date.now();
    clearInterval(timerRef.current);
    if (!solvedIds.has(ch.id))
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-startRef.current)/1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx]);

  async function handleRun() {
    if (loading || alreadySolved) return;
    setLoading(true); setOutput("Claude AI is evaluating your fix…"); setOutputType("idle");
    setFeedback(""); setResult(null);
    const att = attempts + 1; setAttempts(att);
    const r = await validateWithAI(ch, code);
    setOutput(r.simulatedOutput || "");
    if (r.correct) {
      setOutputType("ok"); setResult("correct");
      clearInterval(timerRef.current);
      const ms = Date.now() - startRef.current;
      setSolvedIds(prev => new Set([...prev, ch.id]));
      setSolvedTimes(prev => ({ ...prev, [ch.id]: ms }));
      await sheetsPost(webAppUrl, "submit", {
        usn: participant.usn, name: participant.name, branch: participant.branch,
        qId: ch.id, qTitle: ch.title,
        timeTakenMs: ms, timeFmt: fmtTime(ms),
        attempts: att, correct: true
      });
    } else {
      setOutputType("error"); setResult("wrong");
      setFeedback(r.feedback || "Not correct. Try again.");
      await sheetsPost(webAppUrl, "submit", {
        usn: participant.usn, name: participant.name, branch: participant.branch,
        qId: ch.id, qTitle: ch.title,
        timeTakenMs: Date.now()-startRef.current, timeFmt: fmtTime(Date.now()-startRef.current),
        attempts: att, correct: false
      });
    }
    setLoading(false);
  }

  return (
    <div style={S.challRoot}>
      <div style={S.challHeader}>
        <div style={S.logoMark}><span style={{color:"#00d4ff"}}>DEBUG</span><span style={{color:"#ff6b35"}}>ARENA</span></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={S.chip}>{participant.name}</span>
          <span style={S.chip}>{participant.usn}</span>
          <span style={S.chip}>{participant.branch}</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={S.scorePill}>🏆 {totalScore} pts</div>
          <button style={S.btnSm} onClick={onLeaderboard}>LEADERBOARD</button>
        </div>
      </div>

      <div style={S.challBody}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sideTitle}>CHALLENGES</div>
          {CHALLENGES.map((c,i)=>{
            const done = solvedIds.has(c.id);
            return (
              <button key={c.id} style={{...S.qBtn,...(i===qIdx?S.qBtnActive:{}),...(done?S.qBtnDone:{})}} onClick={()=>setQIdx(i)}>
                <span style={{width:20,textAlign:"center"}}>{done?"✓":i===qIdx?"▶":i+1}</span>
                <span style={{flex:1,textAlign:"left",fontSize:"0.78rem"}}>{c.title}</span>
                <span style={{fontSize:"0.68rem",opacity:.6}}>{c.points}pt</span>
              </button>
            );
          })}
          <div style={S.sideProgress}>
            <div style={S.progressBar}><div style={{...S.progressFill,width:`${(solvedIds.size/CHALLENGES.length)*100}%`}}/></div>
            <div style={{fontSize:"0.7rem",color:"#3a5a7a",marginTop:4}}>{solvedIds.size}/{CHALLENGES.length} solved</div>
          </div>
        </div>

        {/* Main */}
        <div style={S.mainPanel}>
          <div style={S.qHeader}>
            <div>
              <div style={S.qNum}>QUESTION {qIdx+1} OF {CHALLENGES.length} · {ch.points} POINTS</div>
              <div style={S.qTitle}>{ch.title}</div>
              <p style={S.qDesc}>{ch.description}</p>
            </div>
            <div style={S.timerBox}>
              <div style={{fontSize:"0.62rem",color:"#ff6b35",letterSpacing:1}}>TIME</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:"1.4rem",color:elapsed>120?"#ff2244":"#ff6b35"}}>{fmtClock(elapsed)}</div>
              {alreadySolved && <div style={{fontSize:"0.62rem",color:"#39ff14"}}>SOLVED ✓</div>}
            </div>
          </div>

          {alreadySolved && (
            <div style={S.solvedBanner}>✅ Solved in {fmtTime(solvedTimes[ch.id]||0)}! Move to the next challenge.</div>
          )}

          <div>
            <div style={S.secLabel}>🐛 BUGGY CODE — line {ch.bugLine} has the bug</div>
            <div style={S.codeBlock}>
              <div style={S.codeBlockHdr}><span>C source (read-only)</span><span style={{color:"#ff6b35"}}>FIND THE BUG</span></div>
              <pre style={S.pre}>
                {ch.buggyCode.split("\n").map((line,i)=>(
                  <span key={i} style={i+1===ch.bugLine?S.bugLine:{}}>
                    <span style={{color:"#3a5a7a",userSelect:"none",marginRight:10}}>{String(i+1).padStart(2," ")}</span>{line}{"\n"}
                  </span>
                ))}
              </pre>
            </div>
          </div>

          <details style={S.hint}>
            <summary style={{cursor:"pointer",color:"#ffcc00",fontSize:"0.82rem",letterSpacing:1}}>💡 HINT (click to reveal)</summary>
            <p style={{marginTop:8,color:"#a8d8f0",fontSize:"0.88rem"}}>{ch.hint}</p>
          </details>

          <div>
            <div style={S.secLabel}>✏️ YOUR FIX — retype the corrected code</div>
            <div style={S.editor}>
              <div style={S.editorHdr}>
                <span style={{color:"#00d4ff"}}>solution.c</span>
                <button style={S.resetBtn} onClick={()=>setCode(ch.buggyCode)}>↺ RESET</button>
              </div>
              <textarea style={S.textarea} value={code} onChange={e=>setCode(e.target.value)}
                disabled={alreadySolved} spellCheck={false}
                rows={Math.max(10,ch.buggyCode.split("\n").length+2)} />
            </div>
          </div>

          <div>
            <div style={S.secLabel}>⚙️ OUTPUT</div>
            <div style={{...S.outputBox,color:outputType==="ok"?"#39ff14":outputType==="error"?"#ff2244":"#3a5a7a"}}>
              {output||"Press RUN to evaluate your fix…"}
            </div>
            {feedback && <div style={S.feedbackBox}>{feedback}</div>}
          </div>

          {result==="correct" && <div style={S.correctBanner}>🎉 CORRECT! +{ch.points} points · Saved to Google Sheets!</div>}
          {result==="wrong"   && <div style={S.wrongBanner}>❌ Not correct. Attempts: {attempts}. Read the hint and try again.</div>}

          <div style={S.actionRow}>
            <button style={{...S.btnAction,opacity:qIdx===0?.3:1}} onClick={()=>setQIdx(q=>Math.max(0,q-1))} disabled={qIdx===0}>← PREV</button>
            <button style={{...S.btnRun,opacity:alreadySolved||loading?.5:1}} onClick={handleRun} disabled={alreadySolved||loading}>
              {loading?"⏳ EVALUATING…":"▶ RUN & SUBMIT"}
            </button>
            <button style={{...S.btnAction,opacity:qIdx===CHALLENGES.length-1?.3:1}} onClick={()=>setQIdx(q=>Math.min(CHALLENGES.length-1,q+1))} disabled={qIdx===CHALLENGES.length-1}>NEXT →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LeaderboardScreen({ webAppUrl, onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  async function load() {
    setLoading(true);
    const r = await sheetsCall(webAppUrl, "leaderboard");
    if (r.participants && r.submissions) {
      const lb = buildLb(r.participants, r.submissions);
      setData(lb);
    }
    setLoading(false);
    setLastRefresh(new Date().toLocaleTimeString());
  }

  useEffect(() => { load(); const iv = setInterval(load, 20000); return ()=>clearInterval(iv); }, []);

  function buildLb(parts, subs) {
    // parts: [Name, USN, Branch, JoinedAt]
    // subs:  [USN, Name, Branch, QID, QTitle, TimeTakenMs, TimeFmt, Attempts, Correct, SubmittedAt]
    return parts.map(p => {
      const usn = p[1];
      const correct = subs.filter(s => s[0]===usn && s[8]==="YES");
      const uniqueQ = [...new Map(correct.map(s=>[s[3],s])).values()];
      const totalScore = uniqueQ.reduce((a,s)=>{const c=CHALLENGES.find(ch=>ch.id==s[3]);return a+(c?c.points:0);},0);
      const totalTime = uniqueQ.reduce((a,s)=>a+Number(s[5]),0);
      return { name:p[0], usn, branch:p[2], totalScore, totalTime, solved:uniqueQ.length };
    }).sort((a,b)=>b.totalScore-a.totalScore||a.totalTime-b.totalTime);
  }

  return (
    <div style={S.lbRoot}>
      <div style={S.lbHeader}>
        <div style={S.logoMark}><span style={{color:"#00d4ff"}}>DEBUG</span><span style={{color:"#ff6b35"}}>ARENA</span></div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",color:"#3a5a7a",fontSize:"0.75rem"}}>
          {lastRefresh ? `Last updated: ${lastRefresh}` : "Loading…"} · auto-refreshes every 20s
        </div>
        <div style={{display:"flex",gap:10}}>
          <button style={S.btnSm} onClick={load}>↺ REFRESH</button>
          <button style={S.btnSm} onClick={onBack}>← BACK</button>
        </div>
      </div>
      <div style={S.lbContainer}>
        <div style={S.lbTitle}>🏆 LIVE RANKINGS</div>
        {loading && <div style={{color:"#3a5a7a",textAlign:"center",padding:40}}>Loading from Google Sheets…</div>}
        {!loading && data.length===0 && <div style={{color:"#3a5a7a",textAlign:"center",padding:40}}>No participants yet.</div>}
        {data.map((p,i)=>(
          <div key={p.usn} style={{...S.lbRow,...(i<3?S.lbTop:{})}}>
            <div style={{...S.rank,color:i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":"#3a5a7a"}}>
              {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
            </div>
            <div style={S.lbName}>
              <div style={{fontWeight:700,fontSize:"1rem"}}>{p.name}</div>
              <div style={{fontSize:"0.72rem",color:"#3a5a7a"}}>{p.usn} · {p.branch}</div>
            </div>
            <div style={S.lbStats}>
              <div style={{textAlign:"center"}}>
                <div style={{color:scoreColor(p.totalScore),fontFamily:"'Share Tech Mono',monospace",fontSize:"1.1rem",fontWeight:700}}>{p.totalScore}</div>
                <div style={{fontSize:"0.62rem",color:"#3a5a7a"}}>POINTS</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{color:"#00d4ff",fontFamily:"'Share Tech Mono',monospace"}}>{p.solved}/{CHALLENGES.length}</div>
                <div style={{fontSize:"0.62rem",color:"#3a5a7a"}}>SOLVED</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{color:"#ff6b35",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.88rem"}}>{fmtTime(p.totalTime)}</div>
                <div style={{fontSize:"0.62rem",color:"#3a5a7a"}}>TIME</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COORDINATOR DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function CoordinatorScreen({ webAppUrl, onBack }) {
  const [tab, setTab] = useState("leaderboard");
  const [raw, setRaw] = useState({ participants:[], submissions:[] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  async function load() {
    setLoading(true);
    const r = await sheetsCall(webAppUrl, "leaderboard");
    if (r.participants) setRaw(r);
    setLoading(false);
    setLastRefresh(new Date().toLocaleTimeString());
  }
  useEffect(()=>{ load(); const iv=setInterval(load,20000); return()=>clearInterval(iv); },[]);

  function buildLb() {
    return raw.participants.map(p=>{
      const usn=p[1];
      const correct=raw.submissions.filter(s=>s[0]===usn&&s[8]==="YES");
      const uniqueQ=[...new Map(correct.map(s=>[s[3],s])).values()];
      const totalScore=uniqueQ.reduce((a,s)=>{const c=CHALLENGES.find(ch=>ch.id==s[3]);return a+(c?c.points:0);},0);
      const totalTime=uniqueQ.reduce((a,s)=>a+Number(s[5]),0);
      return{name:p[0],usn,branch:p[2],totalScore,totalTime,solved:uniqueQ.length,solvedIds:uniqueQ.map(s=>s[3])};
    }).sort((a,b)=>b.totalScore-a.totalScore||a.totalTime-b.totalTime);
  }

  function exportCSV() {
    const lb = buildLb();
    const rows = [["Rank","Name","USN","Branch","Score","Solved","Total Time",...CHALLENGES.map(c=>`Q${c.id}:${c.title}`)]];
    lb.forEach((p,i)=>{
      const qCols = CHALLENGES.map(c=>{
        const s=raw.submissions.find(sub=>sub[0]===p.usn&&sub[3]==c.id&&sub[8]==="YES");
        return s?s[6]:"—";
      });
      rows.push([i+1,p.name,p.usn,p.branch,p.totalScore,p.solved,fmtTime(p.totalTime),...qCols]);
    });
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const a=document.createElement("a");
    a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download="debug_arena_results.csv"; a.click();
  }

  const lb = buildLb();
  const activeCount = lb.filter(p=>p.solved>0).length;
  const totalSolves = raw.submissions.filter(s=>s[8]==="YES").length;

  return (
    <div style={S.coordRoot}>
      <div style={S.lbHeader}>
        <div style={S.logoMark}><span style={{color:"#00d4ff"}}>DEBUG</span><span style={{color:"#ff6b35"}}>ARENA</span></div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",color:"#ffcc00",fontSize:"0.75rem"}}>
          🎛 COORDINATOR · {lastRefresh?`Updated: ${lastRefresh}`:"Loading…"}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.btnSm,color:"#39ff14",borderColor:"#39ff14"}} onClick={exportCSV}>⬇ CSV</button>
          <button style={S.btnSm} onClick={load}>↺</button>
          <button style={S.btnSm} onClick={onBack}>← LOGOUT</button>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsBar}>
        {[[raw.participants.length,"Registered","#00d4ff"],[activeCount,"Active","#39ff14"],
          [totalSolves,"Submissions","#ffcc00"],[lb[0]?.name||"—","Leader","#ffd700"]].map(([n,l,c])=>(
          <div key={l} style={{textAlign:"center",padding:"12px 24px",borderRight:"1px solid #0d2040"}}>
            <div style={{color:c,fontFamily:"'Share Tech Mono',monospace",fontSize:"1.2rem",fontWeight:700}}>{n}</div>
            <div style={{fontSize:"0.62rem",color:"#3a5a7a",letterSpacing:1,marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.coordTabs}>
        {["leaderboard","participants","per-question"].map(t=>(
          <button key={t} style={{...S.tabBtn2,...(tab===t?S.tabBtn2Active:{})}} onClick={()=>setTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={S.coordContent}>
        {loading && <div style={{color:"#3a5a7a",padding:40,textAlign:"center"}}>Loading from Google Sheets…</div>}

        {/* LEADERBOARD TAB */}
        {!loading && tab==="leaderboard" && (
          <div style={{overflowX:"auto"}}>
            <table style={S.table}>
              <thead><tr>
                {["#","Name","USN","Branch","Score","Solved","Time",...CHALLENGES.map(c=>`Q${c.id}`)].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {lb.map((p,i)=>(
                  <tr key={p.usn} style={{background:i%2===0?"#060c14":"#080f1a"}}>
                    <td style={S.td}><span style={{color:i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":"#3a5a7a",fontWeight:700}}>#{i+1}</span></td>
                    <td style={{...S.td,fontWeight:600}}>{p.name}</td>
                    <td style={{...S.td,fontFamily:"'Share Tech Mono',monospace",fontSize:"0.78rem"}}>{p.usn}</td>
                    <td style={S.td}>{p.branch}</td>
                    <td style={{...S.td,color:scoreColor(p.totalScore),fontWeight:700}}>{p.totalScore}</td>
                    <td style={{...S.td,color:"#00d4ff"}}>{p.solved}/{CHALLENGES.length}</td>
                    <td style={{...S.td,color:"#ff6b35",fontFamily:"'Share Tech Mono',monospace"}}>{fmtTime(p.totalTime)}</td>
                    {CHALLENGES.map(c=>{
                      const done=p.solvedIds.includes(c.id)||p.solvedIds.includes(String(c.id));
                      return <td key={c.id} style={{...S.td,textAlign:"center"}}><span style={{color:done?"#39ff14":"#1a3050"}}>{done?"✓":"·"}</span></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PARTICIPANTS TAB */}
        {!loading && tab==="participants" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={S.coordSectionTitle}>👥 ALL PARTICIPANTS ({raw.participants.length})</div>
              <input style={S.searchInput} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name / USN / branch…" />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
              {raw.participants.filter(p=>
                !search||p[0].toLowerCase().includes(search.toLowerCase())||p[1].toLowerCase().includes(search.toLowerCase())||p[2].toLowerCase().includes(search.toLowerCase())
              ).map(p=>{
                const usn=p[1];
                const corr=raw.submissions.filter(s=>s[0]===usn&&s[8]==="YES");
                const uniq=[...new Map(corr.map(s=>[s[3],s])).values()];
                const score=uniq.reduce((a,s)=>{const c=CHALLENGES.find(ch=>ch.id==s[3]);return a+(c?c.points:0);},0);
                return (
                  <div key={usn} style={S.participantCard}>
                    <div style={{fontWeight:700,color:"#fff"}}>{p[0]}</div>
                    <div style={{fontFamily:"'Share Tech Mono',monospace",color:"#00d4ff",fontSize:"0.76rem",margin:"3px 0"}}>{usn}</div>
                    <div style={{fontSize:"0.78rem",color:"#3a5a7a",marginBottom:8}}>{p[2]}</div>
                    <div style={{display:"flex",gap:16}}>
                      <div><div style={{color:"#39ff14",fontWeight:700}}>{score}</div><div style={{fontSize:"0.62rem",color:"#3a5a7a"}}>pts</div></div>
                      <div><div style={{color:"#ffcc00"}}>{uniq.length}</div><div style={{fontSize:"0.62rem",color:"#3a5a7a"}}>solved</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PER-QUESTION TAB */}
        {!loading && tab==="per-question" && (
          <div>
            <div style={S.coordSectionTitle}>📋 QUESTION ANALYTICS</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
              {CHALLENGES.map(ch=>{
                const allSubs=raw.submissions.filter(s=>s[3]==ch.id);
                const corr=allSubs.filter(s=>s[8]==="YES");
                const uniqueParticipants=[...new Set(allSubs.map(s=>s[0]))];
                const rate=uniqueParticipants.length>0?Math.round(corr.filter((s,i,a)=>a.findIndex(x=>x[0]===s[0])===i).length/uniqueParticipants.length*100):0;
                const avgTime=corr.length?corr.reduce((a,s)=>a+Number(s[5]),0)/corr.length:0;
                return (
                  <div key={ch.id} style={S.qCard}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontFamily:"'Share Tech Mono',monospace",color:"#3a5a7a",fontSize:"0.7rem"}}>Q{ch.id} · {ch.points}pts</span>
                      <span style={{color:rate>60?"#39ff14":rate>30?"#ffcc00":"#ff2244",fontSize:"0.8rem",fontWeight:700}}>{rate}% solved</span>
                    </div>
                    <div style={{fontWeight:700,color:"#fff",marginBottom:8}}>{ch.title}</div>
                    <div style={{display:"flex",gap:16,fontSize:"0.85rem"}}>
                      <div><span style={{color:"#00d4ff"}}>{corr.filter((s,i,a)=>a.findIndex(x=>x[0]===s[0])===i).length}</span><span style={{color:"#3a5a7a",fontSize:"0.7rem",marginLeft:4}}>solved</span></div>
                      <div><span style={{color:"#ff6b35",fontFamily:"'Share Tech Mono',monospace"}}>{avgTime?fmtTime(avgTime):"—"}</span><span style={{color:"#3a5a7a",fontSize:"0.7rem",marginLeft:4}}>avg time</span></div>
                      <div><span style={{color:"#ffcc00"}}>{uniqueParticipants.length}</span><span style={{color:"#3a5a7a",fontSize:"0.7rem",marginLeft:4}}>attempted</span></div>
                    </div>
                    <div style={{height:4,background:"#0d2040",borderRadius:2,overflow:"hidden",marginTop:10}}>
                      <div style={{height:"100%",borderRadius:2,width:`${Math.min(rate,100)}%`,background:rate>60?"#39ff14":rate>30?"#ffcc00":"#ff2244",transition:"width .4s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Field({ label, value, onChange, type="text", placeholder="" }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:"0.68rem",letterSpacing:1.5,color:"#3a5a7a",marginBottom:4,textTransform:"uppercase"}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"10px 12px",background:"#080f1a",border:"1px solid #0d2040",color:"#c8e0f4",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.9rem",outline:"none",borderRadius:3}}
        onFocus={e=>e.target.style.borderColor="#00d4ff"} onBlur={e=>e.target.style.borderColor="#0d2040"} />
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@700;900&display=swap');
  *{box-sizing:border-box;}
  body{margin:0;background:#040810;color:#c8e0f4;font-family:'Rajdhani',sans-serif;}
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-track{background:#040810;}
  ::-webkit-scrollbar-thumb{background:#0d2040;border-radius:3px;}
  details summary::-webkit-details-marker{color:#ffcc00;}
  textarea{resize:vertical;}
`;

const S = {
  app:{minHeight:"100vh",background:"#040810",color:"#c8e0f4",fontFamily:"'Rajdhani',sans-serif",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 39px,#00d4ff05 39px,#00d4ff05 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#00d4ff05 39px,#00d4ff05 40px)"},
  setupBanner:{background:"#ffcc0011",borderBottom:"1px solid #ffcc0044",padding:"8px 20px",fontSize:"0.82rem",color:"#ffcc00",textAlign:"center"},
  inlineBtnLink:{background:"none",border:"none",color:"#00d4ff",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",fontSize:"0.82rem",textDecoration:"underline"},

  // SETUP
  setupRoot:{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24},
  setupBox:{width:"100%",maxWidth:680,background:"#080f1a",border:"1px solid #0d2040",padding:"36px 32px"},
  setupTitle:{fontFamily:"'Orbitron',monospace",fontSize:"1.1rem",fontWeight:700,color:"#00d4ff",textAlign:"center",marginTop:8,marginBottom:4},
  setupDesc:{textAlign:"center",color:"#3a5a7a",fontSize:"0.82rem",marginBottom:24,letterSpacing:1},
  steps:{display:"flex",flexDirection:"column",gap:14,marginBottom:24},
  step:{display:"flex",gap:14,alignItems:"flex-start"},
  stepN:{width:28,height:28,borderRadius:"50%",background:"#00d4ff",color:"#000",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Orbitron',monospace",fontSize:"0.8rem",fontWeight:900,flexShrink:0,marginTop:2},
  stepTitle:{fontWeight:700,color:"#fff",marginBottom:3},
  stepBody:{color:"#7aa0c0",fontSize:"0.84rem",lineHeight:1.5},
  scriptBox:{background:"#020609",border:"1px solid #0d2040",borderRadius:4,overflow:"hidden",marginBottom:4},
  scriptHdr:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:"#080f1a",borderBottom:"1px solid #0d2040"},
  scriptPre:{padding:"12px 14px",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.72rem",color:"#6090b0",lineHeight:1.5,margin:0,overflowX:"auto",maxHeight:200,overflowY:"auto"},
  copyBtn:{padding:"4px 12px",background:"#00d4ff22",border:"1px solid #00d4ff",color:"#00d4ff",cursor:"pointer",fontFamily:"'Orbitron',monospace",fontSize:"0.65rem",borderRadius:2},
  okMsg:{padding:"10px 14px",background:"#39ff1411",border:"1px solid #39ff14",borderRadius:3,color:"#39ff14",fontSize:"0.84rem",marginTop:10},
  errMsg:{padding:"10px 14px",background:"#ff224411",border:"1px solid #ff2244",borderRadius:3,color:"#ff2244",fontSize:"0.84rem",marginTop:10},
  btnGhost2:{padding:"10px 20px",background:"none",border:"1px solid #0d2040",color:"#3a5a7a",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",fontSize:"0.85rem",borderRadius:3},
  btnPrimary2:{flex:1,padding:"10px 20px",background:"#00d4ff",color:"#000",border:"none",cursor:"pointer",fontFamily:"'Orbitron',monospace",fontSize:"0.78rem",fontWeight:700,letterSpacing:1,borderRadius:3},
  lbl:{display:"block",fontSize:"0.68rem",letterSpacing:1.5,color:"#3a5a7a",marginBottom:4,textTransform:"uppercase"},
  input:{width:"100%",padding:"10px 12px",background:"#040810",border:"1px solid #0d2040",color:"#c8e0f4",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.85rem",outline:"none",borderRadius:3},

  // LANDING
  landing:{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:24},
  landingBox:{width:"100%",maxWidth:480,background:"#080f1a",border:"1px solid #0d2040",padding:"36px 32px",boxShadow:"0 0 60px #00d4ff0a"},
  logoMark:{fontFamily:"'Orbitron',monospace",fontSize:"2rem",fontWeight:900,textAlign:"center",marginBottom:4,letterSpacing:3,textShadow:"0 0 30px #00d4ff33"},
  landingSub:{textAlign:"center",color:"#3a5a7a",marginBottom:24,fontSize:"0.76rem",letterSpacing:2,textTransform:"uppercase"},
  tabRow:{display:"flex",marginBottom:20,border:"1px solid #0d2040",borderRadius:3,overflow:"hidden"},
  tabBtn:{flex:1,padding:"9px 0",background:"none",border:"none",cursor:"pointer",color:"#3a5a7a",fontFamily:"'Rajdhani',sans-serif",fontSize:"0.8rem",fontWeight:700,letterSpacing:1},
  tabBtnActive:{background:"#00d4ff",color:"#000"},
  btnPrimary:{width:"100%",padding:12,background:"#00d4ff",color:"#000",border:"none",cursor:"pointer",fontFamily:"'Orbitron',monospace",fontSize:"0.78rem",fontWeight:700,letterSpacing:2,borderRadius:3,marginTop:4},
  btnGhost:{width:"100%",padding:9,background:"none",color:"#3a5a7a",border:"1px solid #0d2040",cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",fontSize:"0.8rem",borderRadius:3,marginTop:8},
  err:{color:"#ff2244",fontSize:"0.8rem",marginBottom:8,fontFamily:"'Share Tech Mono',monospace"},
  statsRow:{display:"flex",border:"1px solid #0d2040",borderRadius:4,overflow:"hidden",background:"#080f1a"},
  statBox:{padding:"14px 24px",textAlign:"center",borderRight:"1px solid #0d2040"},
  statN:{fontFamily:"'Orbitron',monospace",fontSize:"1.2rem",color:"#00d4ff",fontWeight:900},
  statL:{fontSize:"0.62rem",color:"#3a5a7a",letterSpacing:1,marginTop:2},

  // CHALLENGE
  challRoot:{display:"flex",flexDirection:"column",minHeight:"100vh"},
  challHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 22px",borderBottom:"1px solid #0d2040",background:"#040810ee",position:"sticky",top:0,zIndex:100,gap:10,flexWrap:"wrap"},
  chip:{padding:"3px 10px",border:"1px solid #0d2040",borderRadius:2,fontSize:"0.72rem",fontFamily:"'Share Tech Mono',monospace",color:"#a8d8f0"},
  scorePill:{padding:"4px 12px",background:"#ffcc0022",border:"1px solid #ffcc00",borderRadius:3,color:"#ffcc00",fontFamily:"'Orbitron',monospace",fontSize:"0.78rem",fontWeight:700},
  challBody:{display:"flex",flex:1,overflow:"hidden"},
  sidebar:{width:210,borderRight:"1px solid #0d2040",padding:"14px 10px",display:"flex",flexDirection:"column",gap:3,overflowY:"auto",background:"#060c14"},
  sideTitle:{fontSize:"0.62rem",letterSpacing:2,color:"#3a5a7a",padding:"0 4px 8px",borderBottom:"1px solid #0d2040",marginBottom:3},
  qBtn:{display:"flex",alignItems:"center",gap:7,padding:"7px 8px",background:"none",border:"none",cursor:"pointer",color:"#3a5a7a",borderRadius:3,width:"100%"},
  qBtnActive:{background:"#0a1a30",color:"#00d4ff"},
  qBtnDone:{color:"#39ff14"},
  sideProgress:{marginTop:"auto",paddingTop:14},
  progressBar:{height:4,background:"#0d2040",borderRadius:2,overflow:"hidden"},
  progressFill:{height:"100%",background:"#39ff14",borderRadius:2,transition:"width .4s"},
  mainPanel:{flex:1,padding:"22px 26px",overflowY:"auto",display:"flex",flexDirection:"column",gap:16},
  qHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,flexWrap:"wrap"},
  qNum:{fontSize:"0.68rem",color:"#3a5a7a",letterSpacing:2,fontFamily:"'Share Tech Mono',monospace"},
  qTitle:{fontSize:"1.35rem",fontWeight:700,color:"#fff",marginTop:2},
  qDesc:{color:"#7aa0c0",fontSize:"0.88rem",marginTop:5,lineHeight:1.5},
  timerBox:{padding:"10px 16px",border:"1px solid #ff6b35",background:"#ff6b3511",borderRadius:3,textAlign:"center",minWidth:84},
  solvedBanner:{padding:"11px 16px",background:"#39ff1411",border:"1px solid #39ff14",borderRadius:3,color:"#39ff14",fontSize:"0.86rem",fontWeight:600},
  secLabel:{fontSize:"0.68rem",letterSpacing:2,color:"#3a5a7a",marginBottom:7},
  codeBlock:{background:"#020609",border:"1px solid #0d2040",borderRadius:4,overflow:"hidden"},
  codeBlockHdr:{display:"flex",justifyContent:"space-between",padding:"6px 12px",background:"#080f1a",borderBottom:"1px solid #0d2040",fontSize:"0.68rem",color:"#3a5a7a"},
  pre:{padding:"12px 14px",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.83rem",lineHeight:1.7,color:"#a8d8f0",margin:0,overflowX:"auto"},
  bugLine:{display:"block",color:"#ff4466",background:"#ff002215",borderRadius:2},
  hint:{padding:"11px 14px",background:"#ffcc0008",border:"1px solid #ffcc0033",borderRadius:3},
  editor:{background:"#020609",border:"1px solid #0d3060",borderRadius:4,overflow:"hidden"},
  editorHdr:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 12px",background:"#080f1a",borderBottom:"1px solid #0d2040",fontSize:"0.68rem"},
  resetBtn:{background:"none",border:"1px solid #0d2040",color:"#3a5a7a",cursor:"pointer",padding:"3px 9px",borderRadius:2,fontSize:"0.68rem"},
  textarea:{width:"100%",padding:"12px 14px",background:"#020609",border:"none",color:"#a8d8f0",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.83rem",lineHeight:1.7,outline:"none",display:"block"},
  outputBox:{background:"#020609",border:"1px solid #0d2040",borderRadius:4,padding:"11px 14px",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.84rem",lineHeight:1.6,minHeight:50,whiteSpace:"pre-wrap"},
  feedbackBox:{marginTop:8,padding:"9px 13px",background:"#ff6b3511",border:"1px solid #ff6b35",borderRadius:3,color:"#ff6b35",fontSize:"0.84rem"},
  correctBanner:{padding:"13px 18px",background:"#39ff1411",border:"1px solid #39ff14",borderRadius:4,color:"#39ff14",fontWeight:700,textAlign:"center",letterSpacing:1},
  wrongBanner:{padding:"13px 18px",background:"#ff224411",border:"1px solid #ff2244",borderRadius:4,color:"#ff2244",fontWeight:700,textAlign:"center"},
  actionRow:{display:"flex",gap:10,flexWrap:"wrap"},
  btnAction:{padding:"10px 18px",background:"#080f1a",border:"1px solid #0d2040",color:"#a8d8f0",cursor:"pointer",fontFamily:"'Orbitron',monospace",fontSize:"0.68rem",borderRadius:3},
  btnRun:{flex:1,padding:"11px",background:"#00d4ff",color:"#000",border:"none",cursor:"pointer",fontFamily:"'Orbitron',monospace",fontSize:"0.78rem",fontWeight:700,letterSpacing:2,borderRadius:3},
  btnSm:{padding:"6px 14px",background:"#00d4ff22",border:"1px solid #00d4ff",color:"#00d4ff",cursor:"pointer",fontFamily:"'Orbitron',monospace",fontSize:"0.68rem",borderRadius:3,letterSpacing:1},

  // LEADERBOARD
  lbRoot:{minHeight:"100vh",display:"flex",flexDirection:"column"},
  lbHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 26px",borderBottom:"1px solid #0d2040",background:"#040810ee",gap:10,flexWrap:"wrap"},
  lbContainer:{maxWidth:820,margin:"0 auto",padding:"24px 18px",width:"100%"},
  lbTitle:{fontFamily:"'Orbitron',monospace",fontSize:"0.95rem",fontWeight:900,color:"#ffd700",marginBottom:18,letterSpacing:2},
  lbRow:{display:"flex",alignItems:"center",gap:14,padding:"13px 16px",border:"1px solid #0d2040",borderRadius:4,marginBottom:7,background:"#080f1a"},
  lbTop:{borderColor:"#ffd70033",background:"#ffd70008"},
  rank:{fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:"1.05rem",minWidth:34,textAlign:"center"},
  lbName:{flex:1},
  lbStats:{display:"flex",gap:18,alignItems:"center"},

  // COORDINATOR
  coordRoot:{minHeight:"100vh",display:"flex",flexDirection:"column"},
  statsBar:{display:"flex",borderBottom:"1px solid #0d2040",background:"#060c14",flexWrap:"wrap"},
  coordTabs:{display:"flex",borderBottom:"1px solid #0d2040",background:"#040810"},
  tabBtn2:{padding:"11px 22px",background:"none",border:"none",borderBottom:"2px solid transparent",cursor:"pointer",color:"#3a5a7a",fontFamily:"'Rajdhani',sans-serif",fontSize:"0.82rem",fontWeight:700,letterSpacing:1},
  tabBtn2Active:{color:"#00d4ff",borderBottomColor:"#00d4ff"},
  coordContent:{flex:1,padding:"22px 26px",overflowY:"auto"},
  coordSectionTitle:{fontFamily:"'Orbitron',monospace",fontSize:"0.76rem",color:"#3a5a7a",letterSpacing:2,marginBottom:14},
  table:{width:"100%",borderCollapse:"collapse",fontFamily:"'Rajdhani',sans-serif"},
  th:{padding:"9px 12px",textAlign:"left",fontSize:"0.68rem",letterSpacing:1.5,color:"#3a5a7a",borderBottom:"1px solid #0d2040",background:"#060c14",whiteSpace:"nowrap"},
  td:{padding:"9px 12px",fontSize:"0.86rem",borderBottom:"1px solid #0a1525"},
  searchInput:{padding:"7px 12px",background:"#080f1a",border:"1px solid #0d2040",color:"#c8e0f4",fontFamily:"'Share Tech Mono',monospace",fontSize:"0.8rem",borderRadius:3,outline:"none",minWidth:240},
  participantCard:{background:"#080f1a",border:"1px solid #0d2040",borderRadius:4,padding:"13px 14px"},
  qCard:{background:"#080f1a",border:"1px solid #0d2040",borderRadius:4,padding:"13px 14px"},
};
