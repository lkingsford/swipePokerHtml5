import * as PIXI from 'pixi.js'
import sound from 'pixi-sound'
import { Title } from './title'
import { GameState } from './game-state'
import { GameOverState } from './game-over-state'

const app = new PIXI.Application({ width: 720, height: 960, backgroundColor: 0xDDDDFF });

const sprites: { [key: string]: PIXI.Texture } = {};

document.body.appendChild(app.view);

const loader: PIXI.Loader = PIXI.Loader.shared;
GameState.addResources(loader)
Title.addResources(loader)
GameOverState.addResources(loader)

let titleState: Title;

function start_loop(app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }): void {
  titleState = new Title(app, resources);
  titleState.start();
  app.ticker.add((delta: number) => update(delta / 60))
  app.ticker.start()
}

function update(delta: number) {
  titleState.loop(delta);
}

const loading_text_style = new PIXI.TextStyle();
const loading_text_sprite = new PIXI.Text("Loadin'", loading_text_style);
loading_text_sprite.x = 100
loading_text_sprite.y = 50
app.stage.addChild(loading_text_sprite)
sound.init();

loader.load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
  loading_text_sprite.destroy()
  console.log("Resources loaded")
  GameState.getTextures(loader.resources)
  start_loop(app, loader.resources)
})
