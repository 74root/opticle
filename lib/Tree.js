/**
 * 親のidを検索し, 無ければnullを返す
 * @param {*} dictionary existing possible parents' dictionary
 * @param {*} parentValue value directing its parent (e.g. parentGUID)
 * @returns {number} parentID
 */
class ParentFinder{
    constructor(selfKeyName, parentKeyName){
        this._dictionary = {};
        this._selfKeyName = selfKeyName;
        this._parentKeyName = parentKeyName;
    }
    /**
     * objが親を指定していて実在すればそのidを, でなければnullを返す
     * @param {*} obj 
     * @returns {number} id
     */
    find(obj){
        // 親を指定する値
        const parentKeyValue = obj[this._parentKeyName];
        // 親が指定されていてそれが実在すればオブジェクトを識別する値を返す
        // 無ければnullを返す
        return parentKeyValue == null ? null :
            (this._dictionary[parentKeyValue] || null);
    }
    /**
     * objを親候補としてidと共に登録する
     * @param {*} obj 
     * @param {*} id 
     */
    register(obj, id){
        // 自身を識別する値
        const selfKeyValue = obj[this._selfKeyName];
        // 自身を識別する値を持っていれば, 親を識別する値をキーとして保存
        if(selfKeyValue != null)
            this._dictionary[selfKeyValue] = id;
    }
    findAndRegister(obj, id){
        const result = this.find(obj);
        this.register(obj, id);
        return result;
    }
}

/**
 * 正規表現でキーと値をキャプチャする
 */
class Parser{
    /**
     * @param {*} pattern keyとvalueのキャプチャグループを持つRegexpインスタンス
     */
    constructor(pattern) {
        this.pattern = pattern;
    }
    /**
     * 文字列からキーと値のセットを全部抜き出してプロパティに格納したオブジェクトを返す
     * @param {String} string 
     */
    parse(string, obj = {}){

        let target;
        while ((target = this.pattern.exec(string)) !== null) {
            const { groups } = target;
            if(groups && typeof groups.key === 'string' && groups.key.length > 0) {
                obj[groups.key] = groups.value;
            }
        }

        return obj;
    }
}

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
        const parser = new Parser(/(?<key>[^\s"=]+)=("?)(?<value>.*?)\2((?=\s)|$)/g);

        for (let i = 0; i < logLines.length; i++) {

            // 空白行はお情けで飛ばす
            if (logLines[i].trim().length === 0) continue;

            // ログ情報を格納
            const obj = newNode();

            // キー値の格納
            parser.parse(logLines[i], obj.data.value);

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
    refine(query){

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
