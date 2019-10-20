/**
 * original code:
 * https://github.com/llimllib/pymag-trees/
 */

// const scale = 100;

class DrawTree {
    /**
     * @param {*} tree ???
     * @param {*} parent parent node
     * @param {number} depth depth of node
     * @param {number} ithSibl order of this nodes in its siblings
     */
    constructor(tree, parent = null, depth = 0, ithSibl = 1) {
        this.originalNode = tree;
        this.originalNode.tree.x = 0;
        this.originalNode.tree.y = depth;
        this.children = [];
        for (let i = 0; i < tree.tree.child.length; i++) {
            const child = tree.tree.child[i];
            this.children.push(new DrawTree(child, this, depth + 1, i + 1));
        }
        this.parent = parent;
        this.thread = null;
        this.mod = 0;
        this.ancestor = this;
        this.change = 0;
        this.shift = 0;
        this._lmost_sibling = null;
        this.ithSibl = ithSibl;
    }
    /**
     * @returns {DrawTree|null} first child or thread node
     */
    left() {
        return this.children.length > 0 ? this.children[0] : this.thread;
    }
    /**
     * @returns {DrawTree|null} last child or thread node
     */
    right() {
        return this.children.length > 0 ? this.children[this.children.length - 1] : this.thread;
    }
    /**
     * @returns {DrawTree|null} left next node
     */
    lbrother() {
        if(this.parent == null) return null;
        let n = null;
        for (let i = 0; i < this.parent.children.length; i++) {
            const node = this.parent.children[i];
            if (node === this) return n;
            else n = node;
        }
        return n;
    }
    /**
     * @returns {DrawTree|null} first sibling or null if this is it
     */
    get leftmost_sibling() {
        if (
            ! this._lmost_sibling &&
            this.parent &&
            this !== this.parent.children[0]
        ) {
            this._lmost_sibling = this.parent.children[0];
        }
        return this._lmost_sibling;
    }
}

/**
 * modによるシフトを自身以下に適用
 * @param {DrawTree} v 
 * @param {number} m 
 * @param {number} depth 
 * @param {number} min
 */
const second_walk = async (v, m = 0, depth = 0, min = null) => {
    v.originalNode.tree.x += m;
    v.originalNode.tree.y = depth;
    if(min == null || v.originalNode.tree.x < min) min = v.originalNode.tree.x;
    for (let i = 0; i < v.children.length; i++)
        second_walk(v.children[i], m + v.mod, depth + 1, min);
    return min;
};

/**
 * vilの祖先がvの兄弟のどれかと同じならそのまま祖先を, でなければデフォルト祖先を返す
 * @param {DrawTree} vil 
 * @param {DrawTree} v 
 * @param {DrawTree} default_ancestor 
 * @returns {DrawTree}
 */
const ancestor = (vil, v, default_ancestor) => {
    return v.parent.children.every(x => x !== vil.ancestor) ?
        default_ancestor :  vil.ancestor ;
};


/**
 * execute shift and change for children
 * @param {DrawTree} v 
 */
const execute_shifts = v => {
    // 
    let shift = 0;
    let change = 0;
    for (let i = v.children.length - 1; i >= 0; i--) {
        const child = v.children[i];
        child.originalNode.tree.x += shift;
        child.mod += shift;
        change += child.change;
        shift += child.shift + change;
    }
};


/**
 * wrにshiftを追加, 
 * @param {DrawTree} wl 
 * @param {DrawTree} wr 
 * @param {number} shift 
 */
const move_subtree = (wl, wr, shift) => {
    const subtrees = wr.ithSibl - wl.ithSibl;
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.originalNode.tree.x += shift;
    wr.mod += shift;
};


/**
 * @param {DrawTree} vertex 
 * @param {DrawTree} default_ancestor 兄弟の一番下の時は自身
 * @param {number} distance ノード間の距離
 */
const apportion = (vertex, default_ancestor, distance) => {
    // 一つ若い
    const w = vertex.lbrother();
    // 末っ子なら自身を祖先にするだけ
    if (w === null) return default_ancestor;
    // leftが若い側の兄弟ノード以下の木, rightが自分以下の木を指す
    // inside, outsideはそれら2つの木の内側と外側
    let vertex_inside_right = vertex;
    let vertex_outside_right = vertex;
    let vertex_inside_left = w;
    let vertex_outside_left = vertex.leftmost_sibling;
    // shiftは
    let shift_inside_right = vertex.mod;
    let shift_outside_right = vertex.mod;
    let shift_inside_left = vertex_inside_left.mod;
    let shift_outside_left = vertex_outside_left.mod;
    // 内側2つが内側向きに進める限り
    while (vertex_inside_left.right() !== null && vertex_inside_right.left() !== null) {
        // 内側は内側向きへ, 外側は外側向きへ, それぞれ子を辿る
        vertex_inside_left = vertex_inside_left.right();
        vertex_inside_right = vertex_inside_right.left();
        vertex_outside_left = vertex_outside_left.left();
        vertex_outside_right = vertex_outside_right.right();
        // 下る過程で自身以下の一番左側のノードの祖先を自身に設定する
        vertex_outside_right.ancestor = vertex;
        // shiftは2つの木の内側の差分
        const shift = (vertex_inside_left.originalNode.tree.x + shift_inside_left) - (vertex_inside_right.originalNode.tree.x + shift_inside_right) + distance;
        // 対象ノードの木側が基準なので, 0より大きければ接触が起こっている
        if (shift > 0) {
            // 
            const a = ancestor(vertex_inside_left, vertex, default_ancestor);
            // 衝突を避けるように木を移動する
            move_subtree(a, vertex, shift);
            shift_inside_right += shift;
            shift_outside_right += shift;
        }
        // 現在の階層のmodを適用する
        // この時点でshiftはその段階での座標
        shift_inside_left += vertex_inside_left.mod;
        shift_inside_right += vertex_inside_right.mod;
        shift_outside_left += vertex_outside_left.mod;
        shift_outside_right += vertex_outside_right.mod;
    }
    if (vertex_inside_left.right() != null && vertex_outside_right.right() == null) {
        vertex_outside_right.thread = vertex_inside_left.right();
        vertex_outside_right.mod += shift_inside_left - shift_outside_right;
    }
    else {
        if (vertex_inside_right.left() != null && vertex_outside_left.left() == null) {
            vertex_outside_left.thread = vertex_inside_right.left();
            vertex_outside_left.mod += shift_inside_right - shift_outside_left;
        }
        default_ancestor = vertex;
    }
    return default_ancestor;
};


/**
 * 
 * @param {DrawTree} v 
 * @param {number} distance 
 */
const firstwalk = (v, distance = 1) => {

    if (v.children.length == 0) {
        // 葉であれば, 兄弟の隣に配置するだけ
        v.originalNode.tree.x = (v.leftmost_sibling !== null) ? (v.lbrother().originalNode.tree.x + distance) : 0;
    }
    else {
        // 子があった場合

        // 子を被りが無いように配置
        // 兄弟の末ノード
        let default_ancestor = v.children[0];
        for (let i = 0; i < v.children.length; i++) {
            firstwalk(v.children[i], distance);
            default_ancestor = apportion(v.children[i], default_ancestor, distance);
        }
        // 子のxとmodを変更し配置実行
        execute_shifts(v);

        // 子の幅の半分を計算
        const midpoint = (v.children[0].originalNode.tree.x + v.children[v.children.length - 1].originalNode.tree.x) / 2;

        // ell = v.children[0];
        // arr = v.children[v.children.length - 1];
        const w = v.lbrother();
        if (w !== null) {
            // 下の兄弟があれば, 自身はその隣で, かつ自身以下をmodにより自身の中心まで移動
            v.originalNode.tree.x = w.originalNode.tree.x + distance;
            v.mod = v.originalNode.tree.x - midpoint;
        }
        else{
            // 下の兄弟がなければ, 自身は子の幅の半分まで移動
            v.originalNode.tree.x = midpoint;
        }
    }
    return v;
};

/**
 * @param {DrawTree} tree 
 * @param {number} n 
 */
const third_walk = (tree, n) => {
    tree.originalNode.tree.x += n;
    for (let i = 0; i < tree.children.length; i++) {
        third_walk(tree.children[i], n);
    }
};


/**
 * @param {*} tree 
 * @param {number} yScale
 */
const buchheim = (tree, yScale) => {
    const dt = firstwalk(new DrawTree(tree), yScale);
    const min = second_walk(dt);
    if (min < 0) third_walk(dt, -min);
    return dt;
};

export { buchheim };