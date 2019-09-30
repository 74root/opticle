import { Tree } from './Tree.js';
import { buchheim } from "./BRT.js";

class Camera{
    constructor(canvas){
        this._camera = new THREE.OrthographicCamera(-window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, 0.001, 1000);
        this._camera.position.set(0, 0, 1);


        this._controls = new THREE.OrbitControls( this._camera, canvas );
        this._controls.enableRotate = false;
        this._controls.screenSpacePanning = true;
        this._controls.mouseButtons = {
            LEFT: null,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.075;


        this.isModified = true;
    }
    /**
     * 指定したノードに移動する
     * @param {number} id 
     */
    focusOn(id){
        
    }
    /**
     * @param {number} x
     */
    set x(x){

    }
    get x(){

    }
    /**
     * @param {number} y
     */
    set y(y){

    }
    get y(){

    }
    /**
     * @param {number} ratio
     */
    set zoom(ratio){

    }
    get zoom(){

    }
    update(){

        this._controls.update();

        // 仮永続化
        // this.isModified = false;
    }
}


/**
 * 木を描画する為の情報を保持する
 */
export class Tonelico{
    /**
     * 
     * @param {Element} canvas キャンバス要素
     */
    constructor(canvas){

        // ダミー
        this.tree = new Tree();

        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x202020);

        const context = canvas.getContext( 'webgl2', {
             alpha: false,
        } );

        this._renderer = new THREE.WebGLRenderer({
            canvas,
            stencil: false,
            depth: false,
            antialias: true,
            context,
            setScissorTest: false,
            sortObjects: true,

        });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setScissor(-Infinity, -Infinity, Infinity, Infinity);


        this.camera = new Camera(this._renderer.domElement);

        // リサイズ処理
        const resize = () => {
            const w = window.innerWidth, h = window.innerHeight;
    
            this.camera._camera.left = window.innerWidth / - 2;
            this.camera._camera.right = window.innerWidth / 2;
            this.camera._camera.top = window.innerHeight / 2;
            this.camera._camera.bottom = window.innerHeight / - 2;
            this.camera._camera.updateProjectionMatrix();
    
            this._renderer.setSize(w, h);
        };
        window.addEventListener('resize', resize);
        resize();

    }
    /**
     * ツリーを受け取って頂点情報とか初期化
     * 絞り込みの場合にも使う
     * @param {Tree} tree 
     */
    async init(tree = this.tree){
        this.tree = tree;
        
        if(this.treeObject != null) this._scene.remove(this.treeObject);



        buchheim(tree.root);
        // const boudingbox = [Infinity, Infinity, -Infinity, -Infinity];
        // tree.foreachData(node => {
        //     boudingbox[0] = Math.min(boudingbox[0], node.tree.brtNode.y);
        //     boudingbox[2] = Math.max(boudingbox[2], node.tree.brtNode.y);
        //     boudingbox[1] = Math.min(boudingbox[1], node.tree.brtNode.x);
        //     boudingbox[3] = Math.max(boudingbox[3], node.tree.brtNode.x);
        // });
        tree.foreachData(node => {
            // scale tree
            node.tree.brtNode.x *= 5;
            node.tree.brtNode.y *= tree.maxTextLength * 2.5;

        });
        

        const edgeMaterial = new THREE.MeshBasicMaterial( { 
            color: 0xFFFFFF,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,

        } );

        const edgeOutMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            depthTest: false,
            depthWrite: false,
        });

        const textMaterial = new THREE.RawShaderMaterial({
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            uniforms: {
            },
            vertexShader: 
`#version 300 es
#define attribute in

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

in vec3 position;

void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
            fragmentShader:             
`#version 300 es
precision highp float;
out vec4 outColor;
void main(){
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`,       
        });
;
        const colorTable = new Uint8Array([
            0x20, 0x20, 0xFF,
            0xC0, 0x80, 0x20,
            0x20, 0xFF, 0x80,
            0x80, 0xFF, 0x20,
            0xFF, 0x80, 0x20,
            0xC0, 0x20, 0x80,
            0x60, 0x60, 0x60,
            0x20, 0x20, 0x20
        ]);
        // 2 * 4
        const colorMap = new THREE.DataTexture(
            colorTable,
            2, Math.pow(2, Math.ceil(Math.log2(colorTable.length / 6))), 
            THREE.RGBFormat, THREE.UnsignedByteType);
        colorMap.wrapS = THREE.RepeatWrapping;
        colorMap.wrapT = THREE.RepeatWrapping;
        colorMap.magFilter = THREE.NearestFilter;
        colorMap.minFilter = THREE.NearestFilter;
        colorMap.needsUpdate = true;
        
        const nodeMaterial = new THREE.RawShaderMaterial({
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                colorMap: { value: colorMap },
            },
            vertexShader: 
`#version 300 es
#define attribute in

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform sampler2D colorMap;

in vec3 position;
in vec3 nodeCoord;
in float xMorph;
in float nodeLength;
in float colorId;
out vec4 colorV;

void main(){

    vec3 pos = position;
    pos.x += xMorph * nodeLength;

    colorV = texture(colorMap, vec2(0.5, 0.125) * (colorId * 0.5) );

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + nodeCoord, 1.0);
}
`,
            fragmentShader:             
`#version 300 es
precision highp float;

in vec4 colorV;
out vec4 outColor;

void main(){
    outColor = vec4(colorV.rgb, 1.0);
}
`,       
        });


        const group = tree.dfsData(undefined, (node, value = []) => {

            if(node.tree.child.length === 0) return undefined;

            // console.log(value);

            const group = new THREE.Group();
            if(value.length > 0) group.add(...value);
            


            // edge-inner
            const edgeGeometry = new THREE.BufferGeometry();
            const edgePosAttribute = new THREE.BufferAttribute(Float32Array.from((function* gen() {
                yield node.tree.brtNode.y + node.view.textLength * 2 + 6; yield node.tree.brtNode.x; yield 0;
                for(let i = 0; i < node.tree.child.length; i++){
                    const child = node.tree.child[i];
                    yield child.tree.brtNode.y;
                    yield child.tree.brtNode.x - 0.5;
                    yield 0;
                    yield child.tree.brtNode.y;
                    yield child.tree.brtNode.x + 0.5;
                    yield 0;
                }
            })()), 3);
            edgeGeometry.addAttribute('position', edgePosAttribute);
            edgeGeometry.setIndex(new THREE.BufferAttribute(Uint32Array.from((function* gen() {
                for(let i = 1; i < node.tree.child.length + 1; i++){
                    yield 0; yield i * 2 - 1; yield i * 2;
                }
            })()), 1));

            const edgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
            
            // edge-outer
            const edgeOutGeometry = new THREE.BufferGeometry();
            edgeOutGeometry.addAttribute('position', edgePosAttribute);
            edgeOutGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array([
                1, 0, edgePosAttribute.count - 1
            ]), 1));

            const edgeOutMesh = new THREE.Line(edgeOutGeometry, edgeOutMaterial);


            // node
            const nodeGeometry = new THREE.InstancedBufferGeometry();
            const nodeCoordBA = new THREE.BufferAttribute(new Float32Array([
                -2, 2, 0,
                -2, -2, 0,
                2, 2, 0,
                -2, -2, 0,
                2, 2, 0,
                2, -2, 0
            ]), 3);
            nodeGeometry.addAttribute('position', nodeCoordBA);

            nodeGeometry.addAttribute('nodeCoord', new THREE.InstancedBufferAttribute(Float32Array.from((function* gen() {
                for(let i = 0; i < node.tree.child.length; i++){
                    yield node.tree.child[i].tree.brtNode.y;
                    yield node.tree.child[i].tree.brtNode.x;
                    yield 0;
                }
            })()), 3));

            nodeGeometry.addAttribute('xMorph', new THREE.BufferAttribute(new Float32Array([
                0, 0, 0, 1, 1, 1
            ]), 1));

            nodeGeometry.addAttribute('nodeLength', new THREE.InstancedBufferAttribute(Float32Array.from((function* gen() {
                for(let i = 0; i < node.tree.child.length; i++){
                    yield node.tree.child[i].view.textLength * 2 + 6;
                }
            })()), 1));

            nodeGeometry.addAttribute('colorId', new THREE.InstancedBufferAttribute(Float32Array.from((function* gen() {
                for(let i = 0; i < node.tree.child.length; i++){
                    yield node.tree.child[i].view.colorId;
                    // yield 3.0;
                }
            })()), 1));


            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            nodeMesh.frustumCulled = false;

            const nodebackGeometry = new THREE.InstancedBufferGeometry();
            nodebackGeometry.addAttribute('position', nodeCoordBA);
            nodebackGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array([
                0, 1, 4,
                1, 4, 5
            ]), 1));

            nodebackGeometry.addAttribute('nodeCoord', new THREE.InstancedBufferAttribute(Float32Array.from((function* gen() {
                for(let i = 0; i < node.tree.child.length; i++){
                    const child = node.tree.child[i];
                    yield child.tree.brtNode.y + child.view.textLength * 2 + 6;
                    yield child.tree.brtNode.x;
                    yield 0;
                }
            })()), 3));

            const nodeBackMesh = new THREE.Mesh(nodebackGeometry, nodeMaterial);
            nodeBackMesh.frustumCulled = false;


            
            group.add(edgeMesh);
            group.add(edgeOutMesh);
            // group.add(nodeBackMesh);
            group.add(nodeMesh);

            // text
            let indexBuffer = new Uint32Array(0x20000);
            let ibOffset = 0;
            let coordBuffer = new Float32Array(0x20001);
            let cbOffset = 0;
            
            for(let i = 0; i < node.tree.child.length; i++){
                const child = node.tree.child[i];

                // copy of text coordinates and its indices
                const coordTA = new Float32Array(child.view.coordTA);
                const indexTA = new Float32Array(child.view.indexTA);

                // apply translate
                for (let j = 0; j < coordTA.length / 3; j++) {
                    coordTA[j * 3 + 0] += child.tree.brtNode.y + 3;
                    coordTA[j * 3 + 1] += child.tree.brtNode.x - 1;
                }
                
                // geenrate mesh and regenerate buffer to evade overflow
                if(
                    cbOffset + coordTA.length >= 0x20000 ||
                    ibOffset + indexTA.length >= 0x20001
                ){
                    const coordBA = new THREE.BufferAttribute(coordBuffer.slice(0, cbOffset), 3);
                    const indexBA = new THREE.BufferAttribute(indexBuffer.slice(0, ibOffset), 1);

                    const textBG = new THREE.BufferGeometry();
                    textBG.addAttribute('position', coordBA);
                    textBG.setIndex(indexBA);
                    const textMesh = new THREE.Mesh( textBG, textMaterial );
                    group.add(textMesh);

                    indexBuffer = new Uint32Array(0x20000);
                    ibOffset = 0;
                    coordBuffer = new Float32Array(0x20001);
                    cbOffset = 0;
        
                }

                // marge coordinates and indices
                for (let j = 0; j < indexTA.length; j++) indexTA[j] += cbOffset / 3;
                coordBuffer.set(coordTA, cbOffset);
                indexBuffer.set(indexTA, ibOffset);
                cbOffset += coordTA.length;
                ibOffset += indexTA.length;

                if(i + 1 === node.tree.child.length){
                    const coordBA = new THREE.BufferAttribute(coordBuffer.slice(0, cbOffset), 3);
                    const indexBA = new THREE.BufferAttribute(indexBuffer.slice(0, ibOffset), 1);

                    const textBG = new THREE.BufferGeometry();
                    textBG.addAttribute('position', coordBA);
                    textBG.setIndex(indexBA);
                    const textMesh = new THREE.Mesh( textBG, textMaterial );
                    group.add(textMesh);
                }
        
            }


        
            return group;
        }, undefined, 'tree');

        this._scene.add(group);

        this.treeObject = group;

    
        const gridHelper = new THREE.GridHelper( 160, 10 );
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z -= 1;
        this._scene.add( gridHelper );
    
    }
    /**
     * キャンバス上の座標からその位置にノードがあればidを返す
     * @param {number} x 
     * @param {number} y 
     * @returns {number|null} id
     */
    collision(x, y){

        return null;
    }

    /**
     * ツリーやカメラに更新があれば色々反映する
     * 更新確認はクラス側でやらせても良いのかもしれない 
     */
    update(){
        if(this.tree.isModified){

            this.init(this.tree);
            this.tree.isModified = false;
        }
        if(this.camera.isModified) this.camera.update();

    }
    /**
     * 描画する
     */
    render(){
        this._renderer.render(this._scene, this.camera._camera);
    }
}

