import { BLOCK_SIZE as S, WORLD_LIMIT, HEIGHT_LIMIT, isSolid } from '../world/blocks.js';

export const BODY_RADIUS = 0.23;
export const EYE_HEIGHT = 1.65;
const EPS = 0.0001;

export function collides(world, position, height = EYE_HEIGHT, radius = BODY_RADIUS) {
  const minX = Math.floor((position.x-radius+EPS)/S), maxX = Math.floor((position.x+radius-EPS)/S);
  const minY = Math.floor((position.y+EPS)/S), maxY = Math.floor((position.y+height-EPS)/S);
  const minZ = Math.floor((position.z-radius+EPS)/S), maxZ = Math.floor((position.z+radius-EPS)/S);
  for(let x=minX;x<=maxX;x++) for(let y=minY;y<=maxY;y++) for(let z=minZ;z<=maxZ;z++) {
    if(isSolid(world.get(x,y,z))) return true;
  }
  return false;
}

export function blockOverlapsBody(x,y,z,position,height=EYE_HEIGHT) {
  return (x+1)*S > position.x-BODY_RADIUS && x*S < position.x+BODY_RADIUS
    && (y+1)*S > position.y+EPS && y*S < position.y+height
    && (z+1)*S > position.z-BODY_RADIUS && z*S < position.z+BODY_RADIUS;
}

/** Swept movement split into small steps, with a single-block automatic step. */
export function moveBody(world, position, movement, height = EYE_HEIGHT, canStep = false) {
  const result = { x:false, y:false, z:false, stepped:false };
  const count = Math.max(1, Math.ceil(Math.max(Math.abs(movement.x),Math.abs(movement.y),Math.abs(movement.z))/0.15));
  const increment = { x:movement.x/count, y:movement.y/count, z:movement.z/count };
  for(let i=0;i<count;i++) {
    for(const axis of ['x','z','y']) {
      if (!increment[axis]) continue;
      const previous = position[axis];
      position[axis] += increment[axis];
      if(collides(world,position,height)) {
        if(axis !== 'y' && canStep && !result.stepped) {
          const py = position.y;
          position.y += S + 0.025;
          // Check both the old and new footprint for overhead clearance.
          const destinationClear = !collides(world,position,height);
          position[axis] = previous;
          const pathClear = !collides(world,position,height);
          position[axis] = previous + increment[axis];
          if(destinationClear && pathClear) { result.stepped=true; canStep=false; continue; }
          position.y = py;
        }
        position[axis] = previous;
        result[axis] = true;
      }
    }
  }
  const limit = (WORLD_LIMIT-2)*S;
  position.x = Math.max(-limit,Math.min(limit,position.x));
  position.z = Math.max(-limit,Math.min(limit,position.z));
  position.y = Math.min((HEIGHT_LIMIT-4)*S,position.y);
  return result;
}

export function safeHome(world, height = EYE_HEIGHT) {
  const home = { ...world.spawn };
  home.y = Math.max(home.y, world.surface(Math.floor(home.x/S),Math.floor(home.z/S))*S + 0.015);
  for(let i=0;i<32;i++) {
    if(!collides(world,home,height)) return home;
    home.y += S;
  }
  return { x:world.spawn.x, y:(HEIGHT_LIMIT-4)*S, z:world.spawn.z };
}
