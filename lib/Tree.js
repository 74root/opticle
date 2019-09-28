import { ParentFinder } from "./ParentFinder.js";
import { KeyValueExtractor } from "./KeyValueExtractor.js";


const newNode = () => ({
    data: {
        value: {},
        raw: null,
        timestamp: null,
        line: null,
        variable: true,
    },
    view: {
        collapsed: false,
        highlighted: false,
        coordinate: null,
    },
    tree: {
        depth: null,
        parent: null,
        child: [],
    },
});


export class Tree{
    constructor(
        logString, 
        parentSchene = [
            'psGUID',
            'parentGUID'
        ]
    ){

        this.isModified = false;
        this.initFinish = new Promise(r => r());
        this.root = [newNode()];
        this.data = [];

        if(typeof logString !== 'string') return;

        // ログ文字列をパースし格納
        const logLines = logString.split('\n');
        // 親検索用クラスを親の指定キー名でインスタンス化
        const parentFinder = new ParentFinder(...parentSchene);
        // おおむね空白で区切られたkey=valueかkey="value"の部分を抜き出す
        // 実は若干条件が甘いが, ログフォーマットの範囲では問題ない
        const kvExtractor = new KeyValueExtractor(
            /(?<key>[^\s"=]+)=("?)(?<value>.*?)\2((?=\s)|$)/g
        );

        for (let i = 0; i < logLines.length; i++) {

            // 空白行はお情けで飛ばす
            if (logLines[i].trim().length === 0) continue;

            // ログ情報を格納
            const obj = newNode();

            // キー値の格納
            kvExtractor.extract(logLines[i], obj.data.value);

            // キーの定義外の情報を記録
            obj.data.timestamp = logLines[i].slice(0, 29);
            obj.data.raw = logLines[i];
            obj.data.line = this.data.length;

            // 親を検索し記録, 念の為親にもこちらを記録
            const parentId = parentFinder.findAndRegister(obj.data.value, obj.data.line);
            if(parentId){
                obj.tree.parent = this.data[parentId];
                this.data[parentId].tree.child.push[obj];
            }
            else{
                this.root.push(obj);
            }

            this.data.push(obj);
        }        

    }
    /**
     * @param {*} query クエリを何かしらの形で表したやつ
     * @returns {number} 絞り込んだログの行数
     */
    refine(refinerKey, refinerValue){
        // console.log(`refining by the query; key: ${refinerKey}, value: ${refinerValue}`);

        // return lineCount;
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
}
