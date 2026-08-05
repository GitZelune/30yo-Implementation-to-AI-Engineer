# AI Engineer Level-Up System

把从企业软件实施到 AI 应用工程师 / FDE 的学习过程，变成一套真正可执行、可回顾、可展示的个人学习工作台。

## Features

- 固定侧边栏与响应式 Bento Grid 工作台
- 学习路线：从企业实施到 AI 应用工程师 / FDE 的五阶段路径
- 实时学习进度：Python、AI 应用、RAG、Agent 与工程能力
- 待办任务：优先级、截止日期、完成状态与删除操作
- 学习日志：内容、复盘、问题、代码地址和 XP
- 项目墙：技术栈、完成度与 GitHub 地址
- REST API 与自动生成的 OpenAPI 文档

界面采用克制的黑灰工业 SaaS 视觉语言，只有学习进度与活跃状态使用技术绿强调色。所有操作均保存到 SQLite。

## Stack

- React 19 + TypeScript 7
- Vite 8
- Motion 12 for layout and modal transitions
- Lucide React icon system
- FastAPI + SQLite

## Run production build

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd frontend
pnpm install
pnpm build
cd ..
uvicorn app.main:app --reload
```

Open <http://127.0.0.1:38000>. API docs are at <http://127.0.0.1:38000/docs>.

For frontend development, keep FastAPI running on port `38000`, then run `pnpm dev` inside `frontend/` and open <http://127.0.0.1:5173>.

## Test

```bash
python3 -m unittest discover -s tests -v
```

## Data

SQLite data is created automatically in `data/levelup.db`. Set `LEVELUP_DB` to use another path.
