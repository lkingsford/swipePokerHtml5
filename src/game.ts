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

export class Game {
    static GetHand(cards: Card[]): Hand {
        if (cards.length != 5) {
            return {valid: false};
        }
        return {valid: true};
    }
}
