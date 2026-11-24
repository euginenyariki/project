# TeamBoard

A small kanban workspace that does the essentials well: capture a task, prioritise it, give it a due date and move it across the board.

## Features

- **Four columns** — Backlog, To do, In progress and Done
- **Drag and drop** between columns, plus arrow buttons for keyboard/touch users
- **Priorities** (high / medium / low), due dates with overdue highlighting
- **Search and priority filters**
- **Inline add / edit / delete** through a modal form
- **JSON export** and local autosave
- **Dark mode** and responsive columns

## Run it

```bash
# open index.html directly, or
python3 -m http.server 8000  # then visit http://localhost:8000
```

## Privacy

No login, no server and no keys. Cards are saved in `localStorage` under `teamboard:v1`. This is a personal board, not a real-time team service — use the JSON export to share or back up.

## Stack

HTML5, CSS custom properties, native drag-and-drop and vanilla JavaScript.

## License

MIT — see [LICENSE](LICENSE).
