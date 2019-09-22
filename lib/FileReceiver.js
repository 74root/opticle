// とりあえずプロトタイプの時の処理を移植
const getLogByXHR = async filePath => {
    const XHRforPromise = (resolve, eject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.onload = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resolve(xhr.responseText);
                } else {
                    eject(xhr.statusText);
                }
            }
        };
        xhr.onerror = eject;
        xhr.send(null);
    };

    try {
        return await new Promise(XHRforPromise);
    }
    catch (e) {
        console.log(e);
    }
};

/**
 * ファイル読み込み処理を行う
 */
export class FileReceiver{
    /**
     * 
     * @param {Element} rootDom 
     * @param {Function} callback 
     */
    constructor(rootDom, callback){

        // 本来はイベントハンドラとか登録する

        
        // 現状は固定ファイルを取得で済ませているので, 即コールバック
        (async () => {
            callback(await getLogByXHR('../log/target.log'));
        })();
        
    }
}

