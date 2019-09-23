//console.log(log);
function extract(){
    let key = document.getElementById("key").value;
    let text = document.getElementById("text").value;
    //console.log(key);
    //console.log(text);
    extract_tree(key, text);
}

function extract_tree(key,text){
    if(!tmp_logArray){
        alert("Please Select a log file First!");
        return;
    }
    if(!text){
        alert("Please input a text");
        return;
    }
    // pull down
    let new_logArray = [tmp_logArray[0]];
    let new_ID_dict = {};
    if(key=="all"){
        for(let i=0;i<tmp_logArray.length;i++){
            for(let j=0;j<keys.length;j++){
                if(tmp_logArray[i] && tmp_logArray[i][keys[j]] && tmp_logArray[i][keys[j]].indexOf(text) != -1){
                    new_logArray.push(tmp_logArray[i]);
                    new_ID_dict[tmp_logArray[i]["psGUID"]] = i;
                }
            }
        }
    }else{
        for(let i=0;i<tmp_logArray.length;i++){
            if(tmp_logArray[i] && tmp_logArray[i][key] && tmp_logArray[i][key].indexOf(text) != -1){
                new_logArray.push(tmp_logArray[i]);
                new_ID_dict[tmp_logArray[i]["psGUID"]] = i;
            }
            //for(let j = 0;j<keys.length;j++){}
        }
    }
    Draw_log(new_logArray,new_ID_dict,false);
} 

function FileSelect(e) {
    console.log('--- GET START ---')

    let file = e.target.files[0]; // FileList object
    console.log(file);
    let reader = new FileReader();
    reader.readAsText(file);
    //ファイルの中身を取得後に処理を行う
    reader.addEventListener( 'load', function() {
        //ファイルの中身をtextarea内に表示する
        log = reader.result;
        init(log);
    })
}

let log;
let tmp_logArray;
let tmp_ID_dict;
const keys = ["acTime","arc","cerSN","com","company","copyright","crTime","csid","domain","evt","fileDesc","fileVer","ip","issuer","loc","lv","mac","md5","moTime","os","parentGUID","product","profile","psDomain","psGUID","psUser","sessionID","sha1","sha256","sig","signer","size","sn","subevt","tmid","type","usr","usrDomain","validFrom","validTo"];
document.getElementById('file').addEventListener('change', FileSelect, false);
document.getElementById('btn').onclick = extract;

//create pull down
let key_element = document.getElementById("key");
let option_element;
for(let i=0;i<keys.length;i++){
    option_element = document.createElement("option");
    option_element.setAttribute("value",keys[i]);
    option_element.innerText = keys[i];
    key_element.appendChild(option_element);
}

function CreateLogArray(log){
    /**
     * キーは空白を含まない
     * 値は""で囲めば空白を含む事が出来る
     * キーと値が=で結ばれた形式でない限り無視される
     * patternの正規表現で指定されている
     */
    //console.log(log)
    let ID_dict = {}
    let logArray = (() => {
        // 行毎に分割
        const logLines = log.split('\n');
        const logKeys = new Array(logLines.length+1);
        logKeys.unshift({"Children":[]});
        for (let i = 0; i < logLines.length; i++) {
            // 空白行は飛ばす
            if (logLines[i].trim().length === 0) {
                logKeys.length--;
                continue;
            }
            // 行の文字列からキーと値のセットを抜き出せるだけ抜き出してobjのプロパティに格納
            const obj = {};
            let target;
            const pattern = /([^\s"=]*)=(?:\"([^"]*)\"|([^"=\s]*))/g;
            while ((target = pattern.exec(logLines[i])) !== null) {
                // console.log(target);
                // キーと値がキャプチャ出来ていれば, 記録
                const isUndef = [target[2] === undefined, target[3] === undefined];
                if (!isUndef[0] ^ isUndef[1]) continue;
                obj[target[1]] = target[2];
                if (isUndef[0]) obj[target[1]] = target[3];
            }
            obj[0] = logLines[i];
            obj["Children"] = [];
            logKeys[i+1] = obj;
            ID_dict[logKeys[i+1]["psGUID"]] = i+1;
        }
        return logKeys;
    })();
    //console.log(ID_dict);
    //console.log(logArray);
    return {logArray,ID_dict};
}

function init(log){
    console.log('--- PARSE START ---');
    const times = [0, 0];
    times[0] = performance.now();
    //CreateLogArray(log);
    let {logArray, ID_dict} = CreateLogArray(log);
    //logArray = tmp_logArray;
    //ID_dict = tmp_ID_dict;
    times[1] = performance.now();
    console.log(times[1] - times[0]);
    Draw_log(logArray,ID_dict,true);
}

async function Draw_log(logArray,ID_dict,flag) {
    if(flag){
        tmp_logArray = logArray.concat();
        tmp_ID_dict = ID_dict;
    }

    // global-util
    const pixelRatio = window.devicePixelRatio;

    // カメラ関連じゃないパラメータ
    const sys = {
    };

    // global
    const screen = document.getElementById('screen');
    const renderer = new THREE.WebGLRenderer({
        canvas: screen,
        stencil: false,
        depth: true,
        antialias: true,
    });
    renderer.setPixelRatio(pixelRatio);
    // renderer.sortObjects = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.background = new THREE.Color(0x000000);

    const loader = new THREE.TextureLoader();

    // const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    const camera = new THREE.OrthographicCamera(-window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, 1, 1000);
    camera.position.set(0, 0, 1);
    // scene.add(camera);

    const controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableRotate = false;
    controls.screenSpacePanning = true;
    controls.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.update();


    
    //console.log(logArray);
    //console.log(ID_dict);
    //logArray[0]["Children"] = [];
    //parent-child ref
    let parent_num;
    for(let i = 0; i < logArray.length; i++) {
        if (!logArray[i]){
            continue;
        }
        if(logArray[i]["parentGUID"] && ID_dict[logArray[i]["parentGUID"]]){
            parent_num = ID_dict[logArray[i]["parentGUID"]];
        }else{
            parent_num = 0; //parent: root node            
        }
        if(logArray[parent_num]){
            logArray[parent_num]["Children"].push(i);
        }
        logArray[i]["Parent"] = parent_num;
    }            
    console.log(logArray);

    // sort log


    // contruct tree
    // const tree = {};
    // const edgeScheme = (child, parent) => {
    //     return
    //     child.parentGUID !== undefined &&
    //         parent.psGUID !== undefined &&
    //         child.parentGUID === parent.psGUID;
    // };
    // for (let i = 0; i < logArray.length; i++) {
    //     for (let j = 0; j < logArray.length; j++) {
    //         if (0);
    //     }
    // }



    // node list


    let logArray_keys = Object.keys(logArray);
    let depth = 0;
    let width = 0;
    let child_num = 0;
    let stack = [logArray[0]];
    // let dequeue = array => {
    //     const item = array.pop();
    //     return item;
    // }
    const material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );
    const nodeGeometry = new THREE.BufferGeometry();
    let text_position_array = []
    const nvPos = Float32Array.from((function* vpgen1() {
        while(stack.length > 0){
            const logElement = stack.pop();
            text_position_array.push([`${logElement.subEvt} ${logElement.psPath || ''}`,0 + width * 10,0 - depth * 10]);           
            yield 0 + width * 10; yield 0 - depth * 10; yield 0;
            yield 2 + width * 10; yield -1 - depth * 10; yield 0;
            yield 2 + width * 10; yield 1 - depth * 10; yield 0;   
            // yield 0 - depth * 10; yield 0 + width * 10; yield 0;
            // yield -1 - depth * 10; yield 2 + width * 10; yield 0;
            // yield 1 - depth * 10; yield 2 + width * 10; yield 0;   
            if (logElement.Children.length != 0) {
                for(let i = logElement.Children.length;i>0;i--){
                    if(logElement.Children[i]){
                        stack.push(logArray[logElement.Children[i]]);
                    }
                }
                child_num = logElement.Children.length;
                depth += 1;
            } 
            width += 1;    
            child_num -= 1;
            if (child_num == 0){
                depth -= 1;
            }
        }
    })());

    nodeGeometry.addAttribute('position', new THREE.BufferAttribute(nvPos, 3));

    const nodeMesh = new THREE.Mesh( nodeGeometry, material );
    scene.add(nodeMesh);

    logArray_keys = Object.keys(logArray);
    depth = 0;
    width = 0;
    child_num = 0;
    stack = [logArray[0]];
    const edgeGeometry = new THREE.BufferGeometry();
    const evPos = Float32Array.from((function* vpgen2() {
        // yield -1000;
        // yield (logArray.length - 1) * -10 / 2;
        // yield 0;
        while(stack.length > 0){
            const logElement = stack.pop();
            yield 0 + width * 10; yield 0 - depth * 10; yield 0;
            yield 2 + width * 10; yield -1 - depth * 10; yield 0;
            //yield 2 + width * 30; yield 1 - depth * 30; yield 0;
            //yield 0 - depth * 10; yield 0 + width * 10; yield 0;   
            if (logElement.Children.length != 0) {
                for(let i = logElement.Children.length;i>0;i--){
                    if(logElement.Children[i]){
                        stack.push(logArray[logElement.Children[i]]);
                    }
                }
                child_num = logElement.Children.length;
                depth += 1;
            } 
            width += 1;    
            child_num -= 1;
            if (child_num == 0){
                depth -= 1;
            }
        }
    })());

    const evIndices = Float32Array.from((function* vpgen3() {
        for(let i = 1; i < logArray.length; i++){
            if(logArray[i]){
                yield logArray[i]["Parent"]; yield 1 + i;
            }
        }
    })());

    edgeGeometry.addAttribute('position', new THREE.BufferAttribute(evPos, 3));
    edgeGeometry.setIndex(new THREE.Uint16BufferAttribute(evIndices, 1));

    const edgeMesh = new THREE.LineSegments( edgeGeometry, material );
    scene.add(edgeMesh);

    const font = await new Promise((r, e) => {
        const fl = new THREE.FontLoader();
        fl.load(
            './Calling Code_Regular.json',
            r,
            undefined,
            e
        );
    });

    let textGeometry = null;
    for(let i = 0; i < text_position_array.length; i++){
        //const text = `${logArray[i].subEvt} ${logArray[i].psPath || ''}`
        const text = text_position_array[i][0];
        const textShape = font.generateShapes(text, 4);
        const bgAppend = new THREE.ShapeBufferGeometry(textShape , 2 );
        bgAppend.translate(text_position_array[i][1], text_position_array[i][2], 0);

        if(textGeometry !== null){
            textGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(
                [textGeometry, bgAppend]
                );
        }
        else{
            textGeometry = bgAppend;
        }

        if(textGeometry.attributes.position.array.length > 0x20000 || i + 1 == logArray.length){
            console.log(`progress: ${i * 100 / logArray.length} %`);
            const textMesh = new THREE.Mesh( textGeometry, material );
            scene.add(textMesh);
            textGeometry = null;
        }
    }

    // console.log(`text bg vertices: ${textGeometry.attributes.position.array.length}`);



    const gridHelper = new THREE.GridHelper( 160, 10 );
    gridHelper.rotation.x = Math.PI / 2;
    scene.add( gridHelper );




    const resize = () => {
        const w = window.innerWidth, h = window.innerHeight;

        camera.left = window.innerWidth / - 2;
        camera.right = window.innerWidth / 2;
        camera.top = window.innerHeight / 2;
        camera.bottom = window.innerHeight / - 2;
        camera.updateProjectionMatrix();

        renderer.setSize(w, h);
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = t => {
        requestAnimationFrame(animate);

        controls.update();

        renderer.render(scene, camera);
    };
    animate();

}
