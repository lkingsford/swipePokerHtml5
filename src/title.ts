import * as PIXI from 'pixi.js'
import * as State from './state'

export class Title extends State.State {
    constructor (app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        this.titleSprite = new PIXI.Sprite(resources['title_texture'].texture)
        this.container.addChild(this.titleSprite);
    }

    titleSprite: PIXI.Sprite;

    onLoop(): boolean {
        return true;
    }
}
