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

    }
    /**
     * ツリーに関連する初期化を行う
     * @param {Tree} tree 絞り込み実行用
     */
    async init(tree){

        // イベントハンドラ初期化

        // 絞り込み例
        tree.refine(null);

    }

}
