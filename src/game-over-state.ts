import * as PIXI from 'pixi.js'
import * as State from './state'
import { GameState } from './game-state'

export class GameOverState extends State.State {
    constructor(app: PIXI.Application,
                resources: { [index: string]: PIXI.LoaderResource },
                points: number) {
        super(app, resources);
        this.titleSprite = new PIXI.Sprite(resources['title_texture'].texture)
        let width = app.screen.width;
        let height = app.screen.height;
        this.titleSprite.x = (width - this.titleSprite.width) / 2;
        this.titleSprite.y = (height - this.titleSprite.height) / 2;
        this.container.addChild(this.titleSprite);
        this.scoreText = new PIXI.Text(`Game over. \n ${points} points.`, {align: 'center'});
        this.scoreText.x = (width - this.scoreText.width) / 2;
        this.scoreText.y = (this.titleSprite.y + this.titleSprite.height) + 30;
        this.container.addChild(this.scoreText);
        this.container.interactive = true
        this.container.on("pointerdown", () => { this.stillLooping = false; });
        this.container.hitArea = new PIXI.Rectangle(0, 0, width, height)
        this.ariaCard = document.getElementById("ariaCard")!
        this.ariaCard.textContent = `Game Over - ${points} points. Click to return to title.`;
    }

    stillLooping: boolean = true;
    titleSprite: PIXI.Sprite;
    scoreText: PIXI.Text;
    ariaCard: HTMLElement;

    onLoop(delta: number): boolean {
        return this.stillLooping;
    }
}

