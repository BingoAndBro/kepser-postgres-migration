---
name: creating-best-practices
description: Creates best practice documentation for libraries or frameworks. Use when the user requests generating a best practice markdown file, looking up best practices, or generating docs using MCP context7.
---

# Best Practice Creator Skill

## When to use this skill
- The user asks to create a best practice markdown file for a specific framework or tool.
- The user requests researching official documentation for best practices using the Context7 MCP server.
- The user wants a summary of architectural patterns, data fetching, or other library-specific guidelines.

## Workflow

1.  **Understand Context:** Identify the framework or library the user wants best practices for (e.g., "TanStack Start").
2.  **Resolve Library ID:** Use the `mcp_context7_resolve-library-id` tool to find the correct library ID for the requested technology. Provide the `libraryName` (e.g., "TanStack Start") and an appropriate `query`.
3.  **Query Documentation:** Use the `mcp_context7_query-docs` tool to search for best practices.
    *   **Tip:** Be specific in your `query`. Include keywords like "best practices", "recommended architecture", "state management", "routing", etc.
4.  **Review Output:** The query result might be saved to a local file. If so, use `view_file` to read the large output.
5.  **Generate Documentation:** Synthesize the findings into a well-structured markdown document.
    *   Use clear headings, code blocks, and bullet points.
    *   Save the file using `write_to_file` to the `docs/` directory or whichever directory the user requested (e.g., `docs/[framework]-best-practices.md`).

## Instructions

-   **Accuracy:** Rely *only* on the output provided by context7. Avoid making up best practices based on outdated training data.
-   **Structure:** Make the generated markdown file easy to read. Usually including sections like "Architecture", "File Structure", "Data Fetching", and "State Management" is helpful depending on the framework.
-   **No Hallucination:** If context7 cannot find best practices, inform the user rather than inventing them.
