import { KeyValueExtractor } from "./KeyValueExtractor.js";


const newNode = () => ({
    // ログが選択された場合のみ更新される(つまり更新されない)
    data: {
        value: {},
        raw: null,
        timestamp: null,
        line: null,
        text: null,
        depth: 0,
        parent: null,
        child: [],
    },
    // 表示上の操作などで更新される
    view: {
        textLength: 0,
        expanded: 1,
        highlighted: 0,
    },
    // 絞り込みで更新される
    tree: {
        brtNode: null,
        variable: true,
        depth: 0,
        parent: null,
        child: [],
    },
});


export class Tree{
    /**
     * 
     * @param {string} logString 
     * @param {*} ParentFinder 
     * @param {Font} font 
     */
    constructor(
        logString,
        ParentFinder,
        font
    ){

        this.colorScheme = {
            key: 'evt',
            value: ['ps', 'file', 'reg', 'net', 'win'],
            color: [
                0x00, 0x00, 0xff,
                0x2e, 0x8b, 0x57,
                0x2f, 0x4f, 0x4f,
                0xff, 0x7f, 0x50,
                0xff, 0x00, 0xff,
                0x00, 0x00, 0x00,
            ],
        };
        this.isModified = false;
        this.initFinish = new Promise(r => r());
        this.root = newNode();
        this.root.data.parent = this.root;
        this.data = [];
        this.keyDictionary = {};
        this.maxTextLength = -Infinity;
        this.fontSize = 2;

        if(typeof logString !== 'string') return;

        // ログ文字列をパースし格納
        const logLines = logString.split('\n');
        // 親検索用クラスをインスタンス化
        const parentFinder = new ParentFinder();
        // おおむね空白で区切られたkey=valueかkey="value"の部分を抜き出す
        // 実は若干条件が甘いが, ログフォーマットの範囲では問題ない
        const kvExtractor = new KeyValueExtractor(
            /([^\s"=]+)=("?)((?:[^"]|"")*?)\2(?:(?=\s)()|$)/g, 0, 2
        );

        for (let i = 0; i < logLines.length; i++) {

            // 空白行はお情けで飛ばす
            if (logLines[i].trim().length === 0) continue;

            // ログ情報を格納
            const obj = newNode();

            // キー値の格納
            kvExtractor.extract(logLines[i], obj.data.value);
            Object.assign(this.keyDictionary, obj.data.value);

            // 親を検索し記録, 念の為親にもこちらを記録
            const parentNode = parentFinder.findAndRegister(obj);
            if(parentNode != null){
                obj.data.parent = parentNode;
                parentNode.data.child.push(obj);
            }
            else if(parentNode === null){
                obj.data.parent = this.root;
                this.root.data.child.push(obj);
            }
            else if(parentNode === undefined){
                // console.log(`discard orphan line(${i}-th).`);
                continue;
            }

            // キーの定義外の情報を記録
            obj.data.timestamp = logLines[i].slice(0, 29);
            obj.data.raw = logLines[i];
            obj.data.line = this.data.length;
            /**
             * 
             * @param {string} s 
             * @param {string} d 
             */
            const relPath = (s, d) => {
                const sArray = s.split('\\');
                const dArray = d.split('\\');
                let i = 0;
                while (i < sArray.length - 1 && i < dArray.length - 1 && sArray[i] === dArray[i]) i++;
                return (i === sArray.length - 1 ? '.\\' : '..\\'.repeat(sArray.length - i - 1)) + dArray.slice(i).join('\\');
            };
            obj.data.text = (v => {
                let label = `${v.subEvt}`;
                switch (v.evt) {
                    case 'ps':
                        switch (v.subEvt) {
                            case 'inject':
                            case 'guardInject':
                                return `${v.subEvt} to ${v.tpsPath}`;
                            default:
                                return `${v.subEvt} ${v.psPath}`;
                        }
                    case 'file':
                        label += ` ${v.path}`;
                        switch (v.subEvt) {
                            case 'close':
                                return `${v.subEvt} ${v.path}` +
                                    (v.read > 0 ? ` read` : '') +
                                    (v.write > 0 ? ` write` : '');
                            case 'copy':
                            case 'rename':
                                return `${v.subEvt} ${v.path} to ${relPath(v.path, v.dstPath)}`;
                            default:
                                return `${v.subEvt} ${v.path}`
                        }
                    case 'reg':
                        switch (v.subEvt) {
                            case 'setVal':
                            case 'delVal':
                                return `${v.subEvt} ${v.path} ${v.entry}` +
                                (v.valStr ? `=${v.valStr}` : +
                                (v.valNum ? `=${v.valNum}` : ''));
                            default:
                                return `${v.subEvt} ${v.path}`
                        }
                    case 'net':
                        switch (v.subEvt) {
                            case 'openUDP':
                            case 'closeUDP':
                                return `${v.subEvt} port ${v.serv}`;
                            case 'webURL':
                                return `${v.subEvt} ${v.url}`;
                            default:
                                return `${v.subEvt} from ${v.srcHost}:${v.srcServ}` +
                                     ` to ${v.dstHost}:${v.dstServ}` +
                                    (v.recv != null ? ` receivesize=${parseInt(v.recv).toLocaleString()}` : '') +
                                    (v.send != null ? ` sendsize=${parseInt(v.send).toLocaleString()}` : '');
                        }
                    case 'win':
                        return `${v.subEvt} ${v.winTitle}`;
                    default:
                        return 'NO AVAILABLE DATA';
                }
            })(obj.data.value);

            // 視覚系の情報を記録
            obj.view.colorId = (value => {
                switch (value.evt) {
                    case 'ps':
                        switch (value.subEvt) {
                            case 'inject':
                            case 'guardInject':
                                return 1;
                            default:
                                return 0;
                        }
                    case 'file':
                        return 2;
                    case 'reg':
                        return 3;
                    case 'net':
                        return 4;
                    case 'win':
                        return 5;
                    default:
                        return 6;
                }
            })(obj.data.value);

            // init text vertex info
            const textShape = font.generateShapes(obj.data.text, this.fontSize);
            const bg = new THREE.ShapeBufferGeometry(textShape, 2);
            obj.view.coordTA = bg.attributes.position.array;
            obj.view.indexTA = bg.index.array;
            const textLength = [0];
            for (let i = 0; i < obj.data.text.length; i++) {
                if(obj.data.text[i] === '\n') textLength.push(0);
                else if(font.data.glyphs[obj.data.text[i]] != null)
                    textLength[textLength.length - 1] += font.data.glyphs[obj.data.text[i]].ha;
            }
            obj.view.textLength = Math.max(...textLength) / font.data.resolution * this.fontSize;
            this.maxTextLength = Math.max(this.maxTextLength, obj.view.textLength);

            this.data.push(obj);
        }

        const nodeSize = this.data.length + 1;

        this.refine();

    }
    /**
     * @param  {...{key: string, value: string|RegExp}} queries クエリ列 keyは完全一致, valueは部分一致か正規表現
     * @returns {number} 絞り込んだログの行数
     */
    refine(...queries){
        console.log(`refining by the query;`);
        console.log(queries);

        let lineCount = 0;

        this.isModified = queries.length !== 0;

        // update variable flag
        this.foreachData(data => {
            data.tree.variable = ! this.isModified;
            for(let j = 0; j < queries.length; j++){
                // string query to regexp
                const regexp = queries[j].value instanceof RegExp ? queries[j].value : new RegExp(queries[j].value);
                if(regexp.test(data.data.value[ queries[j].key ])){
                    data.tree.variable = true;
                    break;
                }
            }
            lineCount += data.tree.variable;
        });


        this.updateTree();

        return lineCount;
    }
    updateTree(){

        // update tree structure
        this.maxDepth = this.dfsData((obj, depth) => {
            // init tree children for upward callback
            obj.tree.child.length = 0;

            // set depth
            obj.data.depth = depth[0];
            obj.tree.depth = depth[1];

            // child's parent is this node (variable) or its parent(invariable)
            const children = obj.data.child;
            for(let i = 0; i < children.length; i++){
                children[i].tree.parent = 
                    obj.tree.variable ? obj : obj.data.parent;
            }

            // pass children their actual and visial depth
            return [
                depth[0] + 1,
                depth[1] + obj.tree.variable ? 1 : 0
            ];
        },
        (data, depthes) => {
            if(data.tree.parent){
                if(data.tree.variable) data.tree.parent.tree.child.push(data);
                else data.tree.parent.tree.child.push(...data.tree.child);
            } 
            return depthes.length === 0 ? data.data.depth : Math.max(...depthes);
        }, [0, 0]);

    }
    clickNode(nodeId){

        this.data[nodeId].view.expanded = 1;
        // return lineCount;
    }
    search(query){

    }
    computeCoordinate(){
        
    }
    getHeight(node){
    }
    setHeight(){

    }
    /**
     * fast foreach
     * @param {(x: any, i: number, a: []) => any} callbackFunction undefined以外を返すと即終了し戻り値を返す
     */
    foreachData(callbackFunction){
        let result = undefined;
        for(let _i = 0; _i < this.data.length; _i++){
            result = callbackFunction(this.data[_i], _i, this.data);
            if(result !== undefined) break;
        }
        return result;
    }
    /**
     * 深さ優先探索を行う
     * @param {(data: any, value: any) => any} downCallback 降下時のコールバック 戻り値が子ノードのコールバックに渡される
     * @param {(data: any, value: any[]) => any} upCallback 上昇時のコールバック 戻り値の配列が親ノードのコールバックに渡される
     * @param {any} firstValue 最初のdownCallbackにvalueとして渡される値
     * @param {'data'|'tree'} dot treeを指定するとtree側での探査になる
     */
    dfsData(downCallback, upCallback, firstValue, dot = 'data'){
        const dfs = (data, value) => {
            let downResult = undefined;
            if(downCallback){
                downResult = downCallback(data, value);
            }
            const childResult = [];
            for(let i = 0; i < data[dot].child.length; i++){
                const result = dfs(data[dot].child[i], downResult);
                if(result !== undefined) childResult.push(result);
            }
            let upResult = undefined;
            if(upCallback){
                upResult = upCallback(data, childResult);
            }

            return upResult;
        }
        return dfs(this.root, firstValue);
    }
}
