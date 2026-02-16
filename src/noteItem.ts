import * as vscode from 'vscode';
import * as path from 'node:path';

export class NoteItem extends vscode.TreeItem {
  constructor(
    public readonly noteUri: vscode.Uri,
    public readonly ctime: number,
    public readonly mtime: number,
  ) {
    const fileName = path.basename(noteUri.fsPath);
    super(fileName, vscode.TreeItemCollapsibleState.None);

    const fmt = (ts: number) => {
      const d = new Date(ts);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}-${mm}-${yy}`;
    };

    this.tooltip = `Created: ${fmt(ctime)}\nModified: ${fmt(mtime)}\n${noteUri.fsPath}`;
    this.contextValue = 'note';

    this.command = {
      command: 'vscode.open',
      title: 'Open Note',
      arguments: [noteUri],
    };

    const iconMap: Record<string, string> = {
      '.md': 'markdown',
      '.json': 'json',
      '.js': 'symbol-event',
      '.ts': 'symbol-event',
      '.py': 'symbol-event',
    };
    this.iconPath = new vscode.ThemeIcon(iconMap[path.extname(noteUri.fsPath)] ?? 'file');
  }
}
