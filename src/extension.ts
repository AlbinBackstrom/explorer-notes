import * as vscode from 'vscode';
import { NotesProvider, SortKey } from './notesProvider';

export function activate(context: vscode.ExtensionContext): void {
  const notesDir = context.globalStorageUri;
  const savedSort = context.globalState.get<SortKey>('sortKey', 'name-asc');
  const notesProvider = new NotesProvider(notesDir, savedSort);

  vscode.commands.executeCommand('setContext', 'explorerNotes.sort', savedSort);

  const treeView = vscode.window.createTreeView('explorerNotes', {
    treeDataProvider: notesProvider,
    showCollapseAll: false,
  });

  const createCmd = vscode.commands.registerCommand('explorerNotes.createNote', () =>
    notesProvider.createNote()
  );

  const openNoteCmd = vscode.commands.registerCommand('explorerNotes.openNote', () =>
    notesProvider.openNote()
  );

  const deleteCmd = vscode.commands.registerCommand('explorerNotes.deleteNote', (item) =>
    notesProvider.deleteNote(item)
  );

  const renameCmd = vscode.commands.registerCommand('explorerNotes.renameNote', (item) =>
    notesProvider.renameNote(item)
  );

  const duplicateCmd = vscode.commands.registerCommand('explorerNotes.duplicateNote', (item) =>
    notesProvider.duplicateNote(item)
  );

  const revealCmd = vscode.commands.registerCommand('explorerNotes.revealInFinder', (item) =>
    notesProvider.revealInFinder(item)
  );

  const setSort = (key: SortKey) => {
    notesProvider.setSort(key);
    context.globalState.update('sortKey', key);
  };

  const sortNameAscCmd = vscode.commands.registerCommand('explorerNotes.sortNameAsc', () =>
    setSort('name-asc')
  );

  const sortNameDescCmd = vscode.commands.registerCommand('explorerNotes.sortNameDesc', () =>
    setSort('name-desc')
  );

  const sortDateAscCmd = vscode.commands.registerCommand('explorerNotes.sortDateAsc', () =>
    setSort('date-asc')
  );

  const sortDateDescCmd = vscode.commands.registerCommand('explorerNotes.sortDateDesc', () =>
    setSort('date-desc')
  );

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(notesDir, '{*.md,*.json,*.js,*.ts,*.py}')
  );
  const refresh = () => notesProvider.refresh();
  watcher.onDidCreate(refresh);
  watcher.onDidDelete(refresh);
  watcher.onDidChange(refresh);

  context.subscriptions.push(treeView, createCmd, openNoteCmd, deleteCmd, renameCmd, duplicateCmd, revealCmd, sortNameAscCmd, sortNameDescCmd, sortDateAscCmd, sortDateDescCmd, watcher);
}

export function deactivate(): void {}
