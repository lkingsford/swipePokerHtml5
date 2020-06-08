import { State } from './state'

export class Game extends State {
    constructor (app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
    }

    onLoop(delta: number): boolean {
        return true;
    }
}