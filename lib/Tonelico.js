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
     * @param {Tree} tree 
     */
    async init(tree){

        
        if(this.treeObject != null) this._scene.remove(this.treeObject);

        const fontPromise = new Promise((r, e) => {
            const fl = new THREE.FontLoader();
            fl.load(
                '../font/Ricty-Diminished_Regular.json',
                r,
                undefined,
                e
            );
        });


        buchheim(tree.root);
        const font = await fontPromise;
        tree.foreachData(node => {

            // scale tree
            node.tree.brtNode.x *= 5;
            node.tree.brtNode.y *= 100;

            // init text vertex info
            const textShape = font.generateShapes(node.data.text, 2);
            const bg = new THREE.ShapeBufferGeometry(textShape, 2);
            node.view.coordTA = bg.attributes.position.array;
            node.view.indexTA = bg.index.array;
            let textLength = 0;
            for (let i = 0; i < node.data.text.length; i++) {
                textLength += font.data.glyphs[node.data.text[i]].ha;
            }
            textLength /= font.data.resolution;
            node.view.textLength = textLength;

        });
        

        const edgeMaterial = new THREE.MeshBasicMaterial( { 
            color: 0xFFFFFF,
            side: THREE.DoubleSide,

        } );

        const textMaterial = new THREE.RawShaderMaterial({
            side: THREE.DoubleSide,
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
    outColor = vec4(1.0, 0.9, 1.0, 1.0);
}
`,       
        });
;


        const nodeMaterial = new THREE.RawShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
            },
            vertexShader: 
`#version 300 es
#define attribute in

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

in vec3 position;
in vec3 nodeCoord;

void main(){

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + nodeCoord, 1.0);
}
`,
            fragmentShader:             
`#version 300 es
precision highp float;

out vec4 outColor;

void main(){
    outColor = vec4(1.0, 0.0, 1.0, 1.0);
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
                yield node.tree.brtNode.y; yield node.tree.brtNode.x; yield 0;
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
            group.add(edgeMesh);
            
            // edge-outer
            const edgeOutGeometry = new THREE.BufferGeometry();
            edgeOutGeometry.addAttribute('position', edgePosAttribute);
            edgeOutGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array([
                1, 0, edgePosAttribute.count - 1
            ]), 1));

            const edgeOutMesh = new THREE.Line(edgeOutGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
            group.add(edgeOutMesh);


            // node
            const nodeGeometry = new THREE.InstancedBufferGeometry();
            nodeGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
                0, 0, 0,
                10, -1, 0,
                10, 1, 0
            ]), 3));

            nodeGeometry.addAttribute('nodeCoord', new THREE.InstancedBufferAttribute(Float32Array.from((function* gen() {
                for(let i = 0; i < node.tree.child.length; i++){
                    yield node.tree.child[i].tree.brtNode.y;
                    yield node.tree.child[i].tree.brtNode.x;
                    yield 0;
                }
            })()), 3));

            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            nodeMesh.frustumCulled = false;
            group.add(nodeMesh);



            // text
            let textGeometry = null;
            let indexBuffer = new Uint32Array(0x20000);
            let ibOffset = 0;
            let coordBuffer = new Float32Array(0x20001);
            let cbOffset = 0;
            
            for(let i = 0; i < node.tree.child.length; i++){
                const child = node.tree.child[i];

                // copy of text coordinates and its indices
                const coordTA = new Float32Array(node.view.coordTA);
                const indexTA = new Float32Array(node.view.indexTA);

                // apply translate
                for (let j = 0; j < coordTA.length / 3; j++) {
                    coordTA[j * 3 + 0] += child.tree.brtNode.y;
                    coordTA[j * 3 + 1] += child.tree.brtNode.x;
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

    
        // // node
        // const nodeGeometry = new THREE.InstancedBufferGeometry();
        // nodeGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array([
        //     0, 0, 0,
        //     10, -1, 0,
        //     10, 1, 0
        // ]), 3));

        // const nodeCoordBuffer = new Float32Array(tree.data.length * 3);
        // tree.foreachData((node, i) => {

        //     nodeCoordBuffer[i * 3 + 0] = node.tree.brtNode.y;
        //     nodeCoordBuffer[i * 3 + 1] = node.tree.brtNode.x;
        // });

        // nodeGeometry.addAttribute('nodeCoord', new THREE.InstancedBufferAttribute(nodeCoordBuffer, 3));

        // const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        // this._scene.add(nodeMesh);



        

//         const sMaterial = new THREE.RawShaderMaterial( {
//             uniforms: {
//                 arai: { value: new Float32Array([0.00, 0.25, 0.50, 0.25]) }
//             },
//             vertexShader: 
// `#version 300 es
// #define attribute in

// uniform mat4 modelMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;

// uniform float arai[4];

// in vec3 position;
// in float colorID;
// out float ooo;

// void main(){

//     ooo = 0.0;

//     for(int i = 0; i < 4; i++){
//         ooo += arai[i];
//     }

//     // ooo = arai[int(colorID)];
//     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// }
// `,
//             fragmentShader:             
// `#version 300 es
// precision highp float;

// in float ooo;

// out vec4 outColor;

// void main(){
//     float r = 1.0 * ooo;
//     float g = 1.0 - r;
//     outColor = vec4(r, g, 0.0, 1.0);
// }
// `,        
//         } );

//         const material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );

//         const nodeGeometry = new THREE.BufferGeometry();
//         const nvPos = Float32Array.from((function* vpgen1() {
//             for(let i = 0; i < tree.data.length; i++){
//                 yield 0; yield 0 - i * 10; yield 0;
//                 yield 2; yield -1 - i * 10; yield 0;
//                 yield 2; yield 1 - i * 10; yield 0;
//             }
//         })());
    
//         nodeGeometry.addAttribute('position', new THREE.BufferAttribute(nvPos, 3));

//         nodeGeometry.addAttribute('colorID', new THREE.BufferAttribute(Float32Array.from((function* gen() {
//             let i = 0;
//             while(i < tree.data.length * 3) yield (i++ % 4);
//         })()), 1));
    
    
//         const nodeMesh = new THREE.Mesh( nodeGeometry, sMaterial );
//         this._scene.add(nodeMesh);
    
    
    
//         const edgeGeometry = new THREE.BufferGeometry();
//         const evPos = Float32Array.from((function* vpgen2() {
//             yield -1000;
//             yield (tree.data.length - 1) * -10 / 2;
//             yield 0;
//             for(let i = 0; i < tree.data.length; i++){
//                 yield 0; yield 0 - i * 10; yield 0;
//             }
//         })());
//         const evIndices = Float32Array.from((function* vpgen3() {
//             for(let i = 0; i < tree.data.length; i++){
//                 yield 0; yield 1 + i;
//             }
//         })());
    
//         edgeGeometry.addAttribute('position', new THREE.BufferAttribute(evPos, 3));
//         edgeGeometry.setIndex(new THREE.Uint16BufferAttribute(evIndices, 1));
    
//         const edgeMesh = new THREE.LineSegments( edgeGeometry, material );
//         this._scene.add(edgeMesh);
    
    
    
//         const font = await new Promise((r, e) => {
//             const fl = new THREE.FontLoader();
//             fl.load(
//                 '../font/Ricty-Diminished_Regular.json',
//                 r,
//                 undefined,
//                 e
//             );
//         });
    
//         let textGeometry = null;
        
//         for(let i = 0; i < tree.data.length; i++){
    
//             const text = `${tree.data[i].data.value.subEvt} ${tree.data[i].data.value.psPath || ''}`
//             const textShape = font.generateShapes(text, 4);
//             const bgAppend = new THREE.ShapeBufferGeometry(textShape , 2 );
//             bgAppend.translate(5, -2 - i * 10, 0);
    
//             if(textGeometry !== null){
//                 textGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
//                     [textGeometry, bgAppend]
//                     );
//             }
//             else{
//                 textGeometry = bgAppend;
//             }
    
//             if(textGeometry.attributes.position.array.length > 0x20000 || i + 1 == tree.data.length){
//                 console.log(`generating text vertices... progress: ${i * 100 / tree.data.length} %`);
//                 const textMesh = new THREE.Mesh( textGeometry, material );
//                 this._scene.add(textMesh);
//                 textGeometry = null;
//             }
//         }
    
        // console.log(`text bg vertices: ${textGeometry.attributes.position.array.length}`);
    
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
        if(this.tree.isModified);
        if(this.camera.isModified) this.camera.update();

    }
    /**
     * 描画する
     */
    render(){
        this._renderer.render(this._scene, this.camera._camera);
    }
}

