# D6K.1 Miro Connector Capability Result

## 1. Purpose

Phase D6K.1 tested whether Miro MCP can create connector-based classic UML use case shapes for a future D6K retry.

The test focused on actor representation, a system boundary, oval use case shapes, actor association connectors, and labeled `<<include>>` / `<<extend>>` relations.

## 2. Board Scope

- Target board URL: `https://miro.com/app/board/uXjVHLL4Jsw=/`
- One safe test frame only: `D6K.1 Connector Capability Test - Safe To Delete`
- Generic test diagram only
- No real DMS diagram was created
- No existing board content was intentionally modified

## 3. Tools Tested

- `layout_get_dsl`
- `diagram_get_dsl`
- `board_list_items`
- `layout_create`
- `diagram_create`
- `layout_read`

## 4. Capability Results

| Capability | Result | Notes |
|---|---|---|
| Frame creation | success | `layout_create` created exactly one scoped frame named `D6K.1 Connector Capability Test - Safe To Delete`. |
| Actor representation | partial | Native `layout_create` can create editable labeled actor boxes outside the boundary. The exposed layout DSL did not provide a stick-figure or UML actor primitive. |
| System boundary | success | Native `layout_create` can create an editable rounded rectangle boundary labeled `Test System Boundary`. `diagram_create` flowchart clusters can also create a container-like boundary. |
| Oval use case shape | success | Native `layout_create` can create oval-like use case shapes by using `SHAPE type=circle` with non-square dimensions. |
| Actor association connector | partial | `diagram_create` flowchart produced actual connector items with `association` captions between generic actor/use-case nodes. The exposed `layout_create` DSL did not provide connector primitives for connecting the native actor boxes to the native oval shapes. |
| Dashed include connector | partial | `diagram_create` flowchart produced a real labeled `<<include>>` connector. The returned connector style was a normal elbowed connector, not a dashed UML include dependency. |
| Extend connector | partial | `diagram_create` flowchart produced a real labeled `<<extend>>` connector. The returned connector style was a normal elbowed connector, not a dashed UML extend dependency. |
| Editable native output | partial | Native frame/text/shape output is editable. The `diagram_create` connector output is a Miro diagram object with connector content, but `layout_read` treated it as an unsupported item and did not expose it for shape-level layout edits. |

## 5. Visual Result Assessment

Requires hybrid MCP + manual finishing.

The result is not close enough to the desired classic UML use case example for a fully MCP-generated D6K retry. MCP can create native editable actor boxes, a system boundary, and oval use case shapes. MCP can also create connector-bearing diagram output through `diagram_create`, including labeled `<<include>>` and `<<extend>>` relations. However, the currently exposed MCP tools did not demonstrate a way to draw connector lines directly between the native layout-created actor boxes and oval use case shapes, nor did they demonstrate dashed UML dependency connectors for include/extend.

## 6. Recommendation

Use a hybrid workflow for the next D6K retry:

- MCP creates the safe frame, title, actors, system boundary, oval use case shapes, labels, notes, and initial layout.
- The user manually draws or finishes the connector lines in Miro, especially actor associations and dashed `<<include>>` / `<<extend>>` dependencies.

If a future Miro MCP tool exposes connector primitives for layout-created shapes, D6K can be retried as a fully MCP-generated native UML use case diagram. Based on this probe, D6K.2 should not rely on full MCP connector generation for classic UML use case output.

## 7. Safety Confirmation

- No real DMS diagrams were created.
- No unrelated board items were intentionally modified or deleted.
- No secrets, tokens, API keys, env values, DB URLs, cookies, sessions, password hashes, storage paths, physical paths, logical paths, or credentials were printed.
- No repo runtime files were changed.
- No `.puml` files were changed.

Additional note: the required read-first file `docs/diagrams/miro-d6k-use-case-prototype-result.md` was not present in the clean working tree during this phase, so the previous D6K result was treated from the user-provided phase context rather than from that missing repo file.
