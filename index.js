import { Tree } from './lib/Tree.js';
import { Tonelico } from './lib/Tonelico.js';
import { Refiner } from './lib/Refiner.js';
import { Searcher } from './lib/Searcher.js';
import { ViewController } from './lib/ViewController.js';
import { FileReceiver } from './lib/FileReceiver.js';




window.addEventListener('DOMContentLoaded', async () => {

    const canvas = document.getElementById('screen');
    const rootDom = null;


    // ツリーと無関係な初期化の実行
    const tonelico = new Tonelico(canvas);
    const viewController = new ViewController(canvas, tonelico);
    const refiner = new Refiner(rootDom);
    const searcher = new Searcher(rootDom);

    /**
     * ログが読み込まれた時の処理を記述した関数
     * @param {string|null} logString ログの文字列 失敗しているとnull
     */
    const logInit = async (logString) => {

        if(logString == null) return;

        // パース処理とツリー構築
        const tree = new Tree(logString);
        // await tree.initFinish;

        // ツリーの描画準備, 絞り込み準備, 検索準備
        // 並列化
        await Promise.all([
            tonelico.init(tree),
            refiner.init(tree),
            searcher.init(tree)
        ]);

        
    };

    const fileReceiver = new FileReceiver(rootDom, logInit);


    const update = t => {
        requestAnimationFrame(update);

        /**
         * 内部でツリーの情報が更新されていた場合に反映を行う
         */
        tonelico.update();

        tonelico.render();
    };
    update();

});
