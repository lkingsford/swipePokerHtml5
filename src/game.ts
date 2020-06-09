import {strict as assert} from 'assert'
import * as PIXI from 'pixi.js'
import { State } from './state'
import { runInThisContext } from 'vm';

const enum Suit {
    Heart = 0,
    Diamond,
    Spade,
    Club
};

const enum Rank {
    A = 0,
    _2,
    _3,
    _4,
    _5,
    _6,
    _7,
    _8,
    _9,
    _10,
    J,
    Q,
    K
}

const enum Back {
    Unavailable = 0,
    Available,
    Selected,
    Ready,
    Invalid
}

const enum Hand {
    _5OfAKind = 0,
    RoyalFlush,
    StraightFlush,
    _4OfAKind,
    FullHouse,
    Flush,
    Straight,
    _3OfAKind,
    _2Pair,
    Pair
}

const CARD_WIDTH = 60;
const CARD_HEIGHT = 48;
const HAND_WIDTH = 256;
const HAND_HEIGHT = 256;

export class Game extends State {
    constructor (app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        // Load style activity, so want it done during loading screen time
        assert(Game.rank_textures != undefined, 'Textures must be loaded with Game.getTextures before constructing');
    }

    onLoop(delta: number): boolean {
        return true;
    }

    onStart(): void {
        this.startNewGame();
    }

    startNewGame(): void {

    }

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
        for (let i = 0; i < 4; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = i * width;
            let srcY = 0;
            this.suit_textures[i] = new PIXI.Texture(resources["cards_texture"].data as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }

        for (let i = 0; i < 26; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = (i % 13) * width;
            let srcY = (1 + Math.floor(i / 13)) * height;
            this.rank_textures[i] = new PIXI.Texture(resources["cards_texture"].data as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }

        for (let i = 0; i < 5; i++) {
            let width = CARD_WIDTH;
            let height = CARD_HEIGHT;
            let srcX = (2 + i) * width;
            let srcY = 0;
            this.back_textures[i] = new PIXI.Texture(resources["cards_texture"].data as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        }
    }
}