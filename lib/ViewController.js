import { Tonelico } from './Tonelico.js';

/**
 * ツリー表示部分への入力処理を行う
 * @param {Element} viewerDom 
 * @param {Tonelico} tonelico 
 */
export class ViewController{
    /**
     * @param {Element} viewerDom 
     * @param {Tonelico} tonelico 
     */
    constructor(viewerDom, tonelico){
        // イベントハンドラ登録とか

        // スクロール例
        tonelico.camera.x += 0;
        tonelico.camera.y += 0;
        
        // ズーム例
        tonelico.camera.zoom += 0;

        // 衝突判定とカメラの移動の例
        tonelico.camera.focusOn(tonelico.collision(0, 0));
    }
}
