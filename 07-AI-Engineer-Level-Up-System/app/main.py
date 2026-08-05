from __future__ import annotations

import os
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("LEVELUP_DB", BASE_DIR / "data" / "levelup.db"))
STATIC_DIR = BASE_DIR / "app" / "static"

@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AI Engineer Level-Up System",
    description="A personal growth system for an implementation engineer moving toward AI/FDE.",
    version="1.0.0",
    lifespan=lifespan,
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class LogCreate(BaseModel):
    log_date: date
    topic: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1, max_length=1000)
    reflection: str = Field(default="", max_length=1000)
    problem: str = Field(default="", max_length=1000)
    commit_url: str = Field(default="", max_length=300)
    xp: int = Field(default=20, ge=1, le=500)


class SkillUpdate(BaseModel):
    status: str


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    stack: str = Field(min_length=1, max_length=200)
    progress: int = Field(ge=0, le=100)
    github_url: str = Field(default="", max_length=300)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    priority: str = Field(default="routine")
    due_date: date | None = None


class TaskUpdate(BaseModel):
    completed: bool


@contextmanager
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    schema = (BASE_DIR / "app" / "schema.sql").read_text(encoding="utf-8")
    with db() as connection:
        connection.executescript(schema)
        if connection.execute("SELECT COUNT(*) FROM skills").fetchone()[0] == 0:
            skills = [
                ("Python", "函数", "completed", 1), ("Python", "数据容器", "learning", 2),
                ("Python", "类与对象", "locked", 3), ("Python", "文件处理", "locked", 4),
                ("AI 应用", "模型 API", "locked", 1), ("AI 应用", "结构化输出", "locked", 2),
                ("RAG", "文档切分", "locked", 1), ("RAG", "检索与引用", "locked", 2),
                ("Agent", "工具调用", "locked", 1), ("Agent", "工作流编排", "locked", 2),
                ("工程", "Linux", "learning", 1), ("工程", "Docker", "locked", 2),
            ]
            connection.executemany(
                "INSERT INTO skills(category, name, status, position) VALUES (?, ?, ?, ?)", skills
            )
        if connection.execute("SELECT COUNT(*) FROM learning_logs").fetchone()[0] == 0:
            connection.execute(
                """INSERT INTO learning_logs
                (log_date, topic, content, reflection, problem, commit_url, xp, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                ("2026-08-04", "Python 函数", "无参函数、单形参、多形参、返回值与函数调用",
                 "把体温检测和 ATM 业务拆成职责明确、可以组合的函数。",
                 "原始 ATM 存在重复进入菜单和过多全局变量的问题，整理版改为主循环和显式参数。",
                 "01-Python-Foundation/day01-function", 20, datetime.now().isoformat()),
            )
        if connection.execute("SELECT COUNT(*) FROM projects").fetchone()[0] == 0:
            connection.execute(
                "INSERT INTO projects(name, stack, progress, github_url) VALUES (?, ?, ?, ?)",
                ("AI Engineer Level-Up System", "React · TypeScript · FastAPI · SQLite", 60, ""),
            )
        if connection.execute("SELECT COUNT(*) FROM tasks").fetchone()[0] == 0:
            connection.executemany(
                "INSERT INTO tasks(title, priority, due_date, completed, created_at) VALUES (?, ?, ?, ?, ?)",
                [
                    ("开始 Day02：学习 Python 数据容器", "high", "2026-08-05", 0, datetime.now().isoformat()),
                    ("整理 Day01 函数代码与学习笔记", "routine", "2026-08-05", 1, datetime.now().isoformat()),
                    ("用字典重新建模 ATM 客户账户", "routine", "2026-08-06", 0, datetime.now().isoformat()),
                ],
            )


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(STATIC_DIR / "dist" / "index.html")


@app.get("/api/dashboard")
def dashboard():
    with db() as connection:
        skills = [dict(row) for row in connection.execute(
            "SELECT id, category, name, status, position FROM skills ORDER BY category, position"
        )]
        logs = [dict(row) for row in connection.execute(
            "SELECT * FROM learning_logs ORDER BY log_date DESC, id DESC"
        )]
        projects = [dict(row) for row in connection.execute("SELECT * FROM projects ORDER BY id DESC")]
        tasks = [dict(row) for row in connection.execute(
            "SELECT * FROM tasks ORDER BY completed, CASE priority WHEN 'high' THEN 0 ELSE 1 END, id DESC"
        )]

    total_xp = sum(item["xp"] for item in logs)
    level = total_xp // 100 + 1
    streak = calculate_streak([item["log_date"] for item in logs])
    completed = sum(item["status"] == "completed" for item in skills)
    achievements = []
    if logs:
        achievements.append({"name": "第一行代码", "icon": "01", "detail": "完成第一次学习记录"})
    if streak >= 3:
        achievements.append({"name": "持续交付", "icon": "03", "detail": "连续学习 3 天"})
    if completed >= 4:
        achievements.append({"name": "Python 入门", "icon": "PY", "detail": "完成 4 个 Python 节点"})

    return {
        "profile": {
            "name": "GitZxliang",
            "role": "企业软件实施工程师",
            "target": "AI 应用工程师 / FDE",
            "level": level,
            "xp": total_xp,
            "next_level_xp": level * 100,
            "learning_days": len({item["log_date"] for item in logs}),
            "streak": streak,
        },
        "skills": skills,
        "logs": logs,
        "projects": projects,
        "tasks": tasks,
        "achievements": achievements,
    }


def calculate_streak(raw_dates: list[str]) -> int:
    dates = sorted({date.fromisoformat(value) for value in raw_dates}, reverse=True)
    if not dates:
        return 0
    cursor = dates[0]
    streak = 1
    for value in dates[1:]:
        if value == cursor - timedelta(days=1):
            streak += 1
            cursor = value
        else:
            break
    return streak


@app.post("/api/logs", status_code=201)
def create_log(payload: LogCreate):
    with db() as connection:
        cursor = connection.execute(
            """INSERT INTO learning_logs
            (log_date, topic, content, reflection, problem, commit_url, xp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.log_date.isoformat(), payload.topic.strip(), payload.content.strip(),
             payload.reflection.strip(), payload.problem.strip(), payload.commit_url.strip(),
             payload.xp, datetime.now().isoformat()),
        )
        row = connection.execute("SELECT * FROM learning_logs WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.patch("/api/skills/{skill_id}")
def update_skill(skill_id: int, payload: SkillUpdate):
    if payload.status not in {"locked", "learning", "completed"}:
        raise HTTPException(422, "status must be locked, learning or completed")
    with db() as connection:
        cursor = connection.execute("UPDATE skills SET status = ? WHERE id = ?", (payload.status, skill_id))
        if cursor.rowcount == 0:
            raise HTTPException(404, "skill not found")
        row = connection.execute("SELECT * FROM skills WHERE id = ?", (skill_id,)).fetchone()
    return dict(row)


@app.post("/api/projects", status_code=201)
def create_project(payload: ProjectCreate):
    with db() as connection:
        cursor = connection.execute(
            "INSERT INTO projects(name, stack, progress, github_url) VALUES (?, ?, ?, ?)",
            (payload.name.strip(), payload.stack.strip(), payload.progress, payload.github_url.strip()),
        )
        row = connection.execute("SELECT * FROM projects WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.post("/api/tasks", status_code=201)
def create_task(payload: TaskCreate):
    if payload.priority not in {"high", "routine"}:
        raise HTTPException(422, "priority must be high or routine")
    with db() as connection:
        cursor = connection.execute(
            "INSERT INTO tasks(title, priority, due_date, completed, created_at) VALUES (?, ?, ?, 0, ?)",
            (payload.title.strip(), payload.priority,
             payload.due_date.isoformat() if payload.due_date else None, datetime.now().isoformat()),
        )
        row = connection.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate):
    with db() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET completed = ? WHERE id = ?", (int(payload.completed), task_id)
        )
        if cursor.rowcount == 0:
            raise HTTPException(404, "task not found")
        row = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return dict(row)


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    with db() as connection:
        cursor = connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, "task not found")
