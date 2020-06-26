import * as PIXI from 'pixi.js'
import sound from 'pixi-sound'
import { Hand, HandType, Game, Card, Suit, GameEvent, GameEventType, Rank } from './game'
import { State } from './state'
import { GameOverState } from './game-over-state'
import { HelpState } from './help-state'
import { min, max } from './better-minmax'
import { randInt } from './better-rand'

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

enum Back {
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
        this.ariaCard = document.getElementById("ariaCard")!
        this.ariaHand = document.getElementById("ariaHand")!
        this.ariaScore = document.getElementById("ariaScore")!
        this.ariaNewCards = document.getElementById("ariaNewCards")!
        this.updateScore();

        this.resignButton = new PIXI.Sprite(GameState.controlsTextures[0]);
        this.resignButton.x = 0;
        this.resignButton.y = 920;
        this.resignButton.interactive = true;
        this.resignButton.on("pointertap", () => this.gameOver());
        this.resignButton.on("pointerover", () => this.ariaCard.textContent = "Resign")
        this.container.addChild(this.resignButton);

        this.helpButton = new PIXI.Sprite(GameState.controlsTextures[2]);
        this.helpButton.x = 180;
        this.helpButton.y = 920;
        this.helpButton.interactive = true;
        this.helpButton.on("pointertap", () => this.showHelp());
        this.helpButton.on("pointerover", () => this.ariaCard.textContent = "Help")
        this.container.addChild(this.helpButton);
    }

    gameOverState: GameOverState | null = null;
    helpState: HelpState | null = null;
    playfield: PIXI.Container;
    ariaCard: HTMLElement;
    ariaScore: HTMLElement;
    ariaHand: HTMLElement;
    ariaNewCards: HTMLElement;

    resignButton: PIXI.Sprite;
    helpButton: PIXI.Sprite;

    // These are used for screenreaders
    static RANK_TEXT: { [rank: number]: string } = {
        0: 'Ace',
        1: '2',
        2: '3',
        3: '4',
        4: '5',
        5: '6',
        6: '7',
        7: '8',
        8: '9',
        9: '10',
        10: 'Jack',
        11: 'Queen',
        12: 'King',
    }

    static SUIT_TEXT: { [suit: number]: string } = {
        0: 'Heart',
        1: 'Diamond',
        2: 'Spades',
        3: 'Club',
    }

    static SELECTED_TEXT: { [selected: number]: string } = {
        0: "Can't add to hand",
        1: "Available",
        2: "In hand",
        3: "Part of valid hand",
        4: "Part of invalid hand",
        5: "No card",
        6: "New card"
    }

    static HAND_TEXT: { [hand: number]: string } = {
        0: '5 Of A Kind',
        1: 'Royal Flush',
        2: 'Straight Flush',
        3: '4 Of A Kind',
        4: 'FullHouse',
        5: 'Flush',
        6: 'Straight',
        7: '3 Of A Kind',
        8: '2 Pair',
        9: 'Pair'
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

    playBadHandSound(): void {
        let idx = randInt(1, 2)
        console.log(idx)
        GameState.badHandsSound?.play(idx.toString())
    }

    playClaimHandSound(): void {
        let idx = randInt(1, 2)
        console.log(idx)
        GameState.goodHandsSound?.play(idx.toString())
    }

    playSelectedSound(): void {
        let idx = randInt(1, 8)
        GameState.selectSound?.play(idx.toString())
    }

    static selectSound: sound.Sound | null = null;
    static badHandsSound: sound.Sound | null = null;
    static goodHandsSound: sound.Sound | null = null;

    tapCell(cell: Cell): void {
        switch (cell.selected) {
            case Back.Available:
                {
                    cell.selected = Back.Selected;
                    let selected = this.getSelected();
                    let selectedCardAriaText = selected.map((i) => GameState.getCellAriaText(i))
                        .join(', ')
                    this.ariaCard.textContent = `Cards selected are ${selectedCardAriaText}`
                    this.setAvailable();
                    if (selected.length == 5) {
                        let cards = selected.filter((i) => (i.card != null))
                            .map((i) => i.card!)
                        let hand = Game.GetHand(cards);
                        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                                let cell = this.cells[x][y]
                                if (cell.selected == Back.Selected) {
                                    cell.selected = hand.valid ? Back.Ready : Back.Invalid
                                }

                            }
                        if (hand.valid) {
                            this.updateProvisionalScore(hand.score, hand.newCards);
                            this.playSelectedSound();
                        } else {
                            this.ariaCard.textContent = "Invalid hand"
                            this.playBadHandSound();
                        }
                    } else {
                        this.playSelectedSound();
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
                    this.playClaimHandSound();
                    let newCardsText = "";
                    for (let x = 0; x < Game.TABLE_WIDTH; ++x)
                        for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                            let card = this.game?.cards[x][y]
                            if (card?.newCard ?? false) {
                                newCardsText += `${GameState.RANK_TEXT[card!.rank]} ${GameState.SUIT_TEXT[card!.suit]}`;
                                newCardsText += ` in x ${cell.x + 1} y ${cell.y + 1} `
                            }
                        }
                    if (newCardsText != "") {
                        this.ariaNewCards.textContent = `New cards are ${newCardsText}`;
                    }
                    this.unselectAll();
                    this.updateScore();
                }
                break;
        }
        this.updateCells();
    }

    static getCellAriaText(cell: Cell): string {
        let cardText = ""
        let cardState = ""
        if (cell.card == null) {
            cardText = "Empty"
        }
        else {
            if (cell.selected != 1) {
                cardState = this.SELECTED_TEXT[cell.selected]
            }
            cardText = `${this.RANK_TEXT[cell.card.rank]} ${this.SUIT_TEXT[cell.card.suit]}`;
        }
        return `${cardState} ${cardText} in x ${cell.x + 1} y ${cell.y + 1}`
    }

    // event: any - because (time of writing) - types don't seem to be up to
    // date
    pointerMove(event: any, cell: Cell): boolean {
        if (cell.backSprite == null)
            return false;

        let localPosition = <PIXI.Point>event.data.getLocalPosition(cell.backSprite!)
        let mouseDown = event.data.buttons & 1;

        let localBound = cell.backSprite?.getLocalBounds()
        if (localBound.contains(localPosition.x, localPosition.y))
            this.ariaCard.textContent = GameState.getCellAriaText(cell);

        if (cell.selected != Back.Available) { return true; }

        let checkBox = new PIXI.Rectangle(localBound.x + CARD_LEEWAY,
            localBound.y + CARD_LEEWAY,
            localBound.width - (CARD_LEEWAY * 2),
            localBound.height - (CARD_LEEWAY * 2))
        if (!mouseDown) return true;
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
        backSprite.on("pointermove", (event: PIXI.InteractionData) => this.pointerMove(event, this.cells[x][y]))
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
        this.ariaCard.textContent = "All cards unselected";
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
                    let rankSprite = new PIXI.Sprite(GameState.rankTextures[card?.rank! + card?.suit! * 13]);
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

        this.ariaScore.textContent = `Score is ${score}`;
    }

    provisionalScoreText: PIXI.Text | null = null

    updateProvisionalScore(score: number | null = null, newCards: number | null = null): void {
        if (this.provisionalScoreText != null) {
            this.container.removeChild(this.provisionalScoreText)
        }
        if (score != null) {
            let provText = `(${score} - ${newCards} new cards)`;
            this.provisionalScoreText = new PIXI.Text(provText, {
                align: 'left'
            });
            this.provisionalScoreText.x = (720 - this.provisionalScoreText.width) / 2;
            this.provisionalScoreText.y = 800;
            this.container.addChild(this.provisionalScoreText)
            this.ariaCard.textContent = `This hand will score ${score} with ${newCards} new cards`;
        }
    }


    onLoop(delta: number): boolean {
        if (this.gameOverState != null) {
            return this.gameOverState!.loop(delta);
        }
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
                this.ariaHand.textContent = GameState.HAND_TEXT[event.hand!.handType!];
                this.triggerHandAnimation(event.hand!)
                break;
        }
    }

    triggerHandAnimation(hand: Hand): void {
        let handAnimation = new HandAnimation(this.container, hand.handType!)
        this.animations.push(handAnimation)
    }

    gameOver(): void {
        this.gameOverState = new GameOverState(this.app, this.resources, this.game!.score);
        super.setState(this.gameOverState, true);
    }

    showHelp(): void {
        this.helpState = new HelpState(this.app, this.resources);
        super.setState(this.helpState, false)
    }

    animations: Animation[] = [];
    game: Game | null = null;
    cells: Cell[][] = [];

    static addResources(loader: PIXI.Loader) {
        loader.add("cards_texture", "assets/Cards.png");
        loader.add("hands_texture", "assets/Hands.png");
        loader.add("score_font", "assets/ScoreFont.fnt");
        loader.add("controls_texture", "assets/Controls.png");
        loader.add("goodHands_sound", "assets/GoodHands.mp3");
        loader.add("badHands_sound", "assets/BadHands.mp3");
        loader.add("select_sound", "assets/Select.mp3");
    }

    public static rankTextures: { [index: number]: PIXI.Texture };
    public static suitTextures: { [index: number]: PIXI.Texture };
    public static backTextures: { [index: number]: PIXI.Texture };
    public static handTextures: { [index: number]: PIXI.Texture };
    public static controlsTextures: { [index: number]: PIXI.Texture };

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
        for (let i = 0; i < 52; i++) {
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

        GameState.controlsTextures = {};
        GameState.controlsTextures[0] = new PIXI.Texture(resources["controls_texture"].texture.baseTexture as PIXI.BaseTexture,
            new PIXI.Rectangle(0, 0, 160, 40));
        GameState.controlsTextures[1] = new PIXI.Texture(resources["controls_texture"].texture.baseTexture as PIXI.BaseTexture,
            new PIXI.Rectangle(0, 40, 160, 40));
        GameState.controlsTextures[2] = new PIXI.Texture(resources["controls_texture"].texture.baseTexture as PIXI.BaseTexture,
            new PIXI.Rectangle(0, 120, 160, 40));

        let goodHandsSound = resources["goodHands_sound"].sound;
        goodHandsSound.addSprites({
            "1": { start: 0, end: 3.9 },
            "2": { start: 3.95, end: 7.152 }
        })
        GameState.goodHandsSound = goodHandsSound;
        let badHandsSound = resources["badHands_sound"].sound;
        badHandsSound.addSprites({
            "1": { start: 0.07, end: 3.143 },
            "2": { start: 3.506, end: 7.628 }
        })

        GameState.badHandsSound = badHandsSound;
        let selectSound = resources["select_sound"].sound;
        selectSound.addSprites({
            "1": { start: 0.015, end: 0.374 },
            "2": { start: 0.424, end: 0.636 },
            "3": { start: 0.792, end: 1.146 },
            "4": { start: 1.376, end: 1.681 },
            "5": { start: 1.808, end: 2.125 },
            "6": { start: 2.299, end: 2.479 },
            "7": { start: 2.644, end: 2.754 },
            "8": { start: 3.077, end: 3.355 }
        })
        GameState.selectSound = selectSound;
    }
}