// 親を検索し, 無ければnullを返す
const _findParent = (child, targets, end, start = 0) => {
    if(child.data.value.parentGUID === undefined) return null;
    for(let j = end - 1; j >= start; j--){
        if(targets[j].data.value.GUID === child.data.value.parentGUID){
            return targets[j];
        }
    }
    return null;
};


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
        findParent = _findParent
    ){

        this.isModified = false;
        this.initFinish = new Promise(r => r());
        this.root = [newNode()];
        this.data = [];

        if(typeof logString !== 'string') return;

        // ログ文字列をパースし格納
        const logLines = logString.split('\n');
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
            const parent = findParent(obj, this.data, this.data.length);
            if(parent !== null){
                obj.tree.parent = parent;
                parent.child.push[obj];
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
