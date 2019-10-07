/**
 * ファイル読み込み処理を行う
 */
export class FileReceiver{
    /**
     * 
     * @param {Element} rootDom 
     * @param {Function} resultTextCallback 
     */
    constructor(rootDom, resultTextCallback){

        this.rootDom = rootDom;
        this.reader = new FileReader();
        this.fileInputElement = document.getElementById('file');

        // ファイル選択時のコールバック
        const fileSelectCallback = async e => {


            if(this.reader.readyState === 1) return null;

            console.log('file select callback called.');

            const  file = e.target.files[0]; // FileList object
            console.info('file info is displayed below:');
            console.log(file);

            // ファイル読み込み完了時を待つPromise生成
            const resultPromise = new Promise(r => {
                this.reader.addEventListener('loadend', (event) => r(event.target.result));
            });

            // 読み込み実行
            this.reader.readAsText(file);

            // 完了時に結果を取得
            const resultText = await resultPromise;

            e.target.value = null;

            // 失敗時でも結果はnullになるので, そのまま返しても問題ない
            resultTextCallback(resultText);
        };

        // イベントハンドラ登録
        this.fileInputElement.addEventListener('change', fileSelectCallback, false);
        
    }
}

