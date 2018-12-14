import * as vscode from "vscode";
import { TrelloComponent, removeTempTrelloFile } from "./trelloUtils";
import { TestView } from "./testView";
import { TrelloTreeView } from "./trelloTreeView";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "trello" is now active!');
  // @ts-ignore
  const trello = new TrelloComponent(context);
  const trelloTreeView = new TrelloTreeView(trello);
  vscode.window.registerTreeDataProvider("testView", new TestView());
  vscode.window.registerTreeDataProvider("trelloTreeView", trelloTreeView);

  context.subscriptions.push(vscode.commands.registerCommand("trello.refresh", () => trelloTreeView.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.test", () => trello.getTrelloKeyToken()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.setKey", () => trello.setTrelloKey()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.setToken", () => trello.setTrelloToken()));
  context.subscriptions.push(vscode.commands.registerCommand("trello.getBoards", () => trello.getStarredBoards()));
  context.subscriptions.push(
    vscode.commands.registerCommand("trello.getLists", () => trello.getListsFromBoard("5bd4c6f140a87f6b4e8ef868"))
  );
  context.subscriptions.push(vscode.commands.registerCommand("trello.getCard", cardId => trello.getCardById(cardId)));
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("trello.showCard", (textEditor, textEditorEdit, card) =>
      trello.showTrelloCard(card)
    )
  );
}

export function deactivate() {
  removeTempTrelloFile();
}
