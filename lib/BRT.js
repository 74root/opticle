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
        this.x = -1;
        this.y = depth;
        this.originalNode = tree;
        tree.tree.brtNode = this;
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
    left() {
        return this.children.length > 0 ? this.children[0] : this.thread;
    }
    right() {
        return this.children.length > 0 ? this.children[this.children.length - 1] : this.thread;
    }
    // 一つ若い兄弟を返す
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
    // 自分以外が兄弟の末であればそれを返す
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
 * @param {DrawTree} v 
 * @param {number} m 
 * @param {number} depth 
 * @param {number} min
 */
const second_walk = async (v, m = 0, depth = 0, min = null) => {
    v.x += m;
    v.y = depth;
    if(min == null || v.x < min) min = v.x;
    for (let i = 0; i < v.children.length; i++)
        second_walk(v.children[i], m + v.mod, depth + 1, min);
    return min;
};

/**
 * @param {DrawTree} vil 
 * @param {DrawTree} v 
 * @param {DrawTree} default_ancestor 
 */
const ancestor = (vil, v, default_ancestor) => {
    return v.parent.children.every(x => x !== vil.ancestor) ?
        default_ancestor :  vil.ancestor ;
};


/**
 * @param {DrawTree} v 
 */
const execute_shifts = v => {
    let shift = 0;
    let change = 0;
    for (let i = v.children.length - 1; i >= 0; i--) {
        const w = v.children[i];
        w.x += shift;
        w.mod += shift;
        change += w.change;
        shift += w.shift + change;
    }
};


/**
 * @param {DrawTree} wl 
 * @param {DrawTree} wr 
 * @param {number} shift 
 */
const move_subtree = (wl, wr, shift) => {
    const subtrees = wr.ithSibl - wl.ithSibl;
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.x += shift;
    wr.mod += shift;
};


/**
 * @param {DrawTree} v 
 * @param {DrawTree} default_ancestor 
 * @param {number} distance 
 */
const apportion = (v, default_ancestor, distance) => {
    const w = v.lbrother();
    if (w === null) return default_ancestor;
    let vir = v;
    let vor = v;
    let vil = w;
    let vol = v.leftmost_sibling;
    let sir = v.mod;
    let sor = v.mod;
    let sil = vil.mod;
    let sol = vol.mod;
    while (vil.right() !== null && vir.left() !== null) {
        vil = vil.right();
        vir = vir.left();
        vol = vol.left();
        vor = vor.right();
        vor.ancestor = v;
        const shift = (vil.x + sil) - (vir.x + sir) + distance;
        if (shift > 0) {
            const a = ancestor(vil, v, default_ancestor);
            move_subtree(a, v, shift);
            sir += shift;
            sor += shift;
        }
        sil += vil.mod;
        sir += vir.mod;
        sol += vol.mod;
        sor += vor.mod;
    }
    if (vil.right() != null && vor.right() == null) {
        vor.thread = vil.right();
        vor.mod += sil - sor;
    }
    else {
        if (vir.left() != null && vol.left() == null) {
            vol.thread = vir.left();
            vol.mod += sir - sol;
        }
        default_ancestor = v;
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
        v.x = v.leftmost_sibling ? (v.lbrother().x + distance) : 0;
    }
    else {
        let default_ancestor = v.children[0];
        for (let i = 0; i < v.children.length; i++) {
            firstwalk(v.children[i]);
            default_ancestor = apportion(v.children[i], default_ancestor, distance);
        }
        execute_shifts(v);

        const midpoint = (v.children[0].x + v.children[v.children.length - 1].x) / 2;

        // ell = v.children[0];
        // arr = v.children[v.children.length - 1];
        const w = v.lbrother();
        if (w) {
            v.x = w.x + distance;
            v.mod = v.x - midpoint;
        }
        else
            v.x = midpoint;
    }
    return v;
};

/**
 * @param {DrawTree} tree 
 * @param {number} n 
 */
const third_walk = (tree, n) => {
    tree.x += n;
    for (let i = 0; i < tree.children.length; i++) {
        third_walk(tree.children[i], n);
    }
};


/**
 * @param {*} tree 
 */
const buchheim = tree => {
    const dt = firstwalk(new DrawTree(tree));
    const min = second_walk(dt);
    if (min < 0) third_walk(dt, -min);
    return dt;
};

export { buchheim };