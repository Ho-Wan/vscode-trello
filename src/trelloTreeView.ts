import * as vscode from "vscode";
import { TrelloComponent } from "./trelloUtils";

export class TrelloTreeView implements vscode.TreeDataProvider<TrelloItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TrelloItem | undefined> = new vscode.EventEmitter<
    TrelloItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TrelloItem | undefined> = this._onDidChangeTreeData.event;

  private trello: TrelloComponent;
	private trelloBoards: Array<object>;
	private trelloLists: Array<object>;
  private onFirstLoad: boolean;

  constructor(trello: TrelloComponent) {
    this.trello = trello;
    this.trelloBoards = [];
    this.trelloLists = [];
    this.onFirstLoad = true;
  }

  refresh(): void {
    console.log("🕐 refreshing");
    this.trello.getStarredBoards().then(boards => {
      this.trelloBoards = boards;
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: TrelloItem): vscode.TreeItem {
    console.log("🌲 getting tree item");
    // console.log(element);
    return element;
  }

  getChildren(element?: TrelloItem): Thenable<TrelloItem[]> {
    console.log("👶 getting children");
    // console.log(element);
    if (!element) {
      if (this.trelloBoards === undefined || this.trelloBoards.length == 0) {
				console.log("🤔 this.trelloBoards is null");
				// fetch boards from trello api on first load
        if (this.onFirstLoad) {
          this.onFirstLoad = false;
          this.refresh();
        }
        return Promise.resolve([]);
			}
			// add boards to tree view
      const boards = this.trelloBoards.map((board: any) => {
				// console.log(board);
        return new TrelloItem(board.name, vscode.TreeItemCollapsibleState.Collapsed, board.id, {
					command: "trello.test",
          title: ""
        });
      });
      console.log("😃 got boards for children");
      // console.log(boards);
      return Promise.resolve(boards);
		}
		// Boards exists
		if (!this.trelloLists || this.trelloLists.length === 0) {
			// if no list, then get lists for selected board
			console.log("🔷 getting lists");
			this.trello.getListsFromBoard(element.id).then(lists => {
				this.trelloLists = lists;
				this._onDidChangeTreeData.fire();
			});
		} else {
			// show list
			const lists = this.trelloLists.map((list: any) => {
				// console.log(list);
        return new TrelloItem(list.name, vscode.TreeItemCollapsibleState.Collapsed, list.id);
			});
      console.log("😃 got lists for children");
      return Promise.resolve(lists);
		}
    console.log("☹ no children");
    return Promise.resolve([]);
  }
}

export class TrelloItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly id: string | '-1',
		public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState);
  }

  contextValue = "trelloItem";
}
