/**
 * 正規表現でキーと値をキャプチャする
 */
export class KeyValueExtractor{
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
    extract(string, obj = {}){

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