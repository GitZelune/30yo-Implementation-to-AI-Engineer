import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  CheckSquare2,
  ExternalLink,
  LayoutDashboard,
  Menu,
  PanelsTopLeft,
  Plus,
  Route,
  Trash2,
  X,
} from "lucide-react";
import { api } from "./api";
import type { DashboardData, Priority, Project, Skill, SkillStatus, Task } from "./types";

type ModalKind = "log" | "task" | "project" | null;
const statusOrder: SkillStatus[] = ["locked", "learning", "completed"];
const panelMotion = { initial: { opacity: 0, y: 8 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .08 } };

export default function App() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalKind>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await api.dashboard());
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "系统暂时无法连接");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message: string) => setToast(message);

  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!data) return <LoadingScreen />;

  const completedSkills = data.skills.filter((skill) => skill.status === "completed").length;
  const openTasks = data.tasks.filter((task) => !task.completed).length;
  const progress = skillProgress(data.skills);

  async function mutate(action: () => Promise<unknown>, message: string, id = -1) {
    setBusy(id);
    try {
      await action();
      await refresh();
      notify(message);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : "操作失败");
    } finally {
      setBusy(null);
    }
  }

  function navigate(id: string) {
    setActiveSection(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: .15, ease: [.2, 0, 0, 1] }}>
      <Sidebar
        data={data}
        active={activeSection}
        openTasks={openTasks}
        progress={progress}
        open={menuOpen}
        navigate={navigate}
      />
      <header className="mobile-bar">
        <Wordmark onClick={() => navigate("overview")} />
        <button className="icon-button" aria-label={menuOpen ? "关闭导航" : "打开导航"} onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>
      <main className="workspace" id="overview">
        <PageHeader days={data.profile.learning_days} openLog={() => setModal("log")} />
        <SignalRow data={data} completedSkills={completedSkills} />
        <div className="bento-grid">
          <RoadmapPanel />
          <ProgressPanel
            skills={data.skills}
            progress={progress}
            busy={busy}
            update={(skill, status) => void mutate(() => api.updateSkill(skill.id, status), "技能进度已更新", skill.id)}
          />
          <TaskPanel
            tasks={data.tasks}
            busy={busy}
            openModal={() => setModal("task")}
            toggle={(task) => void mutate(() => api.updateTask(task.id, !task.completed), task.completed ? "任务已重新打开" : "任务完成", task.id)}
            remove={(task) => void mutate(() => api.deleteTask(task.id), "任务已删除", task.id)}
          />
          <JournalPanel logs={data.logs} openModal={() => setModal("log")} />
          <ProjectsPanel projects={data.projects} openModal={() => setModal("project")} />
        </div>
        <footer><span>SHIFT / PERSONAL LEARNING SYSTEM</span><span>BUILD IN PUBLIC · 2026</span></footer>
      </main>

      <AnimatePresence>
        {menuOpen && <motion.button className="nav-backdrop" aria-label="关闭导航" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuOpen(false)} />}
        {modal && (
          <Modal kind={modal} close={() => setModal(null)} submit={async (kind, payload) => {
            if (kind === "log") await api.createLog(payload);
            if (kind === "task") await api.createTask(payload as { title: string; priority: Priority; due_date: string | null });
            if (kind === "project") await api.createProject(payload);
            await refresh();
            setModal(null);
            notify(kind === "log" ? "学习记录已保存" : kind === "task" ? "任务已加入队列" : "项目已添加");
          }} />
        )}
        {toast && <motion.div className="toast show" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>{toast}</motion.div>}
      </AnimatePresence>
    </MotionConfig>
  );
}

function Wordmark({ onClick }: { onClick: () => void }) {
  return <button className="wordmark wordmark-button" onClick={onClick}><span className="wordmark-glyph">/</span><span>SHIFT</span></button>;
}

function Sidebar({ data, active, openTasks, progress, open, navigate }: {
  data: DashboardData; active: string; openTasks: number; progress: number; open: boolean; navigate: (id: string) => void;
}) {
  const items = [
    ["overview", "总览", LayoutDashboard, "01"],
    ["roadmap", "学习路线", Route, "02"],
    ["tasks", "待办任务", CheckSquare2, String(openTasks)],
    ["journal", "学习日志", BookOpen, "04"],
    ["projects", "项目墙", PanelsTopLeft, "05"],
  ] as const;
  return <aside className={`sidebar ${open ? "mobile-open" : ""}`} aria-label="主导航">
    <Wordmark onClick={() => navigate("overview")} />
    <div className="workspace-label">PERSONAL OS</div>
    <nav>{items.map(([id, label, Icon, meta]) => <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => navigate(id)}>
      <Icon className="nav-icon" size={14} strokeWidth={1.6} /><span>{label}</span><span className={id === "tasks" ? "nav-count" : "nav-key"}>{meta}</span>
    </button>)}</nav>
    <div className="sidebar-spacer" />
    <div className="phase-rail">
      <div className="phase-head"><span>TRANSFORMATION</span><span>{progress}%</span></div>
      <div className="phase-line"><motion.i animate={{ width: `${progress}%` }} /></div>
      <p>Implementation Engineer</p><strong>AI Application / FDE</strong>
    </div>
    <div className="account"><span className="account-avatar">梁</span><div><strong>{data.profile.name}</strong><small>Level {data.profile.level} · {data.profile.xp} XP</small></div><span className="online" title="系统在线" /></div>
  </aside>;
}

function PageHeader({ days, openLog }: { days: number; openLog: () => void }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  const today = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" }).format(new Date());
  return <header className="page-header">
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <p className="overline"><span className="status-dot" /> SYSTEM ACTIVE · {today} · DAY {String(days).padStart(2, "0")}</p>
      <h1>{greeting}，梁。<br /><span>继续构建你的下一种能力。</span></h1>
    </motion.div>
    <motion.button className="button primary" whileHover={{ y: -1 }} whileTap={{ scale: .985 }} onClick={openLog}>记录今日学习 <ArrowUpRight size={14} /></motion.button>
  </header>;
}

function SignalRow({ data, completedSkills }: { data: DashboardData; completedSkills: number }) {
  const signals = [
    ["LEARNING DAYS", data.profile.learning_days, "累计学习"],
    ["CURRENT STREAK", data.profile.streak, "连续天数"],
    ["TOTAL OUTPUT", data.projects.length, "作品集项目"],
    ["CAPABILITY", completedSkills, "已完成节点"],
  ];
  return <section className="signal-row" aria-label="核心指标">{signals.map(([label, value, note]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>;
}

function Panel({ className, children, id }: { className: string; children: ReactNode; id: string }) {
  return <motion.section {...panelMotion} className={`panel ${className}`} id={id}>{children}</motion.section>;
}

function PanelHead({ index, english, title, action }: { index: string; english: string; title: string; action?: ReactNode }) {
  return <div className="panel-head"><div><p className="overline">{index} / {english}</p><h2>{title}</h2></div>{action}</div>;
}

const roadmap = [
  ["01", "FOUNDATION", "企业软件实施", "客户需求 · 系统部署 · SQL · Linux", "EXPERIENCE", "complete"],
  ["02", "IN PROGRESS", "Python 工程基础", "函数 · 数据容器 · 面向对象 · API", "CURRENT", "current"],
  ["03", "NEXT", "AI 应用开发", "模型 API · 结构化输出 · 评估", "PLANNED", ""],
  ["04", "LATER", "RAG 与 Agent", "企业知识库 · 工具调用 · 工作流", "PLANNED", ""],
  ["05", "TARGET", "AI 应用工程师 / FDE", "发现问题 · 方案设计 · 端到端交付", "DESTINATION", "destination"],
];

function RoadmapPanel() {
  return <Panel className="roadmap-panel span-8" id="roadmap">
    <PanelHead index="01" english="LEARNING ROADMAP" title="学习路线" action={<span className="panel-meta">5 PHASES · 2026—2027</span>} />
    <div className="roadmap-list">{roadmap.map(([index, state, title, detail, label, className]) => <motion.article layout key={index} className={`roadmap-item ${className}`}>
      <div className="roadmap-index">{className === "complete" ? <Check size={13} /> : index}</div>
      <div><span className="route-state">{state}</span><h3>{title}</h3><p>{detail}</p></div><span className="state-label">{label}</span>
    </motion.article>)}</div>
  </Panel>;
}

function ProgressPanel({ skills, progress, busy, update }: { skills: Skill[]; progress: number; busy: number | null; update: (skill: Skill, status: SkillStatus) => void }) {
  const groups = useMemo(() => skills.reduce<Record<string, Skill[]>>((result, skill) => { (result[skill.category] ||= []).push(skill); return result; }, {}), [skills]);
  return <Panel className="progress-panel span-4" id="progress">
    <PanelHead index="02" english="PROGRESS" title="学习进度" action={<span className="live-label">LIVE</span>} />
    <div className="progress-figure"><div className="progress-number"><motion.strong key={progress} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{progress}</motion.strong><span>%</span></div><p>Overall capability completion</p><div className="brutal-track"><motion.i animate={{ width: `${progress}%` }} /><span /></div></div>
    <div className="capability-list">{Object.entries(groups).map(([category, items]) => {
      const value = skillProgress(items); const next = items.find((item) => item.status !== "completed") || items.at(-1)!;
      const status = statusOrder[(statusOrder.indexOf(next.status) + 1) % statusOrder.length];
      return <motion.button layout key={category} className="capability-row" data-status={next.status} disabled={busy === next.id} onClick={() => update(next, status)}>
        <span>{category}</span><span className="mini-track"><motion.i animate={{ width: `${value}%` }} /></span><span className="capability-value">{value}%</span>
      </motion.button>;
    })}</div><p className="interaction-hint">点击能力行，推进下一个技能节点</p>
  </Panel>;
}

function TaskPanel({ tasks, busy, openModal, toggle, remove }: { tasks: Task[]; busy: number | null; openModal: () => void; toggle: (task: Task) => void; remove: (task: Task) => void }) {
  const open = tasks.filter((task) => !task.completed).length;
  const completion = tasks.length ? Math.round(((tasks.length - open) / tasks.length) * 100) : 0;
  return <Panel className="task-panel span-5" id="tasks">
    <PanelHead index="03" english="FOCUS QUEUE" title="待办任务" action={<button className="quiet-button" onClick={openModal}><Plus size={11} /> 新任务</button>} />
    <div className="task-summary"><span><b>{open}</b> 项待完成</span><span>{completion}% 完成</span></div>
    <motion.div layout className="task-list"><AnimatePresence initial={false}>{tasks.map((task) => <motion.article layout key={task.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: busy === task.id ? .45 : 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`task-item ${task.completed ? "completed" : ""}`}>
      <button className={`task-check ${task.completed ? "checked" : ""}`} aria-label={`${task.completed ? "重新打开" : "完成"}任务：${task.title}`} onClick={() => toggle(task)}>{Boolean(task.completed) && <Check size={10} strokeWidth={3} />}</button>
      <div><div className="task-title">{task.title}</div>{task.due_date && <small className="task-due">{task.due_date}</small>}</div>
      <span className={`task-tag ${task.priority}`}>{task.priority}</span><button className="task-delete" aria-label="删除任务" onClick={() => remove(task)}><Trash2 size={12} /></button>
    </motion.article>)}</AnimatePresence>{!tasks.length && <Empty>添加一项今天能完成的具体行动。</Empty>}</motion.div>
  </Panel>;
}

function JournalPanel({ logs, openModal }: { logs: DashboardData["logs"]; openModal: () => void }) {
  return <Panel className="journal-panel span-7" id="journal">
    <PanelHead index="04" english="LEARNING JOURNAL" title="学习日志" action={<button className="quiet-button" onClick={openModal}><Plus size={11} /> 写日志</button>} />
    <div className="journal-grid">{logs.slice(0, 4).map((log) => <motion.article whileHover={{ y: -1 }} key={log.id} className="journal-card"><div className="journal-meta"><time>{formatDate(log.log_date)}</time><span>FOCUS / {topicCode(log.topic)}</span></div><h3>{log.topic}</h3><p>{log.reflection || log.content}</p><div className="journal-foot">+{log.xp} XP · LEARNING EVIDENCE</div></motion.article>)}{!logs.length && <Empty>写下今天真正理解的一个概念。</Empty>}</div>
  </Panel>;
}

function ProjectsPanel({ projects, openModal }: { projects: Project[]; openModal: () => void }) {
  return <Panel className="projects-panel span-12" id="projects">
    <PanelHead index="05" english="DELIVERY EVIDENCE" title="项目墙" action={<button className="quiet-button" onClick={openModal}><Plus size={11} /> 添加项目</button>} />
    <div className="project-grid">{projects.map((project, index) => <motion.article whileHover={{ y: -2 }} key={project.id} className="project-card">
      <div className="project-thumb"><div className="project-visual"><span className="project-data">0{index + 1}<br />{project.progress}%<br />BUILD</span></div></div>
      <div className="project-body"><div className="project-topline"><h3>{project.name}</h3>{project.github_url ? <a className="external-link" href={safeUrl(project.github_url)} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a> : <ArrowUpRight className="external-link" size={13} />}</div><p>{project.stack}</p><div className="project-progress"><div><motion.i animate={{ width: `${project.progress}%` }} /></div><span>{project.progress}%</span></div></div>
    </motion.article>)}{!projects.length && <Empty>添加一项能够证明交付能力的真实项目。</Empty>}</div>
  </Panel>;
}

function Modal({ kind, close, submit }: { kind: Exclude<ModalKind, null>; close: () => void; submit: (kind: Exclude<ModalKind, null>, payload: Record<string, unknown>) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const config = {
    log: ["NEW JOURNAL ENTRY", "记录今日学习", "保存学习记录"],
    task: ["NEW FOCUS ITEM", "添加待办任务", "添加到队列"],
    project: ["NEW PROJECT", "添加作品集项目", "添加到项目墙"],
  }[kind];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload: Record<string, unknown> = kind === "log" ? { ...values, xp: Number(values.xp) }
      : kind === "task" ? { ...values, due_date: values.due_date || null }
      : { ...values, progress: Number(values.progress) };
    try { await submit(kind, payload); } catch (reason) { setError(reason instanceof Error ? reason.message : "保存失败"); setSubmitting(false); }
  }

  return <motion.div className="modal-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && close()}>
    <motion.div className="modal-surface" role="dialog" aria-modal="true" aria-labelledby="modal-title" initial={{ opacity: 0, scale: .985, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .985, y: 6 }}>
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-head"><div><p className="overline">{config[0]}</p><h2 id="modal-title">{config[1]}</h2></div><button type="button" className="icon-button" onClick={close} aria-label="关闭"><X size={16} /></button></div>
        {kind === "log" && <><div className="field-row"><Field label="日期"><input name="log_date" type="date" defaultValue={todayISO()} required /></Field><Field label="获得 XP"><input name="xp" type="number" defaultValue="20" min="1" max="500" required /></Field></div><Field label="学习主题"><input name="topic" placeholder="例如：Python 数据容器" required maxLength={100} autoFocus /></Field><Field label="学习内容"><textarea name="content" placeholder="今天掌握了什么？" required maxLength={1000} /></Field><Field label="复盘与业务连接"><textarea name="reflection" placeholder="它如何连接你的实施经验？" maxLength={1000} /></Field><Field label="问题与解决"><textarea name="problem" placeholder="遇到了什么问题，如何处理？" maxLength={1000} /></Field><Field label="代码提交地址"><input name="commit_url" type="url" placeholder="https://github.com/..." /></Field></>}
        {kind === "task" && <><Field label="任务内容"><input name="title" placeholder="明确、可完成的一项行动" required maxLength={160} autoFocus /></Field><div className="field-row"><Field label="优先级"><select name="priority" defaultValue="routine"><option value="routine">Routine</option><option value="high">High</option></select></Field><Field label="截止日期"><input name="due_date" type="date" /></Field></div></>}
        {kind === "project" && <><Field label="项目名称"><input name="name" placeholder="例如：AI 财务助手" required maxLength={100} autoFocus /></Field><Field label="技术栈"><input name="stack" placeholder="FastAPI · RAG · PostgreSQL" required maxLength={200} /></Field><Field label="当前完成度"><input name="progress" type="number" defaultValue="10" min="0" max="100" required /></Field><Field label="GitHub 地址"><input name="github_url" type="url" placeholder="https://github.com/..." /></Field></>}
        <button className="button primary full" disabled={submitting}>{submitting ? "正在保存…" : config[2]} <ArrowUpRight size={14} /></button><p className="form-message" role="status">{error}</p>
      </form>
    </motion.div>
  </motion.div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label>{label}{children}</label>; }
function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div>; }
function LoadingScreen() { return <div className="loading-screen"><span className="wordmark-glyph">/</span><p>正在载入学习系统</p><motion.i animate={{ scaleX: [0, 1] }} transition={{ duration: .8 }} /></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="error-state"><span className="wordmark-glyph">/</span><h1>学习系统未连接</h1><p>{message}</p><button className="button primary" onClick={retry}>重新连接</button></div>; }

function skillProgress(skills: Skill[]) { const completed = skills.filter((item) => item.status === "completed").length; const learning = skills.filter((item) => item.status === "learning").length; return Math.round(((completed + learning * .5) / Math.max(skills.length, 1)) * 100); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(value: string) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`)); }
function topicCode(topic: string) { return /Python/i.test(topic) ? "PYTHON" : /RAG/i.test(topic) ? "RAG" : /Agent/i.test(topic) ? "AGENT" : "ENGINEERING"; }
function safeUrl(value: string) { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : "#"; } catch { return "#"; } }
