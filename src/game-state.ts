import { strict as assert } from 'assert'
import * as PIXI from 'pixi.js'
import { Game, Card, Suit } from './game'
import { State } from './state'

const CARD_WIDTH = 60;
const CARD_HEIGHT = 48;
const HAND_WIDTH = 256;
const HAND_HEIGHT = 256;

interface cell {
    backSprite?: PIXI.Sprite;
    suitSprite?: PIXI.Sprite;
    rankSprite?: PIXI.Sprite;
    card: Card | null;
}

const enum Back {
    Unavailable = 0,
    Available,
    Selected,
    Ready,
    Invalid
}

export class GameState extends State {
    constructor(app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        // Load style activity, so want it done during loading screen time
        if (GameState.rankTextures == undefined) {
            console.warn("getTextures should be called before Game is constructed");
        }
    }

    updateCells(): void {
        for (let x = 0; x < Game.TABLE_WIDTH; ++x) 
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                let card = this.game?.cards[x][y]
                if (this.cells[x][y].card != card) {
                    if (this.cells[x][y].backSprite)
                        this.container.removeChild(this.cells[x][y].backSprite!);
                    if (this.cells[x][y].rankSprite)
                        this.container.removeChild(this.cells[x][y].rankSprite!);
                    if (this.cells[x][y].suitSprite)
                        this.container.removeChild(this.cells[x][y].suitSprite!);
                    if (card) {
                        let backSprite = new PIXI.Sprite(GameState.backTextures[Back.Available]);
                        let suitSprite = new PIXI.Sprite(GameState.suitTextures[card?.suit!]);
                        let blackSuit = (card?.suit == Suit.Club || card?.suit == Suit.Spade);
                        let rankSprite = new PIXI.Sprite(GameState.rankTextures[card?.rank! + (blackSuit ? 0 : 13)]);
                        backSprite.x = x * CARD_WIDTH;
                        backSprite.y = y * CARD_HEIGHT;
                        suitSprite.x = (x + 0.5) * CARD_WIDTH;
                        suitSprite.y = y * CARD_HEIGHT;
                        rankSprite.x = x * CARD_WIDTH;
                        rankSprite.y = y * CARD_HEIGHT;
                        this.container.addChild(backSprite);
                        this.container.addChild(rankSprite);
                        this.container.addChild(suitSprite);
                        this.cells[x][y] = {
                            card: card,
                            backSprite: backSprite,
                            suitSprite: suitSprite,
                            rankSprite: rankSprite
                        }
                    }
                    else
                    {
                        this.cells[x][y] = { card: card!}
                    }
                }
            }
        }

    onLoop(delta: number): boolean {
        // Render
        this.updateCells();
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
                this.cells[x][y] = {card: null}
            }
        }
    }

    cells: cell[][] = [];

    static addResources(loader: PIXI.Loader) {
        loader.add("cards_texture", "assets/Cards.png");
        loader.add("hands_texture", "assets/Hands.png");
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