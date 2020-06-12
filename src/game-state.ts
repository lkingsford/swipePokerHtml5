import { strict as assert } from 'assert'
import * as PIXI from 'pixi.js'
import { Game, Card, Suit } from './game'
import { State } from './state'
import { min, max } from './better-minmax'

const CARD_WIDTH = 60;
const CARD_HEIGHT = 48;
const HAND_WIDTH = 256;
const HAND_HEIGHT = 256;

interface Cell {
    backSprite?: PIXI.Sprite | null;
    suitSprite?: PIXI.Sprite;
    rankSprite?: PIXI.Sprite;
    card: Card | null;
    selected: Back;
    x: number;
    y: number;
}

const enum Back {
    Unavailable = 0,
    Available,
    Selected,
    Ready,
    Invalid,
    None
}

export class GameState extends State {
    constructor(app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        // Load style activity, so want it done during loading screen time
        if (GameState.rankTextures == undefined) {
            console.warn("getTextures should be called before Game is constructed");
        }
        this.updateScore();
    }

    getSelected(): Cell[] {
        let selected: Cell[] = []
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                let cell = this.cells[x][y]
                if (cell.selected == Back.Selected || cell.selected == Back.Ready) {
                    selected.push(cell)
                }
            }
        return selected
    }

    setAvailable(): void {
        let selected = this.getSelected();
        if (selected.length == 5) {
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let cell = this.cells[x][y]
                    if (cell.selected == Back.Available) {
                        this.setCellSelected(cell, Back.Unavailable);
                    }
                }
        } else if (selected.length == 0) {
            this.unselectAll();
        } else if (selected.length == 1) {
            // Clear all
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let cell = this.cells[x][y]
                    if (cell.selected == Back.Available) {
                        this.setCellSelected(cell, Back.Unavailable);
                    }
                }
            // Allow all surrounding cells
            let cell = selected[0]
            if (cell.x > 0)
                this.setCellSelected(this.cells[cell.x - 1][cell.y], Back.Available)
            if (cell.x < (Game.TABLE_WIDTH - 1))
                this.setCellSelected(this.cells[cell.x + 1][cell.y], Back.Available)
            if (cell.y > 0)
                this.setCellSelected(this.cells[cell.x][cell.y - 1], Back.Available)
            if (cell.y < (Game.TABLE_HEIGHT - 1))
                this.setCellSelected(this.cells[cell.x][cell.y + 1], Back.Available)
        } else if (selected.length > 1) {
            // Clear all
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let cell = this.cells[x][y]
                    if (cell.selected == Back.Available) {
                        this.setCellSelected(cell, Back.Unavailable);
                    }
                }
            // Surrounding vertical or horizontal cells
            if (selected[0].x == selected[1].x) {
                // Vertical
                let yMin = min(selected.map((i) => i.y));
                let yMax = max(selected.map((i) => i.y));
                if (yMin > 0)
                    this.setCellSelected(this.cells[selected[0].x][yMin - 1], Back.Available)
                if (yMax < (Game.TABLE_HEIGHT - 1))
                    this.setCellSelected(this.cells[selected[0].x][yMax + 1], Back.Available)
            } else {
                // Horizontal
                let xMin = min(selected.map((i) => i.x));
                let xMax = max(selected.map((i) => i.x));
                if (xMin > 0)
                    this.setCellSelected(this.cells[xMin - 1][selected[0].y], Back.Available)
                if (xMax < (Game.TABLE_WIDTH - 1))
                    this.setCellSelected(this.cells[xMax + 1][selected[0].y], Back.Available)
            }
        }
    }

    tapCell(cell: Cell): void {
        switch (cell.selected) {
            case Back.Available:
                {
                    this.setCellSelected(cell, Back.Selected);
                    let selected = this.getSelected();
                    this.setAvailable();
                    if (selected.length == 5) {
                        let cards = selected.filter((i) => (i.card != null))
                            .map((i) => i.card!)
                        let hasHand = Game.GetHand(cards) != null;
                        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                                let cell = this.cells[x][y]
                                if (cell.selected == Back.Selected)
                                    this.setCellSelected(cell, hasHand ? Back.Ready : Back.Invalid)
                            }
                    }
                }
                break;
            case Back.Selected:
                this.unselectAll();
                break;
            case Back.Invalid:
                this.unselectAll();
                break;
            case Back.Unavailable:
                this.unselectAll();
                break;
            case Back.Ready:
                {
                    let selected = this.getSelected()
                    this.game?.ClaimHand(selected.map((i) => { return { card: i.card!, x: i.x, y: i.y } }));
                    this.unselectAll();
                }
                break;
        }
    }

    setCellSelected(cell: Cell, value: Back): PIXI.Sprite | null {
        let x = cell.x;
        let y = cell.y;
        cell.selected = value;
        if (this.cells[x][y].backSprite)
            this.container.removeChild(cell.backSprite!);
        if (value != Back.None) {
            let backSprite = new PIXI.Sprite(GameState.backTextures[value]);
            backSprite.x = x * CARD_WIDTH;
            backSprite.y = y * CARD_HEIGHT;
            cell.backSprite = backSprite;
            backSprite.interactive = true;
            backSprite.on("pointerdown", () => this.tapCell(this.cells[x][y]))
            this.container.addChildAt(cell.backSprite, 0);
            return backSprite;
        }
        else {
            return null;
        }
    }

    unselectAll(): void {
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                let cell = this.cells[x][y]
                if (cell.card) {
                    this.setCellSelected(cell, Back.Available)
                } else {
                    this.setCellSelected(cell, Back.Invalid)
                }
            }
    }

    updateCells(): void {
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                let card = this.game?.cards[x][y]
                if (this.cells[x][y].card != card) {
                    if (this.cells[x][y].rankSprite)
                        this.container.removeChild(this.cells[x][y].rankSprite!);
                    if (this.cells[x][y].suitSprite)
                        this.container.removeChild(this.cells[x][y].suitSprite!);
                    let backSprite = this.setCellSelected(this.cells[x][y], Back.Available)
                    if (card) {
                        let suitSprite = new PIXI.Sprite(GameState.suitTextures[card?.suit!]);
                        let blackSuit = (card?.suit == Suit.Club || card?.suit == Suit.Spade);
                        let rankSprite = new PIXI.Sprite(GameState.rankTextures[card?.rank! + (blackSuit ? 0 : 13)]);
                        suitSprite.x = (x + 0.5) * CARD_WIDTH;
                        suitSprite.y = y * CARD_HEIGHT;
                        rankSprite.x = x * CARD_WIDTH;
                        rankSprite.y = y * CARD_HEIGHT;
                        this.container.addChild(rankSprite);
                        this.container.addChild(suitSprite);
                        this.cells[x][y] = {
                            card: card,
                            backSprite: backSprite,
                            suitSprite: suitSprite,
                            rankSprite: rankSprite,
                            selected: Back.Available,
                            x: x,
                            y: y
                        }
                    }
                    else {
                        this.cells[x][y] = {
                            card: card!,
                            selected: Back.Unavailable,
                            x: x,
                            y: y
                        }
                    }
                }
            }
    }

    lastScore: string = "-1";
    scoreText: PIXI.Text | null = null;
    updateScore(): void {
        let score = `${(this.game?.score ?? 0)}`;
        if (score == this.lastScore)
        {
            return;
        }
        if (this.scoreText != null)
        {
            this.container.removeChild(this.scoreText!);
        }
        this.scoreText = new PIXI.Text(`${score}`, {
            align: 'center',
            tint: 0xFF0000,
        });
        this.scoreText.x = 720 / 2 - this.scoreText.width;
        this.scoreText.y = 850;

        this.container.addChild(this.scoreText)
        this.lastScore = score;
    }

    onLoop(delta: number): boolean {
        // Render
        this.updateCells();
        this.updateScore();
        return true;
    }

    onStart(): void {
        this.startNewGame();
    }

    game: Game | null = null;

    startNewGame(): void {
        this.game = new Game();
        this.game.StartGame();
        this.cells = [];
        for (let x = 0; x < Game.TABLE_WIDTH; ++x) {
            this.cells[x] = []
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                this.cells[x][y] = { card: null, selected: Back.Unavailable, x: x, y: y }
            }
        }
    }

    cells: Cell[][] = [];

    static addResources(loader: PIXI.Loader) {
        loader.add("cards_texture", "assets/Cards.png");
        loader.add("hands_texture", "assets/Hands.png");
        loader.add("score_font", "assets/ScoreFont.fnt");
    }

    static rankTextures: { [index: number]: PIXI.Texture };
    static suitTextures: { [index: number]: PIXI.Texture };
    static backTextures: { [index: number]: PIXI.Texture };
    static handTextures: { [index: number]: PIXI.Texture };

    static getTextures(resources: { [index: string]: PIXI.LoaderResource }) {
        GameState.suitTextures = {};
        for (let i = 0; i < 4; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = i * width;
            let srcY = 0;
            GameState.suitTextures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }

        GameState.rankTextures = {};
        for (let i = 0; i < 26; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = (i % 13) * width;
            let srcY = (1 + Math.floor(i / 13)) * height;
            GameState.rankTextures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }

        GameState.backTextures = {};
        for (let i = 0; i < 5; i++) {
            let width = CARD_WIDTH;
            let height = CARD_HEIGHT;
            let srcX = (2 + i) * width;
            let srcY = 0;
            GameState.backTextures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }
    }
}