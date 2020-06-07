import * as PIXI from 'pixi.js'

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application();

const sprites: { [key: string] : PIXI.Sprite } = {};

document.body.appendChild(app.view);

const loader: PIXI.Loader = PIXI.Loader.shared;
loader.add("six", "assets/6.png");

function start_game() : void {
  app.stage.addChild(sprites['six'])
}

loader.load((loader: PIXI.Loader, resources: Partial<Record<string, PIXI.LoaderResource>>) => {
  console.log("Resources loaded")
  sprites['six'] = new PIXI.Sprite(resources.six?.texture);
  console.log("Sprites created")
  start_game()
})
