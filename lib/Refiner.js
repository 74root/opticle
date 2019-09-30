import { Tree } from './Tree.js';

/**
 * 絞り込みの入力関連処理を行う
 */
export class Refiner{
    /**
     * ツリーに無関係な初期化を行う
     * @param {Element} rootDom この要素以下が管轄になる
     */
    constructor(rootDom){

        // UI準備
        
        this.keysParent = document.getElementById("key");
        this.refineButton = document.getElementById('btn');

    }
    /**
     * ツリーに関連する初期化を行う
     * @param {Tree} tree 絞り込み実行用
     */
    async init(tree){

        // UI初期化

        // 選択肢設定
        const allKeyOption = document.getElementById('allKeyOption');
        while (this.keysParent.firstChild) this.keysParent.removeChild(this.keysParent.firstChild);
        this.keysParent.appendChild(allKeyOption);
        const keys = Object.keys(tree.keyDictionary);
        // とりあえず辞書順
        keys.sort();
        for (let i = 0; i < keys.length; i++) {
            const option_element = document.createElement("option");
            option_element.setAttribute("value", keys[i]);
            option_element.innerText = keys[i];
            this.keysParent.appendChild(option_element);
        }

        // イベントハンドラ初期化
        this.refineButton.onclick = e => {
            const lineCount = tree.refine({
                key: document.getElementById("key").value,
                value: document.getElementById("text").value
            });
            console.log(`refined into ${lineCount} lines.`);
        };

    }

}
