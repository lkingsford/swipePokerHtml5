import * as PIXI from 'pixi.js'
import * as State from './state'
import { Game } from './game'

export class Title extends State.State {
    constructor (app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        this.titleSprite = new PIXI.Sprite(resources['title_texture'].texture)
        let width = app.screen.width;
        let height = app.screen.height;
        this.titleSprite.x = (width - this.titleSprite.width) / 2;
        this.titleSprite.y = (height - this.titleSprite.height) / 2;
        this.container.addChild(this.titleSprite);
        this.getStartedText = new PIXI.Text("Deal 'em")
        this.getStartedText.x = (width - this.getStartedText.width) / 2;
        this.getStartedText.y = (this.titleSprite.y + this.titleSprite.height) + 30;
        this.container.addChild(this.getStartedText);
        this.container.interactive = true
        this.container.on("pointerdown", ()=>{this.startGame()});
        this.container.hitArea = new PIXI.Rectangle(0, 0, width, height)
    }

    titleSprite: PIXI.Sprite;
    getStartedText: PIXI.Text;

    onLoop(delta: number): boolean {
        return true;
    }

    startGame(): void {
        let gameState = new Game(this.app, this.resources);
        super.setState(gameState);
    }
}
