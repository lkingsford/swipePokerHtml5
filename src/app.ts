import * as PIXI from 'pixi.js'
import sound from 'pixi-sound'
import { Title } from './title'
import { GameState } from './game-state'
import { GameOverState } from './game-over-state'

const app = new PIXI.Application({ width: 720, height: 960, backgroundColor: 0xDDDDFF });

const sprites: { [key: string]: PIXI.Texture } = {};

document.body.appendChild(app.view);
let ariaCard = document.getElementById("ariaCard")!
ariaCard.textContent = "Swipe Poker by Lachlan Kingsford. Loading."

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

let muteButtonSprite: PIXI.Sprite
let muteButtonOffTexture: PIXI.Texture
let muteButtonOnTexture: PIXI.Texture

function configureMuteButton(muted: boolean) {
  if (muteButtonSprite == undefined) {
    app.stage.removeChild(muteButtonSprite)
  }
  let texture = muted ? muteButtonOnTexture : muteButtonOffTexture;
  muteButtonSprite = new PIXI.Sprite(texture)
  muteButtonSprite.x = 660;
  muteButtonSprite.y = 921;
  muteButtonSprite.interactive = true;
  if (muted) {
    muteButtonSprite.on("pointertap", () => { sound.toggleMuteAll(); configureMuteButton(false); })
  }
  else {
    muteButtonSprite.on("pointertap", () => { sound.toggleMuteAll(); configureMuteButton(true); })
  }
  app.stage.addChild(muteButtonSprite);
}

loader.load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
  loading_text_sprite.destroy()
  console.log("Resources loaded")
  ariaCard.textContent = "Loaded.";
  GameState.getTextures(loader.resources)
  // This is in controls_texture - defined in game_state add resources
  muteButtonOffTexture = new PIXI.Texture(resources["controls_texture"]?.texture.baseTexture as PIXI.BaseTexture,
    new PIXI.Rectangle(11, 90, 40, 40));
  muteButtonOnTexture = new PIXI.Texture(resources["controls_texture"]?.texture.baseTexture as PIXI.BaseTexture,
    new PIXI.Rectangle(54, 90, 40, 40));
  configureMuteButton(false);

  start_loop(app, loader.resources)
})
