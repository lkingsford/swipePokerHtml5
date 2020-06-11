import * as Game from '../src/game';
import { expect } from 'chai';
import 'mocha';

describe('Game.GetHand', () => {
    it('should reject a hand of size 0 as invalid', () => {
        const result = Game.Game.GetHand([])
        expect(result.valid).to.equal(false);
    });
    it('should accept a hand of size 5 with a pair as valid', () => {
        const result = Game.Game.GetHand([{rank: Game.Rank._10, suit: Game.Suit.Club},
                                          {rank: Game.Rank._10, suit: Game.Suit.Diamond},
                                          {rank: Game.Rank.A, suit: Game.Suit.Diamond},
                                          {rank: Game.Rank._9, suit: Game.Suit.Heart},
                                          {rank: Game.Rank._4, suit: Game.Suit.Club}]);
        expect(result.valid).to.equal(true);
    });
});