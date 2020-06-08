import * as PIXI from 'pixi.js'
import { Title } from './title'

const app = new PIXI.Application({width: 720, height: 960, backgroundColor: 0xDDDDFF});

const sprites: { [key: string] : PIXI.Texture } = {};

document.body.appendChild(app.view);

const loader: PIXI.Loader = PIXI.Loader.shared;
loader.add("title_texture", "assets/Title.png");

let titleState: Title;

function start_loop(app: PIXI.Application, resources:  { [index: string]: PIXI.LoaderResource }) : void {
  titleState = new Title(app, resources);
  titleState.start();
  update();
}

function update() {
  titleState.loop();
  requestAnimationFrame(update);
}

const loading_text_style = new PIXI.TextStyle();
const loading_text_sprite = new PIXI.Text("Loadin'", loading_text_style);
loading_text_sprite.x = 100
loading_text_sprite.y = 50
app.stage.addChild(loading_text_sprite)

loader.load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
  loading_text_sprite.destroy()
  console.log("Resources loaded")
  start_loop(app, loader.resources)
})
