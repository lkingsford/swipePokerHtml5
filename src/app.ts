import * as PIXI from 'pixi.js'
import { Title } from './title'
import { Game } from './game'

const app = new PIXI.Application({ width: 720, height: 960, backgroundColor: 0xDDDDFF });

const sprites: { [key: string]: PIXI.Texture } = {};

document.body.appendChild(app.view);

/*
window.addEventListener("resize", resize)
window.addEventListener("mozfullscreenchange", ()=>{console.log("Mozfullscreenchange");})
window.addEventListener("fullscreenchange", ()=>{console.log("fullscreenchange");})
window.addEventListener("webkitfullscreenchange", ()=>{console.log("webkitfullscreenchange");})
window.addEventListener("msfullscreenchange", ()=>{console.log("msfullscreenchange");})

function resize(ev: Event) {
  let target = ev.target as Window
  console.log(target.innerWidth, target.outerWidth)
}
*/

const loader: PIXI.Loader = PIXI.Loader.shared;
Game.addResources(loader)
Title.addResources(loader)

let titleState: Title;

function start_loop(app: PIXI.Application, resources: { [index: string]: PIXI.LoaderResource }): void {
  titleState = new Title(app, resources);
  titleState.start();
  app.ticker.add((delta: number) => update(delta))
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

loader.load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
  loading_text_sprite.destroy()
  console.log("Resources loaded")
  Game.getTextures(loader.resources)
  start_loop(app, loader.resources)
})
