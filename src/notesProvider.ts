import * as vscode from 'vscode';
import * as path from 'path';
import { NoteItem } from './noteItem';

export type SortKey = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

export class NotesProvider implements vscode.TreeDataProvider<NoteItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<NoteItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private sortKey: SortKey;

  constructor(private notesDir: vscode.Uri, initialSortKey: SortKey = 'name-asc') {
    this.sortKey = initialSortKey;
  }

  setSort(key: SortKey): void {
    this.sortKey = key;
    vscode.commands.executeCommand('setContext', 'explorerNotes.sort', key);
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: NoteItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: NoteItem): Promise<NoteItem[]> {
    if (element) {
      return [];
    }

    try {
      const entries = await vscode.workspace.fs.readDirectory(this.notesDir);
      const mdFiles = entries.filter(
        ([name, type]) => type === vscode.FileType.File && name.endsWith('.md')
      );

      const items = await Promise.all(
        mdFiles.map(async ([name]) => {
          const uri = vscode.Uri.joinPath(this.notesDir, name);
          const stat = await vscode.workspace.fs.stat(uri);
          return new NoteItem(uri, stat.ctime, stat.mtime);
        })
      );

      switch (this.sortKey) {
        case 'name-desc':
          return items.sort((a, b) => String(b.label).localeCompare(String(a.label)));
        case 'date-asc':
          return items.sort((a, b) => a.mtime - b.mtime);
        case 'date-desc':
          return items.sort((a, b) => b.mtime - a.mtime);
        default:
          return items.sort((a, b) => String(a.label).localeCompare(String(b.label)));
      }
    } catch {
      return [];
    }
  }

  async createNote(): Promise<void> {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter a name for the new note',
      placeHolder: 'my-note',
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return 'Note name cannot be empty';
        }
        if (/[/\\:*?"<>|]/.test(value)) {
          return 'Note name contains invalid characters';
        }
        return undefined;
      },
    });

    if (!name) {
      return;
    }

    const trimmed = name.trim();
    const baseName = trimmed.endsWith('.md') ? trimmed.slice(0, -3) : trimmed;

    await vscode.workspace.fs.createDirectory(this.notesDir);

    let fileName = `${baseName}.md`;
    let noteUri = vscode.Uri.joinPath(this.notesDir, fileName);
    let counter = 1;

    while (await this.fileExists(noteUri)) {
      fileName = `${baseName} (${counter}).md`;
      noteUri = vscode.Uri.joinPath(this.notesDir, fileName);
      counter++;
    }

    await vscode.workspace.fs.writeFile(noteUri, new Uint8Array());
    this.refresh();
    await vscode.commands.executeCommand('vscode.open', noteUri);
  }

  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  async renameNote(item: NoteItem): Promise<void> {
    const oldName = path.basename(item.noteUri.fsPath, '.md');
    const newName = await vscode.window.showInputBox({
      prompt: 'Enter a new name for the note',
      value: oldName,
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return 'Note name cannot be empty';
        }
        if (/[/\\:*?"<>|]/.test(value)) {
          return 'Note name contains invalid characters';
        }
        return undefined;
      },
    });

    const trimmed = newName?.trim();
    if (!trimmed || trimmed === oldName) {
      return;
    }

    const baseName = trimmed.endsWith('.md') ? trimmed.slice(0, -3) : trimmed;
    const fileName = `${baseName}.md`;
    const newUri = vscode.Uri.joinPath(this.notesDir, fileName);

    try {
      await vscode.workspace.fs.stat(newUri);
      vscode.window.showWarningMessage(`Note "${fileName}" already exists.`);
      return;
    } catch {
      // File doesn't exist, proceed
    }

    await vscode.workspace.fs.rename(item.noteUri, newUri);
    this.refresh();
  }

  async duplicateNote(item: NoteItem): Promise<void> {
    const oldName = path.basename(item.noteUri.fsPath, '.md');
    let fileName = `${oldName} - copy.md`;
    let newUri = vscode.Uri.joinPath(this.notesDir, fileName);
    let counter = 1;

    while (await this.fileExists(newUri)) {
      fileName = `${oldName} - copy (${counter}).md`;
      newUri = vscode.Uri.joinPath(this.notesDir, fileName);
      counter++;
    }

    const content = await vscode.workspace.fs.readFile(item.noteUri);
    await vscode.workspace.fs.writeFile(newUri, content);
    this.refresh();
  }

  async openNote(): Promise<void> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(this.notesDir);
      const mdFiles = entries
        .filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
        .sort(([a], [b]) => a.localeCompare(b));

      if (mdFiles.length === 0) {
        vscode.window.showInformationMessage('No notes yet. Create one first.');
        return;
      }

      const items = await Promise.all(
        mdFiles.map(async ([name]) => {
          const uri = vscode.Uri.joinPath(this.notesDir, name);
          const stat = await vscode.workspace.fs.stat(uri);
          const d = new Date(stat.mtime);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yy = String(d.getFullYear()).slice(-2);
          return { label: name, description: `Modified: ${dd}-${mm}-${yy}`, uri };
        })
      );

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Search notes...',
        matchOnDescription: true,
      });

      if (picked) {
        await vscode.commands.executeCommand('vscode.open', picked.uri);
      }
    } catch {
      vscode.window.showInformationMessage('No notes yet. Create one first.');
    }
  }

  async revealInFinder(item: NoteItem): Promise<void> {
    await vscode.commands.executeCommand('revealFileInOS', item.noteUri);
  }

  async deleteNote(item: NoteItem): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Delete note "${item.label}"?`,
      { modal: true },
      'Delete'
    );

    if (confirm !== 'Delete') {
      return;
    }

    await vscode.workspace.fs.delete(item.noteUri);
    this.refresh();
  }
}
