import { min, max } from './better-minmax'
import { randInt } from './better-rand'

export enum Suit {
    Heart = 0,
    Diamond,
    Spade,
    Club
};

export enum Rank {
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

export enum HandType {
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

export const enum GameEventType {
    Hand = 0,
    ScoreChange
}

export interface GameEvent {
    event: GameEventType;
    hand?: Hand;
}

export interface Hand {
    valid: Boolean;
    handType?: HandType;
    score?: number;
    newCards?: number;
}

export interface Card {
    suit: Suit;
    rank: Rank;
    newCard?: boolean;
}

export class Game {
    public static readonly TABLE_WIDTH = 6;
    public static readonly TABLE_HEIGHT = 8;

    StartGame(): void {
        // Lay cards
        this.cards = []
        for (let x = 0; x < Game.TABLE_WIDTH; ++x) {
            this.cards[x] = []
            for (let y = 0; y < Game.TABLE_HEIGHT; ++y) {
                this.cards[x][y] = { suit: randInt(0, 4), rank: randInt(0, 13), newCard: false }
            }
        }
    }

    ClaimHand(hand: { card: Card, x: number, y: number }[]): void {
        // TODO: Score hand
        let h = Game.GetHand(hand.map((i) => i.card));
        this._score += h.score!;

        hand.forEach((i) => this.cards[i.x][i.y] = null)

        // Clear new
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = (Game.TABLE_HEIGHT - 1); y >= 0; --y) {
                if (this.cards[x][y] != null)
                    this.cards[x][y]!.newCard = false
            }

        // Drop
        for (let x = 0; x < Game.TABLE_WIDTH; ++x)
            for (let y = (Game.TABLE_HEIGHT - 1); y >= 0; --y) {
                let checkY = y - 1;
                while (this.cards[x][y] == null && checkY >= 0) {
                    if (this.cards[x][checkY] != null) {
                        this.cards[x][y] = this.cards[x][checkY];
                        this.cards[x][checkY] = null;
                    }
                    checkY -= 1;
                }
            }

        // Add new cards
        for (let i = 0; i < h.newCards!; ++i) {
            // Get lowest row(s) (randomly choosing if multiple)
            let columns = [...Array(Game.TABLE_WIDTH).keys()]
            let columnCount: { x: number; count: number }[] = columns.map((x) => {
                let rows = [...Array(Game.TABLE_HEIGHT).keys()]
                return rows.filter(y => this.cards[x][y] != null).length
            }).map((count, x): { x: number; count: number } => { return { x: x, count: count }; })
            let lowestCount: number = min(columnCount.map((column: { x: number; count: number }) => column.count))
            let columnsAtLowest = columnCount.filter((column) => column.count == lowestCount).map((column) => column.x);
            let columnX = columnsAtLowest[randInt(0, columnsAtLowest.length)]
            let y = Game.TABLE_HEIGHT - lowestCount - 1;
            if (y >= 0) {
                this.cards[columnX][y] = {
                    suit: randInt(0, 4),
                    rank: randInt(0, 13),
                    newCard: true
                }
            }
        }

        this.OnGameEvent({ event: GameEventType.Hand, hand: h });
    }

    public cards: (Card | null)[][] = [];

    private static AdjustRankForAceAndIndex(rank: Rank) {
        return rank == 0 ? 15 : rank + 1;
    }

    static GetHand(cards: Card[]): Hand {
        if (cards.length != 5) {
            return { valid: false };
        }

        let isFlush = Game.IsFlush(cards);
        let isStraight = Game.IsStraight(cards);
        let highestRank = cards.map((i) => i.rank).sort((a, b) => {
            let a1 = a == 0 ? 14 : a;
            let b1 = b == 0 ? 14 : a;
            return a1 - b1;
        })[4]

        let hand = { valid: false }
        let qOfRank = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((rank) => cards.filter((card) => card.rank == rank).length)
        if (max(qOfRank) == 5) {
            let rank = (qOfRank.findIndex((i) => i == 4) + 1)
            rank = rank == 1 ? 15 : rank + 1;
            return {
                handType: HandType._5OfAKind,
                score: 250 + rank * 10,
                valid: true,
                newCards: 10
            }
        } else if (isFlush && isStraight && highestRank == Rank.A) {
            return {
                handType: HandType.RoyalFlush,
                score: 250,
                valid: true,
                newCards: 8
            };
        } else if (isFlush && isStraight) {
            return {
                handType: HandType.StraightFlush,
                score: 190 + (Game.AdjustRankForAceAndIndex(highestRank)) * 4,
                valid: true,
                newCards: 6
            };
        } else if (max(qOfRank) == 4) {
            let rank = (qOfRank.findIndex((i) => i == 4) + 1)
            rank = rank == 1 ? 15 : rank + 1;
            return {
                handType: HandType._4OfAKind,
                score: 100 + rank * 4,
                valid: true,
                newCards: 5
            };
        } else if ((max(qOfRank) == 3) && (min(qOfRank.filter((i) => i > 0))) == 2) {
            let rank = (qOfRank.findIndex((i) => i == 3))
            rank = Game.AdjustRankForAceAndIndex(rank)
            return {
                handType: HandType.FullHouse,
                score: 60 + rank * 3,
                valid: true,
                newCards: 4
            };
        } else if (isFlush) {
            return {
                handType: HandType.Flush,
                score: 70,
                valid: true,
                newCards: 3
            };
        } else if (isStraight) {
            let rank = Game.AdjustRankForAceAndIndex(highestRank);
            return {
                handType: HandType.Straight,
                score: 53 + rank,
                valid: true,
                newCards: 2
            };
        } else if (max(qOfRank) == 3) {
            let rank = (qOfRank.findIndex((i) => i == 3))
            rank = Game.AdjustRankForAceAndIndex(rank)
            return {
                handType: HandType._3OfAKind,
                score: 26 + rank * 2,
                valid: true,
                newCards: 1
            };
        } else if ((qOfRank.filter((i) => i == 2).length) == 2) {
            let rank = qOfRank.lastIndexOf(2)
            rank = Game.AdjustRankForAceAndIndex(rank)
            return {
                handType: HandType._2Pair,
                score: 2 * rank,
                valid: true,
                newCards: 0
            };
        } else if (max(qOfRank) == 2) {
            let rank = qOfRank.lastIndexOf(2)
            rank = Game.AdjustRankForAceAndIndex(rank)
            return {
                handType: HandType.Pair,
                score: rank,
                valid: true,
                newCards: 0
            };
        }
        return hand;
    }

    public OnGameEvent: { (event: GameEvent): void } = () => { };

    private static IsFlush(cards: Card[]): boolean {
        return cards[0].suit == cards[1].suit &&
            cards[0].suit == cards[2].suit &&
            cards[0].suit == cards[3].suit &&
            cards[0].suit == cards[4].suit;
    }

    private static IsStraight(cards: Card[]): boolean {
        let ranked = cards.sort((a, b) => a.rank - b.rank);
        // 2 cases - in order, or A 10 (for 10-J-Q-K-A flush)
        var lastRank = ranked[0].rank;
        for (let i = 1; i < 5; ++i) {
            if (!(((lastRank + 1) == ranked[i].rank) || ((lastRank == Rank.A) && (ranked[i].rank == Rank._10)))) {
                return false;
            }
            lastRank = ranked[i].rank;
        }
        return true;
    }

    private _score: number = 0;
    public get score(): number {
        return this._score;
    }
}
