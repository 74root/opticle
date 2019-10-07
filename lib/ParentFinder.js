
/**
 * 親の有無や描画対象かどうかを辞書を保持しつつ調べる
 */
export class ParentFinder{
    constructor(){
        this._dictionary = {};
    }
    /**
     * 指定のパターンに従い親の有無とログの描画対象可否を返す
     * @param {*} obj 
     * @returns {*} 親, 又はnull(親は無いが描画対象), 又はundefined(完全に描画対象外)
     */
    find(obj){
        const {value} = obj.data;
        switch (value.evt) {
            case 'ps':
                switch (value.subEvt) {
                    case 'start':
                        return this._dictionary[value.parentGUID] || null;
                    case 'inject':
                    case 'guardInject':
                        return this._dictionary[value.psGUID] || undefined;
                    default:
                        return undefined;
                }
            case 'file':
            case 'reg':
            case 'net':
            case 'win':
                return this._dictionary[value.psGUID] || undefined;
            default:
                return undefined;
        }
    }
    /**
     * objを親候補として登録する
     * @param {*} obj 
     */
    register(obj){
        // 親候補はps startのみ
        if(obj.data.value.evt !== 'ps' || obj.data.value.subEvt !== 'start') return;
        // 自身を識別する値
        const selfKeyValue = obj.data.value['psGUID'];
        // 自身を識別する値を持っていれば, 親を識別する値をキーとして保存
        if(selfKeyValue != null)
            this._dictionary[selfKeyValue] = obj;
    }
    findAndRegister(obj){
        const result = this.find(obj);
        this.register(obj);
        return result;
    }
}