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
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
        {
            this.cards[x] = []
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y)
            {
                this.cards[x][y] = {suit: randInt(0, 4), rank: randInt(0, 13)}
            }
        }
    }

    public cards: (Card | null)[][] = [];

    static GetHand(cards: Card[]): Hand {
        if (cards.length != 5) {
            return {valid: false};
        }
        return {valid: true};
    }
}
