import * as Game from '../game/game';
import { expect } from 'chai';
import 'mocha';
var data_driven = require('data-driven')

describe('Game.GetHand', () => {
    it('should reject a hand of size 0 as invalid', () => {
        const result = Game.Game.GetHand([])
        expect(result.valid).to.equal(false);
    });
    it('should accept a hand of size 5 with a pair as valid', () => {
        const result = Game.Game.GetHand([{ rank: Game.Rank._10, suit: Game.Suit.Club },
        { rank: Game.Rank._10, suit: Game.Suit.Diamond },
        { rank: Game.Rank.A, suit: Game.Suit.Diamond },
        { rank: Game.Rank._9, suit: Game.Suit.Heart },
        { rank: Game.Rank._4, suit: Game.Suit.Club }]);
        expect(result.valid).to.equal(true);
    });
    data_driven([
        { name: "5 of a kind", expected: Game.HandType._5OfAKind, cards:
                [{ rank: Game.Rank._9, suit: Game.Suit.Club },
                { rank: Game.Rank._9, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Heart },
                { rank: Game.Rank._9, suit: Game.Suit.Club }]
        },
        { name: "Royal Flush", expected: Game.HandType.RoyalFlush, cards:
                [{ rank: Game.Rank._10, suit: Game.Suit.Club },
                { rank: Game.Rank.J, suit: Game.Suit.Club },
                { rank: Game.Rank.Q, suit: Game.Suit.Club },
                { rank: Game.Rank.K, suit: Game.Suit.Club },
                { rank: Game.Rank.A, suit: Game.Suit.Club }]
        },
        { name: "Straight Flush", expected: Game.HandType.StraightFlush, cards:
                [{ rank: Game.Rank._9, suit: Game.Suit.Club },
                { rank: Game.Rank._10, suit: Game.Suit.Club },
                { rank: Game.Rank.Q, suit: Game.Suit.Club },
                { rank: Game.Rank.K, suit: Game.Suit.Club },
                { rank: Game.Rank.J, suit: Game.Suit.Club }]
        },
        { name: "4 of a kind", expected: Game.HandType._4OfAKind, cards:
                [{ rank: Game.Rank._8, suit: Game.Suit.Club },
                { rank: Game.Rank._9, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Heart },
                { rank: Game.Rank._9, suit: Game.Suit.Club }]
        },
        { name: "Full house", expected: Game.HandType.FullHouse, cards:
                [{ rank: Game.Rank._8, suit: Game.Suit.Club },
                { rank: Game.Rank._8, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Heart },
                { rank: Game.Rank._9, suit: Game.Suit.Club }]
        },
        { name: "Flush", expected: Game.HandType.Flush, cards:
                [{ rank: Game.Rank._8, suit: Game.Suit.Diamond },
                { rank: Game.Rank._8, suit: Game.Suit.Diamond },
                { rank: Game.Rank._7, suit: Game.Suit.Diamond },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank._9, suit: Game.Suit.Diamond }]
        },
        { name: "Straight", expected: Game.HandType.Straight, cards:
                [{ rank: Game.Rank._8, suit: Game.Suit.Diamond },
                { rank: Game.Rank._7, suit: Game.Suit.Heart },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank._5, suit: Game.Suit.Diamond },
                { rank: Game.Rank._4, suit: Game.Suit.Diamond }]
        },
        { name: "3 of a kind", expected: Game.HandType._3OfAKind, cards:
                [{ rank: Game.Rank._8, suit: Game.Suit.Diamond },
                { rank: Game.Rank._2, suit: Game.Suit.Heart },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond }]
        },
        { name: "2 pair", expected: Game.HandType._2Pair, cards:
                [{ rank: Game.Rank._2, suit: Game.Suit.Diamond },
                { rank: Game.Rank._2, suit: Game.Suit.Heart },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank.A, suit: Game.Suit.Diamond }]
        },
        { name: "Pair", expected: Game.HandType.Pair, cards:
                [{ rank: Game.Rank._2, suit: Game.Suit.Diamond },
                { rank: Game.Rank._2, suit: Game.Suit.Heart },
                { rank: Game.Rank._6, suit: Game.Suit.Diamond },
                { rank: Game.Rank._7, suit: Game.Suit.Diamond },
                { rank: Game.Rank.A, suit: Game.Suit.Diamond }]
        }
    ], (ctx: any) => {
            it('should detect {name} correctly', (ctx: any) => {
                expect(Game.Game.GetHand(ctx.cards).handType).to.equal(ctx.expected);
            })
        })
})
