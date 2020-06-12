import { min, max } from './better-minmax'

export const enum Suit {
    Heart = 0,
    Diamond,
    Spade,
    Club
};

export const enum Rank {
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

export const enum HandType {
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

export interface Hand {
    valid: Boolean;
    handType?: HandType;
    score?: Number;
}

export interface Card {
    suit: Suit;
    rank: Rank;
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * max) + min;
}
export class Game {
    public static readonly TABLE_WIDTH = 8;
    public static readonly TABLE_HEIGHT = 8;

    StartGame(): void {
        // Lay cards
        this.cards = []
        for (let x = 0; x < Game.TABLE_WIDTH; ++x) {
            this.cards[x] = []
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                this.cards[x][y] = { suit: randInt(0, 4), rank: randInt(0, 13) }
            }
        }
    }

    ClaimHand(hand: { card: Card, x: number, y: number }[]): void {
        // TODO: Score hand
        this._score += 10;

        if (hand[0].x == hand[1].x) {
            // Vertical
            let x = hand[0].x
            let y0 = min(hand.map((i) => i.y))
            let y5 = max(hand.map((i) => i.y))
            for (let y = y0; y <= y5; ++y) {
                if (x < Game.TABLE_WIDTH / 2) {
                    // Left Side
                    for (let copyToX = x; copyToX > 0; --copyToX) {
                        this.cards[copyToX][y] = this.cards[copyToX - 1][y];
                    }
                    this.cards[0][y] = null;
                } else {
                    // Right side
                    for (let copyToX = x; copyToX < (Game.TABLE_WIDTH - 1); ++copyToX) {
                        this.cards[copyToX][y] = this.cards[copyToX + 1][y];
                    }
                    this.cards[Game.TABLE_WIDTH - 1][y] = null;
                }
            }
        } else {
            // Horizontal
            let y = hand[0].y
            let x0 = min(hand.map((i) => i.x))
            let x5 = max(hand.map((i) => i.x))
            for (let x = x0; x <= x5; ++x) {
                if (y < Game.TABLE_HEIGHT / 2) {
                    // Top Side
                    for (let copyToY = y; copyToY > 0; --copyToY) {
                        this.cards[x][copyToY] = this.cards[x][copyToY - 1]
                    }
                    this.cards[x][0] = null;
                } else {
                    // Bottom side
                    for (let copyToY = y; copyToY < (Game.TABLE_HEIGHT - 1); ++copyToY) {
                        this.cards[x][copyToY] = this.cards[x][copyToY + 1];
                    }
                    this.cards[x][Game.TABLE_HEIGHT - 1] = null;
                }
            }
        }

        // Replace cards
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                if (this.cards[x][y] == null)
                {
                    this.cards[x][y] = { rank: randInt(0, 13), suit: randInt(0, 4) };
                }
            }
    }

    public cards: (Card | null)[][] = [];

    static GetHand(cards: Card[]): Hand {
        if (cards.length != 5) {
            return { valid: false };
        }
        return { valid: true };
    }

    private _score: number = 0;
    public get score(): number {
        return this._score;
    }
}
