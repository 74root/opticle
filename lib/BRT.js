

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
        this.tree = tree;
        this.tree.children = [];
        for (let i = 0; i < tree.tree.children; i++)this.tree.children.push(
            new DrawTree(tree.tree.children[i], this, depth + 1, i + 1)
        );
        this.tree.parent = parent;
        this.thread = null;
        this.mod = 0;
        this.ancestor = this;
        this.change = 0;
        this.shift = 0;
        this._lmost_sibling = null;
        this.ithSibl = ithSibl;
    }
    left() {
        return this.thread ||
            this.tree.children.length > 0 ? this.tree.children[0] : null;
    }
    right() {
        return this.thread ||
            this.tree.children.length > 0 ? this.tree.children[this.tree.children.length - 1] : null;
    }
    lbrother() {
        n = null;
        if (this.tree.parent) {
            for (let i = 0; i < this.tree.parent.tree.children.length; i++) {
                const node = this.tree.parent.tree.children[i];
                if (node === this) return n;
                else n = node;
            }
        }
        return n;
    }
    get leftmost_sibling() {
        if (
            this._lmost_sibling &&
            this.tree.parent &&
            this !== this.tree.parent.tree.children[0]
        ) {
            this._lmost_sibling = this.tree.parent.tree.children[0];
        }
        return this._lmost_sibling;
    }
}

/**
 * @param {DrawTree} v 
 * @param {number} m 
 * @param {number} depth 
 */
const second_walk = async (v, m = 0, depth = 0) => {
    v.x += m;
    v.y = depth;
    // await Promise.all([
    //     ...Array(v.tree.children.length).map(
    //         (x, i) => second_walk(v.tree.children[i], m + v.mod, depth + 1)
    //         )
    // ]);
    for (let i = 0; i < v.tree.children.length; i++)
        second_walk(v.tree.children[i], m + v.mod, depth + 1);
    return 0;
};

/**
 * @param {DrawTree} vil 
 * @param {DrawTree} v 
 * @param {DrawTree} default_ancestor 
 */
const ancestor = (vil, v, default_ancestor) => {
    return v.tree.parent.tree.children.findIndex(x => x === vil.ancestor) !== -1 ?
        vil.ancestor : default_ancestor;
};


/**
 * @param {DrawTree} v 
 */
const execute_shifts = v => {
    let shift = 0;
    let change = 0;
    for (let i = v.tree.children.length; i >= 0; i--) {
        const w = v.tree.children[i];
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
    const w = v.left_brother();
    if (w === null) return default_ancestor;
    let vir = v;
    let vor = v;
    let vil = w;
    let vol = v.leftmost_sibling;
    let sir = v.mod;
    let sor = v.mod;
    let sil = vil.mod;
    let sol = vol.mod;
    while (vil.right() && vir.left()) {
        vil = vil.right()
        vir = vir.left()
        vol = vol.left()
        vor = vor.right()
        vor.ancestor = v;
        const shift = (vil.x + sil) - (vir.x + sir) + distance;
        if (shift > 0) {
            const a = ancestor(vil, v, default_ancestor);
            move_subtree(a, v, shift);
            sir = sir + shift;
            sor = sor + shift;
        }
        sil += vil.mod;
        sir += vir.mod;
        sol += vol.mod;
        sor += vor.mod;
    }
    if (vil.right() && !vor.right()) {
        vor.thread = vil.right();
        vor.mod += sil - sor;
    }
    else {
        if (vir.left() && !vol.left()) {
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

    if (v.tree.children.length == 0) {
        v.x = v.lmost_sibling ? v.lbrother().x + distance : 0;
    }
    else {
        let default_ancestor = v.tree.children[0];
        for (let i = 0; i < v.tree.children.length; i++) {
            firstwalk(v.tree.children[i]);
            default_ancestor = apportion(v.tree.children[i], default_ancestor, distance);
        }
        execute_shifts(v);

        midpoint = (v.tree.children[0].x + v.tree.children[v.tree.children.length - 1].x) / 2;

        ell = v.tree.children[0];
        arr = v.tree.children[v.tree.children.length - 1];
        w = v.lbrother();
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
    for (let i = 0; i < tree.tree.children.length; i++) {
        third_walk(tree.tree.children[i], n);
    }
};


/**
 * @param {DrawTree} tree 
 */
const buchheim = tree => {
    dt = firstwalk(new DrawTree(tree));
    min = second_walk(dt);
    if (min < 0) third_walk(dt, -min);
    return dt;
};

export { buchheim };