


window.addEventListener('load', async () => {

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

    const times = [0, 0];
    times[0] = performance.now();

    console.log('--- GET START ---');


    let log = '';
    try {

        log = await new Promise((r, e) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "/target.log", true);
            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        r(xhr.responseText);
                    } else {
                        e(xhr.statusText);
                    }
                }
            };
            xhr.onerror = e;
            xhr.send(null);
        });

        // console.log(log);

    }
    catch (e) {
        console.log(e);
    }

    console.log('--- PARSE START ---');

    /**
     * キーは空白を含まない
     * 値は""で囲めば空白を含む事が出来る
     * キーと値が=で結ばれた形式でない限り無視される
     * patternの正規表現で指定されている
     */
    const logArray = (() => {
        // 行毎に分割
        const logLines = log.split('\n');
        const logKeys = new Array(logLines.length);
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
            logKeys[i] = obj;
        }
        return logKeys;
    })();

    times[1] = performance.now();

    console.log(times[1] - times[0]);
    console.log(logArray.length);


    // sort log


    // contruct tree
    const tree = {};
    const edgeScheme = (child, parent) => {
        return
        child.parentGUID !== undefined &&
            parent.psGUID !== undefined &&
            child.parentGUID === parent.psGUID;
    };
    for (let i = 0; i < logArray.length; i++) {
        for (let j = 0; j < logArray.length; j++) {
            if (0);
        }
    }



    // node list


    const material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );

    const nodeGeometry = new THREE.BufferGeometry();
    const nvPos = Float32Array.from((function* vpgen1() {
        for(let i = 0; i < logArray.length; i++){
            yield 0; yield 0 - i * 10; yield 0;
            yield 2; yield -1 - i * 10; yield 0;
            yield 2; yield 1 - i * 10; yield 0;
        }
    })());

    nodeGeometry.addAttribute('position', new THREE.BufferAttribute(nvPos, 3));

    const nodeMesh = new THREE.Mesh( nodeGeometry, material );
    scene.add(nodeMesh);



    const edgeGeometry = new THREE.BufferGeometry();
    const evPos = Float32Array.from((function* vpgen2() {
        yield -1000;
        yield (logArray.length - 1) * -10 / 2;
        yield 0;
        for(let i = 0; i < logArray.length; i++){
            yield 0; yield 0 - i * 10; yield 0;
        }
    })());
    const evIndices = Float32Array.from((function* vpgen3() {
        for(let i = 0; i < logArray.length; i++){
            yield 0; yield 1 + i;
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
    
    for(let i = 0; i < logArray.length; i++){

        const text = `${logArray[i].subEvt} ${logArray[i].psPath || ''}`
        const textShape = font.generateShapes(text, 4);
        const bgAppend = new THREE.ShapeBufferGeometry(textShape , 2 );
        bgAppend.translate(5, -2 - i * 10, 0);

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

});
