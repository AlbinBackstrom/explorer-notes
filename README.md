# Explorer Notes

A simple notepad in the VS Code Explorer sidebar. Create and manage Markdown notes that are shared across all your VS Code windows.

## Features

- **Create, rename, duplicate, and delete** notes from the sidebar
- **Markdown support** with built-in image paste (copy an image, paste it into a note)
- **Sorting** by name (A-Z / Z-A) or modified date (newest / oldest), persisted across restarts
- **Quick Open** — search and open notes via the Command Palette
- **Reveal in Finder** — right-click a note to open it in your file manager
- **Global storage** — notes live in VS Code's global storage, not in your workspace

## Commands

| Command | Description |
|---------|-------------|
| `Notes: Create Note` | Create a new Markdown note |
| `Explorer Notes: Open Note` | Quick Pick search to open a note |
| `Notes: Rename Note` | Rename an existing note |
| `Notes: Duplicate Note` | Duplicate a note with its content |
| `Notes: Delete Note` | Delete a note (with confirmation) |
| `Notes: Reveal in Finder` | Open Finder with the note selected |
| `Notes: Sort by Name (A-Z)` | Sort alphabetically ascending |
| `Notes: Sort by Name (Z-A)` | Sort alphabetically descending |
| `Notes: Sort by Modified (Newest)` | Sort by last modified, newest first |
| `Notes: Sort by Modified (Oldest)` | Sort by last modified, oldest first |
| `Notes: Refresh Notes` | Manually refresh the note list |

## Storage

Notes are stored in VS Code's global extension storage:

```
~/Library/Application Support/Code/User/globalStorage/albin.explorer-notes/
```

This means notes are shared across all workspaces and windows, and don't pollute your project folders.

## Development

```bash
npm install
npm run compile
# Press F5 to launch the Extension Development Host
```
