import * as vscode from "vscode";
import { writeFile, unlink } from "fs";
import axios from "axios";
import { UserDataFolder } from "./UserDataFolder";

const TEMP_TRELLO_FILE_NAME = "~vscodeTrello.md";
const TRELLO_API_BASE_URL = "https://api.trello.com";

export class TrelloComponent {
  private globalState: any;
  private API_KEY: string;
  private API_TOKEN: string;

  private selectedCard: any | undefined;

  constructor(context: vscode.ExtensionContext) {
    this.globalState = context.globalState;
    this.API_KEY = this.getTrelloKey();
    this.API_TOKEN = this.getTrelloToken();

    axios.defaults.baseURL = TRELLO_API_BASE_URL;
  }

  private getTrelloKey(): string {
    return this.globalState.get("TRELLO_API_KEY") || "";
  }

  private getTrelloToken(): string {
    return this.globalState.get("TRELLO_API_TOKEN") || "";
  }

  isCredentialsProvided(): boolean {
    return !!this.API_KEY && !!this.API_TOKEN;
  }

  getTrelloKeyToken(): void {
    this.API_KEY = this.getTrelloKey();
    this.API_TOKEN = this.getTrelloToken();
    vscode.window.showInformationMessage("Test", `Got API key: ${this.API_KEY}`, `API token: ${this.API_TOKEN}`);
  }

  setTrelloKey(): void {
    vscode.window
      .showInputBox({ ignoreFocusOut: true, password: false, placeHolder: "Your Trello API key" })
      .then(res => {
        this.API_KEY = res || "";
        this.globalState.update("TRELLO_API_KEY", res);
      });
  }

  setTrelloToken(): void {
    vscode.window
      .showInputBox({ ignoreFocusOut: true, password: true, placeHolder: "Your Trello API token" })
      .then(res => {
        this.API_TOKEN = res || "";
        this.globalState.update("TRELLO_API_TOKEN", res);
      });
  }

  async trelloApiRequest(url: string, key: string, token: string, filter?: string): Promise<any> {
    try {
      return await axios.get(url, {
        params: {
          filter,
          key,
          token
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  async getStarredBoards(): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    const boards = await this.trelloApiRequest("/1/members/me/boards", this.API_KEY, this.API_TOKEN, "starred");
    console.log("🅱 getting boards");
    // console.log(boards.data);
    return boards.data;
  }

  async getListsFromBoard(boardId: string): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    if (boardId === '-1') {
      vscode.window.showErrorMessage("Could not get Board ID");
      return;
    }

    const lists = await this.trelloApiRequest(`/1/boards/${boardId}/lists`, this.API_KEY, this.API_TOKEN);
    console.log("🅱 getting lists");
    // console.log(lists.data);
    return lists.data;
  }

  async getCardsFromList(listId: string): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    if (listId === '-1') {
      vscode.window.showErrorMessage("Could not get List ID");
      return;
    }

    const cards = await this.trelloApiRequest(`/1/lists/${listId}/cards`, this.API_KEY, this.API_TOKEN);
    console.log("🎴 getting cards");
    // console.log(cards.data);
    return cards.data;
  }

  async getCardById(cardId: string): Promise<any> {
    if (!this.isCredentialsProvided()) {
      vscode.window.showWarningMessage("Credentials Missing: please provide API key and token to use.");
      return;
    }

    if (cardId === '-1') {
      vscode.window.showErrorMessage("Could not get List ID");
      return;
    }

    const card = await this.trelloApiRequest(`/1/cards/${cardId}`, this.API_KEY, this.API_TOKEN);
    console.log("🎴 getting cards");
    this.selectedCard = card;
    console.log(card.data);
    return card.data;
  }

  async showTrelloCard(card: any): Promise<any> {
    // const card = await this.getCardById(cardId);
    if (!card) {
      vscode.window.showErrorMessage("No card selected or invalid card.");
      return;
    }
    // Get content of card as markdown
    const cardUrl = card.url || "## No url found ##";
    const cardHeader = card.name || "## No card name found ##";
    const cardBody = card.desc || "## No card description found ##";
    const cardContent =
      `${cardUrl}\n\n---\n` + `## TITLE:\n${cardHeader}\n\n---\n` + `## DESCRIPTION:\n${cardBody}\n\n---\n`;

    // Get location of user's vs code folder to save temp markdown file
    const userDataFolder = new UserDataFolder();
    const tempTrelloFile = userDataFolder.getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
    writeFile(tempTrelloFile, cardContent, err => {
      if (err) {
        vscode.window.showErrorMessage(`Error writing to temp file: ${err}`);
      }
      console.log(`✍Writing to file: ${tempTrelloFile}`);
    });

    // open markdown file and preview view
    vscode.workspace
      .openTextDocument(tempTrelloFile)
      .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside, false))
      .then(() => vscode.commands.executeCommand("markdown.showPreview"));
  }
}

export function removeTempTrelloFile() {
  const userDataFolder = new UserDataFolder();
  const tempTrelloFile = userDataFolder.getPathCodeSettings() + TEMP_TRELLO_FILE_NAME;
  unlink(tempTrelloFile, err => {
    if (err) throw err;
    console.log(`❌Deleted file: ${tempTrelloFile}`);
  });
}
