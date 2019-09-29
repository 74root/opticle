import { KeyValueExtractor } from "./KeyValueExtractor.js";


const newNode = () => ({
    // ログが選択された場合のみ更新される(つまり更新されない)
    data: {
        value: {},
        raw: null,
        timestamp: null,
        line: null,
        depth: 0,
        parent: null,
        child: [],
    },
    // 表示上の操作などで更新される
    view: {
        expanded: 1,
        highlighted: 0,
    },
    // 絞り込みで更新される
    tree: {
        variable: true,
        depth: 0,
        parent: null,
        child: [],
    },
});


export class Tree{
    constructor(
        logString,
        ParentFinder
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
        this.data = [];
        this.keyDictionary = {};

        if(typeof logString !== 'string') return;

        // ログ文字列をパースし格納
        const logLines = logString.split('\n');
        // 親検索用クラスをインスタンス化
        const parentFinder = new ParentFinder();
        // おおむね空白で区切られたkey=valueかkey="value"の部分を抜き出す
        // 実は若干条件が甘いが, ログフォーマットの範囲では問題ない
        const kvExtractor = new KeyValueExtractor(
            /(?<key>[^\s"=]+)=("?)(?<value>.*?)(?<!\")\2((?=\s)()|$)/g
        );

        for (let i = 0; i < logLines.length; i++) {

            // 空白行はお情けで飛ばす
            if (logLines[i].trim().length === 0) continue;

            // ログ情報を格納
            const obj = newNode();

            // キー値の格納
            kvExtractor.extract(logLines[i], obj.data.value);
            Object.assign(this.keyDictionary, obj.data.value);

            // キーの定義外の情報を記録
            obj.data.timestamp = logLines[i].slice(0, 29);
            obj.data.raw = logLines[i];
            obj.data.line = this.data.length;

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
                console.log(`discard orphan line(${i}-th).`);
                continue;
            }

            this.data.push(obj);
        }

    }
    /**
     * @param  {...{key: string, value: string|RegExp}} queries クエリ列 keyは完全一致, valueは部分一致か正規表現
     * @returns {number} 絞り込んだログの行数
     */
    refine(...queries){
        console.log(`refining by the query;`);
        console.log(queries);

        let lineCount = 0;

        // update variable flag
        this.foreachData(data => {
            data.tree.variable = queries.length === 0;
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

        // update tree structure
        this.maxDepth = this.dfsData((data, depth) => {
            // init tree children for upward callback
            data.tree.child.length = 0;

            // set depth
            data.data.depth = depth[0];
            data.tree.depth = depth[1];

            // child's parent is this node (variable) or its parent(invariable)
            const children = data.data.child;
            for(let i = 0; i < children.length; i++){
                children[i].tree.parent = 
                    data.tree.variable ? data : data.data.parent;
            }

            // pass children their actual and visial depth
            return [
                depth[0] + 1,
                depth[1] + data.tree.variable ? 1 : 0
            ];
        },
        (data, depthes) => {
            if(data.tree.parent) data.tree.parent.tree.child.push(data);
            return depthes.length === 0 ? data.data.depth : Math.max(...depthes);
        }, [0, 0]);

        console.log(`max depth: ${this.maxDepth}`);

        this.foreachData(d => {
            if(d.data.depth === 9) console.log(d);
        });

        return lineCount;
    }
    expand(nodeId){

        // return lineCount;
    }
    collapse(nodeId){

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
     */
    dfsData(downCallback, upCallback, firstValue){
        const dfs = (data, value) => {
            let downResult = undefined;
            if(downCallback){
                downResult = downCallback(data, value);
            }
            const childResult = [];
            for(let i = 0; i < data.data.child.length; i++){
                childResult.push(dfs(data.data.child[i], downResult));
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
