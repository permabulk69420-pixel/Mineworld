import * as THREE from 'three';
import { BLOCK, BLOCK_SIZE as S } from './world/blocks.js';
import { hash } from './world/noise.js';

export class Environment {
  constructor(scene,world) {
    this.scene=scene;this.world=world;this.grassRevision=-1;
    scene.fog=new THREE.FogExp2(0xb5d2d3,0.0062);
    scene.add(new THREE.HemisphereLight(0xe1f1ff,0x6a7261,2.1));
    const sun=new THREE.DirectionalLight(0xffddb1,2.25);sun.position.set(-80,110,60);scene.add(sun);
    const sky=new THREE.Mesh(new THREE.SphereGeometry(500,24,16),new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,
      uniforms:{top:{value:new THREE.Color(0x315e84)},horizon:{value:new THREE.Color(0xcbded5)},low:{value:new THREE.Color(0x9dbfcb)}},
      vertexShader:'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform vec3 top;uniform vec3 horizon;uniform vec3 low;varying vec3 vDirection;
        void main(){vec3 d=normalize(vDirection);float h=d.y;vec3 color=mix(horizon,top,pow(max(0.,h),.65));
        color=mix(color,low,1.-smoothstep(-.6,0.,h));float glow=pow(max(0.,dot(d,normalize(vec3(-.65,.34,-.6)))),24.);
        color+=vec3(.22,.13,.035)*glow;gl_FragColor=vec4(color,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include'),
    }));scene.add(sky);this.sky=sky;
    const planet=new THREE.Mesh(new THREE.SphereGeometry(32,40,28),new THREE.MeshLambertMaterial({color:0xd9d4b8,fog:false}));
    planet.position.set(106,105,-205);scene.add(planet);
    const ring=new THREE.Mesh(new THREE.RingGeometry(41,57,80),new THREE.MeshBasicMaterial({color:0xf4e4c0,transparent:true,opacity:0.28,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    ring.position.copy(planet.position);ring.rotation.set(1.28,0.28,0.30);scene.add(ring);

    const clouds=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xf5f8ea,transparent:true,opacity:0.75,depthWrite:false}),96);
    const dummy=new THREE.Object3D();
    for(let i=0;i<96;i++){
      const cluster=Math.floor(i/3),j=i%3;
      const angle=hash(cluster,0,0,942)*Math.PI*2,radius=45+hash(cluster,2,0,71)*95;
      dummy.position.set(Math.cos(angle)*radius+j*3,2+hash(cluster,1,0,21)*10,Math.sin(angle)*radius);
      dummy.scale.set(9+hash(i,0,0,41)*14,1.4+hash(i,0,0,12)*2.2,5+hash(i,0,0,13)*9);
      dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix);
    }
    clouds.instanceMatrix.needsUpdate=true;scene.add(clouds);this.clouds=clouds;

    const positions=[];
    for(let i=0;i<90;i++)positions.push((hash(i,0,0,31)-.5)*43,26+hash(i,0,0,33)*10,(hash(i,0,0,35)-.5)*38);
    const motesGeometry=new THREE.BufferGeometry();motesGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    this.motes=new THREE.Points(motesGeometry,new THREE.PointsMaterial({color:0xe4ffc6,size:0.055,transparent:true,opacity:0.7,depthWrite:false}));scene.add(this.motes);
    const grassGeometry=new THREE.BufferGeometry();
    grassGeometry.setAttribute('position',new THREE.Float32BufferAttribute([
      -.12,0,0, .09,0,0, .01,.31,0, 0,0,-.1, 0,.25,.025, 0,0,.1,
      -.09,0,-.07, .07,0,.08, -.04,.2,.01,
    ],3));grassGeometry.computeVertexNormals();
    this.grass=new THREE.InstancedMesh(grassGeometry,new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide}),2200);
    this.grass.frustumCulled=false;scene.add(this.grass);this.updateGrass();
  }

  updateGrass(){
    if(this.grassRevision===this.world.revision)return;
    this.grassRevision=this.world.revision;
    const object=new THREE.Object3D(),color=new THREE.Color();let count=0;
    for(const {x,y,z} of this.world.surfaces){
      if(hash(x,y,z,782)<0.72 || this.world.get(x,y,z)!==BLOCK.GRASS || this.world.get(x,y+1,z)!==BLOCK.AIR)continue;
      object.position.set((x+.15+hash(x,y,z,991)*.7)*S,(y+1)*S,(z+.15+hash(x,y,z,92)*.7)*S);
      object.rotation.y=hash(x,0,z,13)*Math.PI;object.scale.setScalar(.65+hash(x,y,z,131)*.8);object.updateMatrix();
      this.grass.setMatrixAt(count,object.matrix);
      color.set(hash(x,y,z,642)>.92?0xf3d49d:hash(x,y,z,182)>.5?0x679954:0x8cb269);this.grass.setColorAt(count,color);
      if(++count===2200)break;
    }
    this.grass.count=count;this.grass.instanceMatrix.needsUpdate=true;if(this.grass.instanceColor)this.grass.instanceColor.needsUpdate=true;
  }

  update(time,camera){this.sky.position.copy(camera.position);this.clouds.position.x=Math.sin(time*.008)*4;this.motes.position.y=Math.sin(time*.3)*.18;this.updateGrass();}
}
