// VELVET VAULT — posed scenes for the screenshots (shots.json drives these).
// Each pose arranges the game's own actors on the real map and lets the
// normal renderer draw them: nothing here paints, it only places.

import { TILE } from './config.js';

function place(obj, tx, ty, facing) {
  obj.x = tx * TILE;
  obj.y = ty * TILE;
  if (facing !== undefined) obj.facing = facing;
}

function take(game, id) {
  const item = game.level.loot.find((l) => l.id === id);
  if (item) item.taken = true;
}

export function applyShot(game, name) {
  game.time = 2;
  const [gGallery, gCentral, gAtrium, gEast, gVault] = game.guards;
  const [camAtrium, camCentral, camVault] = game.cameras;

  if (name === 'title') {
    game.state = 'title';
    place(game.thief, 15.5, 13.5, -0.4);
    place(gCentral, 13.2, 11.8, 0.6);
    place(gAtrium, 17.5, 4.8, 1.9);
    camCentral.facing = Math.PI;
    game.alarm.level = 10;
    return;
  }

  game.state = 'playing';
  if (name === 'heist') {
    // The cover frame: the thief mid-crossing in the Central Hall, guards'
    // cones sweeping two rooms, the vault camera lit over the Star, the
    // alarm meter already warm.
    place(game.thief, 15.5, 13.5, -0.4);
    place(gCentral, 14.0, 11.8, 0.55);
    place(gAtrium, 17.5, 4.8, 1.9);
    place(gEast, 26.5, 12.5, -1.8);
    place(gVault, 26.5, 3.2, 2.6);
    camAtrium.facing = 1.85;
    camCentral.facing = Math.PI - 0.4;
    camVault.facing = 2.35;
    game.alarm.level = 26;
    game.elapsed = 74;
    take(game, 'painting-sun');
    game.lootTaken = 1;
    game.score = 200;
    game.coinFx.push({ x: 19.0 * TILE, y: 15.5 * TILE, t: game.time - 0.4 });
  } else if (name === 'alarm') {
    // Spotted in the Atrium: a guard shouts and closes in, the meter near the top.
    place(game.thief, 16.0, 5.2, 2.6);
    place(gAtrium, 14.7, 5.9, -0.35);
    gAtrium.mode = 'chase';
    gAtrium.suspicion = 1;
    place(gCentral, 15.0, 11.5, -1.2);
    place(gVault, 26.5, 3.2, 2.6);
    camAtrium.facing = 2.2;
    camCentral.facing = Math.PI - 0.4;
    camVault.facing = 2.35;
    game.alarm.level = 78;
    game.alarm.seenNow = true;
    game.elapsed = 132;
    take(game, 'painting-sun');
    take(game, 'vase-atrium');
    game.lootTaken = 2;
    game.score = 400;
  } else if (name === 'escape') {
    // The Star is in the bag and the foyer guard is staring at a coin:
    // nothing between the thief and the EXIT but two tiles of carpet.
    place(game.thief, 4.75, 18.55, Math.PI / 2);
    game.thief.hasStar = true;
    place(gGallery, 7.5, 17.5, 0.15);
    gGallery.mode = 'lured';
    place(gCentral, 15.0, 11.5, 2.8);
    place(gVault, 26.5, 3.2, 2.6);
    camVault.facing = 2.35;
    camCentral.facing = 0.4;
    game.alarm.level = 45;
    game.elapsed = 168;
    take(game, 'star');
    take(game, 'painting-sun');
    take(game, 'gold-central');
    take(game, 'vase-east');
    game.lootTaken = 4;
    game.score = 1600;
    game.coinsLeft = 2;
    game.coinFx.push({ x: 8.75 * TILE, y: 17.25 * TILE, t: game.time - 0.3 });
  }
}
