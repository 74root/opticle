# Soliton Dataset用プロセスツリー可視化ツールOpticle
## 構成
```
-+- index.html : ページ表示用
 |
 +- index.js : jsエントリーポイントファイル
 |
 +- three.min.js : 使用ライブラリthree.jsのminifyファイル
 |
 +- OrbitControl.js : 同ライブラリのユーティリティ
 |
 +-+ font/ : 描画に使用するフォントファイルを保存
 | |
 | +- Ricty-Diminished_Regular.json : OFL下で利用が許可された同名フォントの情報
 |
 +-+ lib/ : ページ中の処理に用いるモジュールファイルを保存
   |
   +- BRT.js : Reingold Tilfordアルゴリズムに基づく木の座標計算用モジュール
   |
   +- FileReceiver.js : ローカルからのファイル取得用モジュール
   |
   +- KeyValueExtractor : ログが含む行のパース用モジュール
   |
   +- ParentFinder.js : 木構造構築時の親探索用モジュール
   |
   +- Refiner.js : 描画対象絞り込みの操作処理用モジュール
   |
   +- Tonelico.js : 木の描画全般の処理用モジュール
   |
   +- Tree.js : 木構造データ処理用モジュール

```
## 使用方法
### 手順
1. [例を記入]などの手段で`index.html`ファイルをWebページとして閲覧する
2. 左上の`ファイルを選択`からローカルマシン上のログファイルを指定
### 操作
* マウス右ドラッグでスクロール
* マウスホイールで拡大/縮小
* 左上のプルダウンとテキスト入力欄からキーと値の条件を指定して表示対象の絞り込み
## 機能
* Soliton Datasetに記録されたプロセスの木構造化による可視化表示
* ページ上からのローカルファイル読み込み
* ページ上での描画対象絞り込み
