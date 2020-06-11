import {strict as assert} from 'assert'
import * as PIXI from 'pixi.js'
import { State } from './state'

const CARD_WIDTH = 60;
const CARD_HEIGHT = 48;
const HAND_WIDTH = 256;
const HAND_HEIGHT = 256;
const TABLE_WIDTH = 8;
const TABLE_HEIGHT = 8;

interface cell {
    backSprite: PIXI.Sprite;
    suitSprite: PIXI.Sprite;
    rankSprite: PIXI.Sprite;
}

const enum Back {
    Unavailable = 0,
    Available,
    Selected,
    Ready,
    Invalid
}

export class GameState extends State {
    constructor (app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        // Load style activity, so want it done during loading screen time
        if (GameState.rank_textures != undefined)
        {
             console.warn("getTextures should be called before Game is constructed");
        }
    }

    onLoop(delta: number): boolean {
        return true;
    }

    onStart(): void {
        this.startNewGame();
    }

    startNewGame(): void {
        this.cells = [];
        for (let x = 0; x < TABLE_WIDTH; ++x)
        {
            this.cells[x] = []
            for (let y = 0; y < TABLE_HEIGHT; ++y)
            {
                this.cells[x][y] = {
                    backSprite: new PIXI.Sprite(GameState.back_textures[Back.Available]),
                    suitSprite: new PIXI.Sprite(GameState.suit_textures[Suit.Diamond]),
                    rankSprite: new PIXI.Sprite(GameState.rank_textures[Rank._10])
                }
                let backSprite = this.cells[x][y].backSprite;
                let suitSprite = this.cells[x][y].suitSprite;
                let rankSprite = this.cells[x][y].rankSprite;
                backSprite.x = x * CARD_WIDTH;
                backSprite.y = y * CARD_HEIGHT;
                suitSprite.x = (x + 0.5) * CARD_WIDTH;
                suitSprite.y = y * CARD_HEIGHT;
                rankSprite.x = x * CARD_WIDTH;
                rankSprite.y = y * CARD_HEIGHT;
                this.container.addChild(backSprite);
                this.container.addChild(rankSprite);
                this.container.addChild(suitSprite);
            }
        }
    }

    cells: cell[][] = [];

    static addResources(loader: PIXI.Loader) {
        loader.add("cards_texture", "assets/Cards.png");
        loader.add("hands_texture", "assets/Hands.png");
    }

    static rank_textures: {[index: number]: PIXI.Texture};
    static suit_textures: {[index: number]: PIXI.Texture};
    static back_textures: {[index: number]: PIXI.Texture};
    static hand_textures: {[index: number]: PIXI.Texture};
    static getTextures(resources: { [index: string] : PIXI.LoaderResource })
    {
        GameState.suit_textures = {};
        for (let i = 0; i < 4; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = i * width;
            let srcY = 0;
            GameState.suit_textures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }

        GameState.rank_textures = {};
        for (let i = 0; i < 26; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = (i % 13) * width;
            let srcY = (1 + Math.floor(i / 13)) * height;
            GameState.rank_textures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }

        GameState.back_textures = {};
        for (let i = 0; i < 5; i++) {
            let width = CARD_WIDTH;
            let height = CARD_HEIGHT;
            let srcX = (2 + i) * width;
            let srcY = 0;
            GameState.back_textures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }
    }
}