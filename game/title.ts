import * as PIXI from 'pixi.js'
import sound from 'pixi-sound'
import * as State from './state'
import { GameState } from './game-state'

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
        // -40 is so mute button works
        this.container.hitArea = new PIXI.Rectangle(0, 0, width, height - 40)
        this.ariaCard = document.getElementById("ariaCard")!

        sound.add("title_sound", this.resources["title_sound"].sound)
        sound.add("startGame_sound", this.resources["startGame_sound"].sound)
    }

    titleSprite: PIXI.Sprite;
    getStartedText: PIXI.Text;
    ariaCard: HTMLElement;

    onLoop(delta: number): boolean {
        return true;
    }

    onStart(): void {
        this.onResume();
    }

    startGame(): void {
        let gameState = new GameState(this.app, this.resources);
        sound.play("startGame_sound");
        super.setState(gameState);
    }

    onResume(): void {
        this.ariaCard.textContent = "Click or tap to start";
        sound.play("title_sound");
    }

    static addResources(loader: PIXI.Loader):  void
    {
        loader.add("title_texture", "assets/Title.png");
        loader.add("title_sound", "assets/Title.mp3");
        loader.add("startGame_sound", "assets/StartGame.mp3");
    }
}
