import * as PIXI from 'pixi.js'
import sound from 'pixi-sound'
import * as State from './state'
import { GameState } from './game-state'
import { Card, Suit, Rank, Game } from './game'

export class HelpState extends State.State {
    constructor(app: PIXI.Application,
        resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        let width = app.screen.width;
        let height = app.screen.height;
        this.container.interactive = true
        this.container.on("pointerdown", () => { this.stillLooping = false; });
        this.container.hitArea = new PIXI.Rectangle(0, 0, width, height)
        this.ariaCard = document.getElementById("ariaCard")!
        this.ariaHand = document.getElementById("ariaHand")!
        this.addHands();

        let rulesTitleText = new PIXI.Text("Rules:");
        rulesTitleText.x = 10;
        rulesTitleText.y = 720;
        this.container.addChild(rulesTitleText);
        this.container.addChild(rulesTitleText);

        let rules = "In the classic game, you've got a " +
        "10×10 grid of cards. \n" +
        "You can select a valid poker hand with any cards that are adjacent " +
        "to each other. \n"
        "When you've selected a valid hand, you can tap or click it to get " +
        "points for it. \n" +
        "It is then removed from the board. \n" +
        "If the hand is better than a 3 of a Kind, you will get some more " +
        "cards. \n" +
        "Once you have no more valid hands, you must forfeit - and it is " +
        "game over.";

        let screenReaderAdditions = "You can resign by pushing R. You can " +
        "move the cursor with the arrow keys or W, A, S and D. You can " +
        "tap a card with the space bar, with E or with Enter.";
        this.ariaCard.textContent = rules + screenReaderAdditions;
        let rulesText = new PIXI.Text(rules, {fontSize: 14});
        rulesText.x = 10;
        rulesText.y = rulesTitleText.y + rulesTitleText.height + 3;
        this.container.addChild(rulesText);
        this.container.addChild(rulesText);
    }

    stillLooping: boolean = true;
    ariaCard: HTMLElement;
    ariaHand: HTMLElement;

    onStart() {
    }

    onLoop(delta: number): boolean {
        return this.stillLooping;
    }

    onKeyUp(event: KeyboardEvent): void {
        // Because sometimes loaded with ?
        if (event.key == "Shift") {
            return;
        }
        this.stillLooping = false;
    }

    addHands(): void {
        this.ariaHand.textContent = "";

        this.addHand(10, 60,
            [{ rank: Rank._9, suit: Suit.Club },
            { rank: Rank._9, suit: Suit.Diamond },
            { rank: Rank._9, suit: Suit.Diamond },
            { rank: Rank._9, suit: Suit.Heart },
            { rank: Rank._9, suit: Suit.Club }],
            "5 of a kind",
            "250 + Rank × 10")

        this.addHand(380, 60,
            [{ rank: Rank._10, suit: Suit.Club },
            { rank: Rank.J, suit: Suit.Club },
            { rank: Rank.Q, suit: Suit.Club },
            { rank: Rank.K, suit: Suit.Club },
            { rank: Rank.A, suit: Suit.Club }],
            "Royal Flush",
            "250")

        this.addHand(10, 190,
            [{ rank: Rank._9, suit: Suit.Club },
            { rank: Rank._10, suit: Suit.Club },
            { rank: Rank.Q, suit: Suit.Club },
            { rank: Rank.K, suit: Suit.Club },
            { rank: Rank.J, suit: Suit.Club }],
            "Straight Flush",
            "190 + Highest Rank × 4")

        this.addHand(380, 190, [{ rank: Rank._8, suit: Suit.Club },
        { rank: Rank._9, suit: Suit.Diamond },
        { rank: Rank._9, suit: Suit.Diamond },
        { rank: Rank._9, suit: Suit.Heart },
        { rank: Rank._9, suit: Suit.Club }],
            "Four of a Kind",
            "100 + Rank × 4")

        this.addHand(10, 320, [{ rank: Rank._8, suit: Suit.Club },
        { rank: Rank._8, suit: Suit.Diamond },
        { rank: Rank._9, suit: Suit.Diamond },
        { rank: Rank._9, suit: Suit.Heart },
        { rank: Rank._9, suit: Suit.Club }],
            "Full house",
            "60 + Biggest Rank × 3")

        this.addHand(380, 320, [{ rank: Rank._8, suit: Suit.Diamond },
        { rank: Rank._8, suit: Suit.Diamond },
        { rank: Rank._7, suit: Suit.Diamond },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank._9, suit: Suit.Diamond }],
            "Flush",
            "70")

        this.addHand(10, 450, [{ rank: Rank._8, suit: Suit.Diamond },
        { rank: Rank._7, suit: Suit.Heart },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank._5, suit: Suit.Diamond },
        { rank: Rank._4, suit: Suit.Diamond }],
            "Straight",
            "53 + Rank")

        this.addHand(380, 450, [{ rank: Rank._8, suit: Suit.Diamond },
        { rank: Rank._2, suit: Suit.Heart },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank._6, suit: Suit.Diamond }],
            "3 of a kind",
            "26 + Rank × 2")

        this.addHand(10, 580, [{ rank: Rank._2, suit: Suit.Diamond },
        { rank: Rank._2, suit: Suit.Heart },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank.A, suit: Suit.Diamond }],
            "2 pair",
            "Rank × 2")

        this.addHand(380, 580, [{ rank: Rank._2, suit: Suit.Diamond },
        { rank: Rank._2, suit: Suit.Heart },
        { rank: Rank._6, suit: Suit.Diamond },
        { rank: Rank._7, suit: Suit.Diamond },
        { rank: Rank.A, suit: Suit.Diamond }],
            "Pair",
            "Rank")

        let rankDescription = new PIXI.Text("Rank is worth the number for any number card, 11 for Jack, 12 for Queen, 13 for King and 15 for Ace",
            { fontSize: 14 });
        rankDescription.x = 10;
        rankDescription.y = 700;

        let validHandText = new PIXI.Text("Valid hands:");
        validHandText.x = 10;
        validHandText.y = 10;
        this.container.addChild(validHandText);
        this.container.addChild(validHandText);

    }

    static CARD_WIDTH = 60;
    static CARD_HEIGHT = 48;
    addHand(x: number, y: number, cards: Card[], description: string, scoringRules: string): void {48
        let descriptionText = new PIXI.Text(description);
        let scoringRulesText = new PIXI.Text(`Scores: ${scoringRules}`, { fontSize: 14 });
        let iy = y + descriptionText.height + 5;
        descriptionText.x = x;
        descriptionText.y = y;
        this.container.addChild(descriptionText);
        let exampleHandText = ""; // For screenreader
        for (let i: number = 0; i < 5; ++i) {
            let backSprite = new PIXI.Sprite(GameState.backTextures[1]);
            let ix = x + i * HelpState.CARD_WIDTH;
            backSprite.x = ix;
            backSprite.y = iy;
            backSprite.width = HelpState.CARD_WIDTH;
            backSprite.height = HelpState.CARD_HEIGHT;
            this.container.addChild(backSprite);
            let rankSprite = new PIXI.Sprite(GameState.rankTextures[cards[i].rank! + cards[i].suit! * 13]);
            rankSprite.x = ix;
            rankSprite.y = iy;
            rankSprite.width = HelpState.CARD_WIDTH / 2;
            rankSprite.height = HelpState.CARD_HEIGHT;
            this.container.addChild(rankSprite);
            let suitSprite = new PIXI.Sprite(GameState.suitTextures[cards[i].suit!]);
            suitSprite.x = ix + HelpState.CARD_WIDTH / 2;
            suitSprite.y = iy;
            suitSprite.width = HelpState.CARD_WIDTH / 2;
            suitSprite.height = HelpState.CARD_HEIGHT;
            this.container.addChild(suitSprite);

            exampleHandText += `${GameState.RANK_TEXT[cards[i].rank]} ${GameState.SUIT_TEXT[cards[i].suit]}`;
        }

        scoringRulesText.x = x;
        scoringRulesText.y = iy + HelpState.CARD_HEIGHT + 10;
        this.container.addChild(scoringRulesText);

        this.ariaHand.textContent += `${description} Example: ${exampleHandText} Scores ${scoringRules.replace('×', ' times ')}`;
    }

    static addResources(loader: PIXI.Loader): void {
        // Uses GameState resources
    }
}

