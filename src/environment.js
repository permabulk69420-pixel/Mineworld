import * as THREE from 'three';
import { BLOCK, BLOCK_SIZE as S } from './world/blocks.js';
import { hash } from './world/noise.js';
import { LAKE } from './world/generator.js';

function makeBladeGeometry(){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    -.09,0,0, .08,0,0, .015,1,0,
    0,0,-.065, 0,.82,.025, 0,0,.065,
  ],3));
  geometry.computeVertexNormals();return geometry;
}

function makeSailGeometry(){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    -1.25,0,0, -.25,.72,.12, 1.4,.12,0,
    -1.25,0,0, 1.4,.12,0, -.18,-.68,-.11,
  ],3));
  geometry.computeVertexNormals();return geometry;
}

function buildGroundVeil(world){
  const positions=[],colors=[],indices=[],vertexMap=new Map();
  const cornerHeight=(gx,gz)=>{
    let highest=0;
    for(const dx of [-1,0])for(const dz of [-1,0]){
      const sy=world.surface(gx+dx,gz+dz);if(sy<=0)continue;
      const id=world.get(gx+dx,sy-1,gz+dz);if(id===BLOCK.GRASS)highest=Math.max(highest,sy);
    }
    return highest;
  };
  const vertex=(gx,gz,h)=>{
    const key=`${gx},${gz},${h}`;if(vertexMap.has(key))return vertexMap.get(key);
    const i=positions.length/3,undulation=(hash(gx,h,gz,world.seed+717)-.5)*.025;
    positions.push(gx*S,h*S+.02+undulation,gz*S);
    const v=.88+hash(gx,h,gz,world.seed+720)*.16;
    colors.push(.36*v,.43*v,.20*v);vertexMap.set(key,i);return i;
  };
  for(const {x,y,z} of world.surfaces){
    if(world.get(x,y,z)!==BLOCK.GRASS)continue;
    const local=y+1;
    const h00=Math.max(local,cornerHeight(x,z)||local),h10=Math.max(local,cornerHeight(x+1,z)||local);
    const h11=Math.max(local,cornerHeight(x+1,z+1)||local),h01=Math.max(local,cornerHeight(x,z+1)||local);
    const a=vertex(x,z,h00),b=vertex(x+1,z,h10),c=vertex(x+1,z+1,h11),d=vertex(x,z+1,h01);
    indices.push(a,b,c,a,c,d);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
}

export class Environment {
  constructor(scene,world) {
    this.scene=scene;this.world=world;this.grassRevision=-1;
    scene.fog=new THREE.FogExp2(0xb9cbc3,0.0048);
    scene.add(new THREE.HemisphereLight(0xe8f2ee,0x5a6256,2.25));
    const sun=new THREE.DirectionalLight(0xffd9a6,2.45);sun.position.set(-90,125,55);scene.add(sun);

    const sky=new THREE.Mesh(new THREE.SphereGeometry(650,28,18),new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,
      uniforms:{top:{value:new THREE.Color(0x294f6d)},horizon:{value:new THREE.Color(0xd4d4b7)},low:{value:new THREE.Color(0x88aaa9)}},
      vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform vec3 top;uniform vec3 horizon;uniform vec3 low;varying vec3 vDirection;
        void main(){vec3 d=normalize(vDirection);float h=d.y;vec3 color=mix(horizon,top,pow(max(0.,h),.72));
        color=mix(color,low,1.-smoothstep(-.65,.02,h));float glow=pow(max(0.,dot(d,normalize(vec3(-.68,.30,-.56)))),28.);
        color+=vec3(.25,.13,.035)*glow;gl_FragColor=vec4(color,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include'),
    }));scene.add(sky);this.sky=sky;

    const planet=new THREE.Mesh(new THREE.SphereGeometry(36,40,28),new THREE.MeshLambertMaterial({color:0xd8cbb0,fog:false}));
    planet.position.set(155,122,-270);scene.add(planet);
    const ring=new THREE.Mesh(new THREE.RingGeometry(46,68,96),new THREE.MeshBasicMaterial({color:0xf4dfba,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    ring.position.copy(planet.position);ring.rotation.set(1.25,.24,.27);scene.add(ring);

    // Clouds are atmospheric silhouettes, not lit scene props. Unlit material prevents a
    // low/near ellipsoid from presenting its shadowed side as an enormous black polygon.
    this.clouds=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),new THREE.MeshBasicMaterial({color:0xf2f0df,transparent:true,opacity:.42,depthWrite:false,fog:true}),72);
    const dummy=new THREE.Object3D();
    for(let i=0;i<72;i++){
      const cluster=Math.floor(i/3),j=i%3,angle=hash(cluster,0,0,942)*Math.PI*2,radius=118+hash(cluster,2,0,71)*180;
      dummy.position.set(Math.cos(angle)*radius+(j-1)*8,58+hash(cluster,1,0,21)*34,Math.sin(angle)*radius);
      dummy.scale.set(14+hash(i,0,0,41)*24,2.5+hash(i,0,0,12)*4.8,9+hash(i,0,0,13)*18);
      dummy.rotation.y=hash(i,0,0,18)*Math.PI;dummy.updateMatrix();this.clouds.setMatrixAt(i,dummy.matrix);
    }
    this.clouds.instanceMatrix.needsUpdate=true;scene.add(this.clouds);

    const positions=[];
    for(let i=0;i<120;i++)positions.push((hash(i,0,0,31)-.5)*58,25+hash(i,0,0,33)*14,(hash(i,0,0,35)-.5)*52);
    const motesGeometry=new THREE.BufferGeometry();motesGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    this.motes=new THREE.Points(motesGeometry,new THREE.PointsMaterial({color:0xf0e7aa,size:.06,transparent:true,opacity:.55,depthWrite:false}));scene.add(this.motes);

    this.groundVeil=buildGroundVeil(world);scene.add(this.groundVeil);

    const bladeGeometry=makeBladeGeometry();
    this.grass=new THREE.InstancedMesh(bladeGeometry,new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}),3400);
    this.grass.frustumCulled=false;scene.add(this.grass);

    this.trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.10,.22,4.4,6,1),new THREE.MeshLambertMaterial({color:0x756451,flatShading:true}),210);
    this.sails=new THREE.InstancedMesh(makeSailGeometry(),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),520);
    this.trunks.frustumCulled=false;this.sails.frustumCulled=false;scene.add(this.trunks,this.sails);

    this.reeds=new THREE.InstancedMesh(bladeGeometry,new THREE.MeshLambertMaterial({color:0xb6a765,side:THREE.DoubleSide}),900);
    this.reeds.frustumCulled=false;scene.add(this.reeds);

    this.buildFlora();this.updateGrass();
  }

  buildFlora(){
    const trunk=new THREE.Object3D(),leaf=new THREE.Object3D(),reed=new THREE.Object3D(),leafColor=new THREE.Color();let ti=0,li=0,ri=0;
    for(const {x,y,z} of this.world.surfaces){
      const id=this.world.get(x,y,z);if(id!==BLOCK.GRASS)continue;
      const wx=(x+.5)*S,wz=(z+.5)*S,base=(y+1)*S,lake=Math.hypot((x-LAKE.x)/1.2,z-LAKE.z);
      const spawnDistance=Math.hypot(x-32,z-52);

      if(lake>21&&spawnDistance>11&&x%7===0&&z%7===0&&hash(x,0,z,this.world.seed+85)>.68&&ti<210){
        const height=.82+hash(x,y,z,this.world.seed+510)*.78,lean=.12+(hash(x,2,z,818)-.5)*.10,angle=-.55+(hash(x,3,z,819)-.5)*.34;
        trunk.position.set(wx+hash(x,4,z,821)*.35,base+2.2*height,wz+hash(x,5,z,823)*.35);
        trunk.scale.set(.8+height*.07,height,.8+height*.07);trunk.rotation.set(lean,angle,-.10);trunk.updateMatrix();this.trunks.setMatrixAt(ti++,trunk.matrix);
        const top=base+4.0*height,sailCount=2+Math.floor(hash(x,y,z,825)*2);
        for(let k=0;k<sailCount&&li<520;k++){
          const phase=angle+(k-(sailCount-1)/2)*.78;
          leaf.position.set(wx+Math.cos(phase)*(.18+k*.05),top-.15+k*.18,wz+Math.sin(phase)*(.18+k*.05));
          leaf.rotation.set((hash(x,k,z,831)-.5)*.18,phase,.54+(hash(x,k,z,833)-.5)*.28);
          const scale=(.72+hash(x,k,z,835)*.55)*height;leaf.scale.set(scale,.92+hash(x,k,z,837)*.22,scale);leaf.updateMatrix();this.sails.setMatrixAt(li,leaf.matrix);
          leafColor.set(hash(x,k,z,839)>.72?0xb59c67:hash(x,k,z,841)>.42?0x82966f:0x638474);this.sails.setColorAt(li,leafColor);li++;
        }
      }

      if(lake>14&&lake<22&&hash(x,y,z,444)>.48&&ri<900){
        reed.position.set(wx+(hash(x,y,z,445)-.5)*.5,base,wz+(hash(x,y,z,446)-.5)*.5);
        reed.rotation.y=hash(x,y,z,447)*Math.PI;reed.rotation.z=-.08+(hash(x,y,z,448)-.5)*.12;
        const h=.8+hash(x,y,z,449)*1.5;reed.scale.set(.65,h,.65);reed.updateMatrix();this.reeds.setMatrixAt(ri++,reed.matrix);
      }
    }
    this.trunks.count=ti;this.sails.count=li;this.reeds.count=ri;
    this.trunks.instanceMatrix.needsUpdate=true;this.sails.instanceMatrix.needsUpdate=true;this.reeds.instanceMatrix.needsUpdate=true;
    if(this.sails.instanceColor)this.sails.instanceColor.needsUpdate=true;
  }

  updateGrass(){
    if(this.grassRevision===this.world.revision)return;this.grassRevision=this.world.revision;
    const object=new THREE.Object3D(),color=new THREE.Color();let count=0;
    for(const {x,y,z} of this.world.surfaces){
      if(hash(x,y,z,782)<.58||this.world.get(x,y,z)!==BLOCK.GRASS||this.world.get(x,y+1,z)!==BLOCK.AIR)continue;
      object.position.set((x+.12+hash(x,y,z,991)*.76)*S,(y+1)*S+.03,(z+.12+hash(x,y,z,92)*.76)*S);
      object.rotation.y=hash(x,0,z,13)*Math.PI;object.rotation.z=-.07+(hash(x,y,z,19)-.5)*.16;object.scale.setScalar(.55+hash(x,y,z,131)*1.15);object.updateMatrix();
      this.grass.setMatrixAt(count,object.matrix);
      color.set(hash(x,y,z,642)>.91?0xd7bf77:hash(x,y,z,182)>.48?0x879665:0xabb07a);this.grass.setColorAt(count,color);
      if(++count===3400)break;
    }
    this.grass.count=count;this.grass.instanceMatrix.needsUpdate=true;if(this.grass.instanceColor)this.grass.instanceColor.needsUpdate=true;
  }

  update(time,camera){this.sky.position.copy(camera.position);this.clouds.position.x=Math.sin(time*.006)*8;this.motes.position.y=Math.sin(time*.3)*.18;this.updateGrass();}
}
