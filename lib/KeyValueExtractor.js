/**
 * 正規表現でキーと値をキャプチャする
 */
export class KeyValueExtractor{
    /**
     * @param {*} pattern keyとvalueのキャプチャグループを持つRegexpインスタンス
     */
    constructor(pattern, keyCaptureId, valueCaptureId) {
        this.pattern = pattern;
        if(keyCaptureId !== undefined) this.keyCaptureId = keyCaptureId + 1;
        if(valueCaptureId !== undefined) this.valueCaptureId = valueCaptureId + 1;
    }
    /**
     * 文字列からキーと値のセットを全部抜き出してプロパティに格納したオブジェクトを返す
     * @param {String} string 
     */
    extract(string, obj = {}){

        let target;
        while ((target = this.pattern.exec(string)) !== null) {
            if(this.keyCaptureId != null && this.valueCaptureId != null){
                const key = target[this.keyCaptureId];
                if(typeof key === 'string' && key.length > 0) {
                    obj[key] = target[this.valueCaptureId];
                }
            }
            else{
                const { groups } = target;
                if(typeof groups.key === 'string' && key.length > 0) {
                    obj[groups.key] = groups.value;
                }
    
            }
        }

        return obj;
    }
}