/**
 * 親のidを検索し, 無ければnullを返す
 * @param {*} dictionary existing possible parents' dictionary
 * @param {*} parentValue value directing its parent (e.g. parentGUID)
 * @returns {number} parentID
 */
export class ParentFinder{
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