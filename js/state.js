// --- State Management ---
export let nodes = [
    { id: 'A', text: 'Start Here', x: 150, y: 100, width: 120, height: 60, subgraphId: null },
    { id: 'B', text: 'Go Left or Right?', x: 150, y: 250, width: 150, height: 60, subgraphId: null },
];
export let links = [
    { source: 'A', target: 'B', label: 'Connection' }
];
export let subgraphs = [];

export let selectedNodes = new Set();
export let selectedLinks = new Set();
export let selectedSubgraph = null;

export let isLinking = false;
export let linkStartNode = null;

// Functions to modify state
export function setNodes(newNodes) {
    nodes = newNodes;
}

export function setLinks(newLinks) {
    links = newLinks;
}

export function setSubgraphs(newSubgraphs) {
    subgraphs = newSubgraphs;
}

export function setSelectedNodes(newSelection) {
    selectedNodes = newSelection;
}

export function setSelectedLinks(newSelection) {
    selectedLinks = newSelection;
}

export function setSelectedSubgraph(newSelection) {
    selectedSubgraph = newSelection;
}

export function setLinking(value) {
    isLinking = value;
}

export function setLinkStartNode(node) {
    linkStartNode = node;
}