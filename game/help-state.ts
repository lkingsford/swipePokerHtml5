import * as PIXI from 'pixi.js'
import sound from 'pixi-sound'
import * as State from './state'
import { GameState } from './game-state'

export class HelpState extends State.State {
    constructor(app: PIXI.Application,
                resources: { [index: string]: PIXI.LoaderResource }) {
        super(app, resources);
        let width = app.screen.width;
        let height = app.screen.height;
        this.container.interactive = true
        this.container.on("pointerdown", () => { this.stillLooping = false; });
        this.container.hitArea = new PIXI.Rectangle(0, 0, width, height)
        this.ariaCard = document.getElementById("ariaCard")!
        sound.add("gameOver_sound", this.resources['gameOver_sound'].sound);
    }

    stillLooping: boolean = true;
    ariaCard: HTMLElement;

    onStart() {
        sound.play("gameOver_sound");
    }

    onLoop(delta: number): boolean {
        return this.stillLooping;
    }

    static addResources(loader: PIXI.Loader):  void
    {
        loader.add("gameOver_sound", "assets/GameOver.mp3");
    }
}

