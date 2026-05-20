## Graphify

This project may have a Graphify knowledge graph at `graphify-out/`.

Use Graphify as a navigation aid for architecture, structure, component relationships, and cross-file codebase questions.

Rules:
- If `graphify-out/GRAPH_REPORT.md` exists, read it before broad architecture/codebase exploration.
- If `graphify-out/wiki/index.md` exists, use it as the first navigation map before reading many raw source files.
- For cross-module questions such as "how does X relate to Y", prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` when `graphify-out/graph.json` exists.
- If Graphify output does not exist, is stale, or lacks the needed detail, fall back to targeted source reads and repository search.
- Do not treat Graphify as the sole authority for security-sensitive work. Verify auth, RBAC, storage, workflow, and file-access behavior directly in source files before making changes.
- After modifying code files in a Graphify-enabled session, run `graphify update .` when practical to keep the graph current.
