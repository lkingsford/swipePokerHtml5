import { strict as assert } from 'assert'
import * as PIXI from 'pixi.js'
import { Hand, HandType, Game, Card, Suit, GameEvent, GameEventType } from './game'
import { State } from './state'
import { min, max } from './better-minmax'

const CARD_WIDTH = 60;
const CARD_HEIGHT = 48;
const CARD_LEEWAY = 10;
const HAND_WIDTH = 256;
const HAND_HEIGHT = 256;
const GAME_WIDTH = 720;
const GAME_HEIGHT = 960;

interface Cell {
    backSprite?: PIXI.Sprite | null;
    suitSprite?: PIXI.Sprite;
    rankSprite?: PIXI.Sprite;
    card: Card | null;
    selected: Back;
    x: number;
    y: number;
}

interface Animation {
    onLoop: { (delta: number): boolean };
}

const enum Back {
    Unavailable = 0,
    Available,
    Selected,
    Ready,
    Invalid,
    None,
    NewCard // Special - as sprite. Not to be set.
}

class HandAnimation implements Animation {
    // This is paired closer to GameState than I'd prefer

    constructor(container: PIXI.Container, hand: HandType) {
        this.sprite = new PIXI.Sprite(GameState.handTextures[hand]);
        this.sprite.anchor = new PIXI.Point(0.5, 0.5);
        this.sprite.x = GAME_WIDTH / 2;
        this.sprite.y = GAME_HEIGHT / 2;
        container.addChild(this.sprite);
        this.container = container;
        this.t = 0;
    }

    container: PIXI.Container;
    sprite: PIXI.Sprite;
    t: number;

    onLoop(delta: number): boolean {
        this.t += delta;
        let scale = this.t * 8;
        this.sprite.scale = new PIXI.Point(scale, scale)
        this.sprite.alpha = 1 - (this.t * .5)
        if (this.t > 4) {
            this.container.removeChild(this.sprite);
            return false;
        }
        return true;
    }
}

export class GameState extends State {
    constructor(app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        // Load style activity, so want it done during loading screen time
        if (GameState.rankTextures == undefined) {
            console.warn("getTextures should be called before Game is constructed");
        }
        this.playfield = new PIXI.Container();
        this.container.addChild(this.playfield);
        this.playfield.scale = new PIXI.Point(1.2, 1.2);
        this.playfield.x = 0;
        this.playfield.y = 20;
        this.updateScore();
    }

    playfield: PIXI.Container;

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
                        cell.selected = Back.Unavailable;
                    }
                }
        } else if (selected.length == 0) {
            this.unselectAll();
        } else if (selected.length == 1) {
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let cell = this.cells[x][y]
                    if (cell.selected == Back.Available) {
                        cell.selected = Back.Unavailable;
                    }
                }
            let selectedCell = selected[0]
            for (let ix = Math.max(selectedCell.x - 1, 0); ix <= Math.min(selectedCell.x + 1, Game.TABLE_WIDTH - 1); ++ix) {
                for (let iy = Math.max(selectedCell.y - 1, 0); iy <= Math.min(selectedCell.y + 1, Game.TABLE_HEIGHT - 1); ++iy) {
                    let cell = this.cells[ix][iy]
                    if (cell.selected == Back.Unavailable || cell.selected == Back.Available) {
                        cell.selected = Back.Available;
                    }
                }
            }
            selected.forEach((i) => {
                i.selected = Back.Selected;
            })
        } else {
            // Surrounding vertical or horizontal cells
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let cell = this.cells[x][y]
                    if (cell.selected == Back.Available) {
                        cell.selected = Back.Unavailable;
                    }
                }
            let yMin = min(selected.map((i) => i.y));
            let yMax = max(selected.map((i) => i.y));
            let xMin = min(selected.map((i) => i.x));
            let xMax = max(selected.map((i) => i.x));

            if (selected[0].x == selected[1].x) {
                // Vertical
                if (yMin > 0)
                    this.cells[selected[0].x][yMin - 1].selected = Back.Available;
                if (yMax < (Game.TABLE_HEIGHT - 1))
                    this.cells[selected[0].x][yMax + 1].selected = Back.Available;
            } else if (selected[0].y == selected[1].y) {
                // Horizontal
                if (xMin > 0)
                    this.cells[xMin - 1][selected[0].y].selected = Back.Available;
                if (xMax < (Game.TABLE_WIDTH - 1))
                    this.cells[xMax + 1][selected[0].y].selected = Back.Available;
            } else if ((selected[0].x - selected[1].x) != (selected[0].y - selected[1].y)) {
                // '/' direction
                if (xMin > 0 && yMax < (Game.TABLE_HEIGHT - 1))
                    this.cells[xMin - 1][yMax + 1].selected = Back.Available
                if (xMax < (Game.TABLE_WIDTH - 1) && (yMin > 0))
                    this.cells[xMax + 1][yMin - 1].selected = Back.Available
            } else {
                // '\' direction
                if (yMax < (Game.TABLE_HEIGHT - 1) && xMax < (Game.TABLE_WIDTH - 1))
                    this.cells[xMax + 1][yMax + 1].selected = Back.Available
                if (yMin > 0 && (xMin > 0))
                    this.cells[xMin - 1][yMin - 1].selected = Back.Available
            }

        }
    }


    tapCell(cell: Cell): void {
        switch (cell.selected) {
            case Back.Available:
                {
                    cell.selected = Back.Selected;
                    let selected = this.getSelected();
                    this.setAvailable();
                    if (selected.length == 5) {
                        let cards = selected.filter((i) => (i.card != null))
                            .map((i) => i.card!)
                        let hand = Game.GetHand(cards);
                        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                                let cell = this.cells[x][y]
                                if (cell.selected == Back.Selected)
                                    cell.selected = hand.valid ? Back.Ready : Back.Invalid
                                if (hand.valid) {
                                    this.updateProvisionalScore(`(${hand.score} - ${hand.newCards} new cards)`);
                                }
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
            case Back.None:
                this.unselectAll();
                break;
            case Back.Ready:
                {
                    let selected = this.getSelected()
                    this.game?.ClaimHand(selected.map((i) => { return { card: i.card!, x: i.x, y: i.y } }));
                    this.unselectAll();
                    this.updateScore();
                }
                break;
        }
        this.updateCells();
    }

    // event: any - because (time of writing) - types don't seem to be up to
    // date
    pointerMove(event: any, cell: Cell): boolean {
        if (cell.backSprite == null)
            return false;

        let localPosition = <PIXI.Point> event.data.getLocalPosition(cell.backSprite!)
        let mouseDown = event.data.buttons & 1;

        if (!mouseDown) return true;
        if (cell.selected != Back.Available) { return true; }

        let localBound = cell.backSprite?.getLocalBounds()
        let checkBox= new PIXI.Rectangle(localBound.x + CARD_LEEWAY,
                                         localBound.y + CARD_LEEWAY, 
                                         localBound.width - (CARD_LEEWAY * 2),
                                         localBound.height - (CARD_LEEWAY * 2))
        if (checkBox?.contains(localPosition.x, localPosition.y))
            this.tapCell(cell);
        return true;
    }

    setBackHitArea(drag: boolean) {
        // The why: We want to be able to swipe diagonally, which means that
        // we need to exclude the edges of the horizontal/vertical cards - as
        // nobody's finger will be pixel perfect
        if (drag) {
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let sprite = this.cells[x][y].backSprite;
                    if (sprite == null) { continue; }
                    sprite.hitArea = new PIXI.Rectangle(CARD_LEEWAY,
                        CARD_LEEWAY, CARD_WIDTH - CARD_LEEWAY,
                        CARD_HEIGHT - CARD_LEEWAY);
                }

        } else {
            for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                    let sprite = this.cells[x][y].backSprite;
                    if (sprite == null) { continue; }
                    sprite.hitArea = sprite.getLocalBounds()
                }
        }
    }

    getCellSelectedBacksprite(selectedState: Back, newCard: boolean, x: number, y: number): PIXI.Sprite {
        let backSprite: PIXI.Sprite;
        if (newCard && selectedState == Back.Available) {
            backSprite = new PIXI.Sprite(GameState.backTextures[Back.NewCard])
        } else {
            backSprite = new PIXI.Sprite(GameState.backTextures[selectedState]);
        }
        backSprite.x = x * CARD_WIDTH;
        backSprite.y = y * CARD_HEIGHT;
        backSprite.interactive = true;
        backSprite.on("pointertap", () => this.tapCell(this.cells[x][y]))
        backSprite.on("pointermove", (event: PIXI.interaction.InteractionData) => this.pointerMove(event, this.cells[x][y]))
        this.playfield.addChildAt(backSprite, 0);
        return backSprite;
    }

    unselectAll(): void {
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                let cell = this.cells[x][y]
                if (cell.card) {
                    cell.selected = Back.Available;
                } else {
                    cell.selected = Back.None;
                }
            }
    }

    updateCells(): void {
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                if (this.cells[x][y].rankSprite)
                    this.playfield.removeChild(this.cells[x][y].rankSprite!);
                if (this.cells[x][y].suitSprite)
                    this.playfield.removeChild(this.cells[x][y].suitSprite!);
                if (this.cells[x][y].backSprite)
                    this.playfield.removeChild(this.cells[x][y].backSprite!);
                let card = this.game!.cards[x][y]
                if (this.game!.cards[x][y] != null) {
                    let suitSprite = new PIXI.Sprite(GameState.suitTextures[card?.suit!]);
                    let blackSuit = (card?.suit == Suit.Club || card?.suit == Suit.Spade);
                    let rankSprite = new PIXI.Sprite(GameState.rankTextures[card?.rank! + (blackSuit ? 0 : 13)]);
                    suitSprite.x = (x + 0.5) * CARD_WIDTH;
                    suitSprite.y = y * CARD_HEIGHT;
                    rankSprite.x = x * CARD_WIDTH;
                    rankSprite.y = y * CARD_HEIGHT;
                    this.playfield.addChild(rankSprite);
                    this.playfield.addChild(suitSprite);
                    let selected = this.cells[x][y].selected;
                    if (selected == Back.None) {
                        selected = Back.Available;
                    }
                    let backSprite = this.getCellSelectedBacksprite(selected, card?.newCard ?? false, x, y)
                    this.cells[x][y] = {
                        card: card,
                        backSprite: backSprite,
                        suitSprite: suitSprite,
                        rankSprite: rankSprite,
                        selected: selected,
                        x: x,
                        y: y
                    }
                }
                else {
                    this.cells[x][y].selected = Back.None;
                    let backSprite = this.getCellSelectedBacksprite(Back.None, false, x, y)
                    this.cells[x][y] = {
                        card: card!,
                        selected: Back.None,
                        backSprite: backSprite,
                        x: x,
                        y: y
                    }
                }
            }
    }

    lastScore: string = "-1";
    scoreText: PIXI.Text | null = null;

    updateScore(): void {
        let score = `${(this.game?.score ?? 0)}`;
        if (score == this.lastScore) {
            return;
        }
        if (this.scoreText != null) {
            this.container.removeChild(this.scoreText!);
        }
        this.updateProvisionalScore(null)
        this.scoreText = new PIXI.Text(`${score}`, {
            align: 'left',
            tint: 0xFF0000,
        });
        this.scoreText.x = (720 - this.scoreText.width) / 2;
        this.scoreText.y = 850;

        this.container.addChild(this.scoreText)
        this.lastScore = score;
    }

    provisionalScoreText: PIXI.Text | null = null

    updateProvisionalScore(score: string | null): void {
        if (this.provisionalScoreText != null) {
            this.container.removeChild(this.provisionalScoreText)
        }
        if (score != null) {
            this.provisionalScoreText = new PIXI.Text(score!, {
                align: 'left'
            });
            this.provisionalScoreText.x = (720 - this.provisionalScoreText.width) / 2;
            this.provisionalScoreText.y = 800;
            this.container.addChild(this.provisionalScoreText)
        }
    }


    onLoop(delta: number): boolean {
        // Render
        let animations = this.animations;
        animations.forEach((i): void => {
            let stillRunning = i.onLoop(delta);
            if (!stillRunning) {
                this.animations.splice(this.animations.indexOf(i), 1);
            }
        })
        return true;
    }

    onStart(): void {
        this.startNewGame();
    }

    startNewGame(): void {
        this.game = new Game();
        this.game.StartGame();
        this.cells = [];
        for (let x = 0; x < Game.TABLE_WIDTH; ++x) {
            this.cells[x] = []
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                this.cells[x][y] = { card: null, selected: Back.Available, x: x, y: y }
            }
        }
        this.game.OnGameEvent = (i) => this.gameEvent(i);
        this.updateCells();
        this.updateScore();
        this.unselectAll();
    }

    gameEvent(event: GameEvent): void {
        switch (event.event) {
            case GameEventType.Hand:
                this.triggerHandAnimation(event.hand!)
                break;
        }
    }

    triggerHandAnimation(hand: Hand): void {
        let handAnimation = new HandAnimation(this.container, hand.handType!)
        this.animations.push(handAnimation)
    }

    animations: Animation[] = [];
    game: Game | null = null;
    cells: Cell[][] = [];

    static addResources(loader: PIXI.Loader) {
        loader.add("cards_texture", "assets/Cards.png");
        loader.add("hands_texture", "assets/Hands.png");
        loader.add("score_font", "assets/ScoreFont.fnt");
    }

    public static rankTextures: { [index: number]: PIXI.Texture };
    public static suitTextures: { [index: number]: PIXI.Texture };
    public static backTextures: { [index: number]: PIXI.Texture };
    public static handTextures: { [index: number]: PIXI.Texture };

    static getTextures(resources: { [index: string]: PIXI.LoaderResource }) {
        GameState.suitTextures = {};
        for (let i = 0; i < 4; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = i * width;
            let srcY = 0;
            GameState.suitTextures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        };

        GameState.rankTextures = {};
        for (let i = 0; i < 26; i++) {
            let width = CARD_WIDTH / 2;
            let height = CARD_HEIGHT;
            let srcX = (i % 13) * width;
            let srcY = (1 + Math.floor(i / 13)) * height;
            GameState.rankTextures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        };

        GameState.backTextures = {};
        for (let i = 0; i < 7; i++) {
            let width = CARD_WIDTH;
            let height = CARD_HEIGHT;
            let srcX = (2 + i) * width;
            let srcY = 0;
            GameState.backTextures[i] = new PIXI.Texture(resources["cards_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        };

        GameState.handTextures = {};
        for (let i = 0; i < 10; i++) {
            let width = HAND_WIDTH;
            let height = HAND_HEIGHT;
            let srcX = (i % 4) * width;
            let srcY = Math.floor(i / 4) * height;
            GameState.handTextures[i] = new PIXI.Texture(resources["hands_texture"].texture.baseTexture as PIXI.BaseTexture, new PIXI.Rectangle(srcX, srcY, width, height));
        };
    }
}