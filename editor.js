// --- State Management ---
let nodes = [
    { id: 'A', text: 'Start Here', x: 150, y: 100, width: 120, height: 60 },
    { id: 'B', text: 'Go Left or Right?', x: 150, y: 250, width: 150, height: 60 },
];
let links = [
    { source: 'A', target: 'B' }
];
let selectedNode = null;
let selectedLink = null;
let isLinking = false;
let linkStartNode = null;

// --- Constants ---
const handleSize = 10;
const resizeHandles = [
    { position: 'top-left', cursor: 'nwse-resize' },
    { position: 'top-right', cursor: 'nesw-resize' },
    { position: 'bottom-left', cursor: 'nesw-resize' },
    { position: 'bottom-right', cursor: 'nwse-resize' }
];

// --- D3 Setup ---
const svg = d3.select("#visual-editor-svg");
const width = svg.node().getBoundingClientRect().width;
const height = svg.node().getBoundingClientRect().height;

const linkGroup = svg.append("g").attr("class", "links");
const nodeGroup = svg.append("g").attr("class", "nodes");

svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 19)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("class", "arrowhead");

// --- Core Functions ---
function updateAll() {
    renderD3();
    updateMermaidCode();
}

function generateUniqueId() {
    return `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function updateMermaidCode() {
    const codeTextArea = document.getElementById('mermaid-code');
    let code = "graph TD\n";
    nodes.forEach(node => {
        const nodeText = node.text.replace(/"/g, '#quot;');
        code += `    ${node.id}["${nodeText}"]\n`;
    });
    links.forEach(link => {
        code += `    ${link.source} --> ${link.target}\n`;
    });
    codeTextArea.value = code;
}

// --- D3 Rendering & Geometry ---
const getIntersection = (node, angle) => {
    const w = node.width / 2;
    const h = node.height / 2;
    const tanAngle = Math.tan(angle);
    const cornerAngle = Math.atan2(h, w);

    if (Math.abs(angle) <= cornerAngle) {
        return { x: node.x + w, y: node.y + w * tanAngle };
    } else if (Math.abs(angle) >= Math.PI - cornerAngle) {
        return { x: node.x - w, y: node.y - w * tanAngle };
    } else if (angle > cornerAngle && angle < Math.PI - cornerAngle) {
        return { x: node.x + h / tanAngle, y: node.y + h };
    } else {
        return { x: node.x - h / tanAngle, y: node.y - h };
    }
};

function calculateLinkPath(d) {
    const sourceNode = nodes.find(n => n.id === d.source);
    const targetNode = nodes.find(n => n.id === d.target);
    if (!sourceNode || !targetNode) return "";

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const gamma = Math.atan2(dy, dx);

    const sourcePoint = getIntersection(sourceNode, gamma);
    const targetPoint = getIntersection(targetNode, gamma + Math.PI);

    return `M${sourcePoint.x},${sourcePoint.y}L${targetPoint.x},${targetPoint.y}`;
}

function updateLinkPaths() {
    linkGroup.selectAll("path.link")
        .data(links, d => `${d.source}-${d.target}`)
        .join("path")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)")
        .attr("d", calculateLinkPath);
}

function renderD3() {
    const nodeSelection = nodeGroup.selectAll("g.node").data(nodes, d => d.id);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection.enter().append("g").attr("class", "node");
    nodeEnter.append("rect");
    nodeEnter.append("foreignObject")
        .attr('class', 'node-text-container')
        .append("xhtml:div")
        .attr("class", "node-text-wrapper");

    const allNodes = nodeEnter.merge(nodeSelection);

    allNodes
        .attr("transform", d => `translate(${d.x - d.width/2},${d.y - d.height/2})`)
        .attr("class", d => `node ${d === selectedNode ? 'selected' : ''} ${linkStartNode && d.id === linkStartNode.id ? 'linking-source' : ''}`);

    allNodes.select("rect:not(.resize-handle)")
        .attr("width", d => d.width)
        .attr("height", d => d.height);

    allNodes.select(".node-text-container")
        .attr("width", d => d.width)
        .attr("height", d => d.height)
        .select(".node-text-wrapper")
        .text(d => d.text);

    allNodes
        .on("click", (event, d) => {
            event.stopPropagation();
            if (isLinking) {
                handleLinking(d);
            } else {
                selectNode(d);
            }
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // --- Resize Handles ---
    allNodes.selectAll('.resize-handle').remove();
    const selectedNodeGroup = allNodes.filter(d => d === selectedNode);

    if (!selectedNodeGroup.empty()) {
        const nodeData = selectedNodeGroup.datum();
        const resizeDrag = d3.drag()
            .on('start', function(event) {
                event.sourceEvent.stopPropagation();
            })
            .on('drag', function(event, handleData) {
                const minWidth = 80;
                const minHeight = 50;
                const { dx, dy } = event;

                if (handleData.position.includes('right')) {
                    const newWidth = nodeData.width + dx;
                    if (newWidth >= minWidth) {
                        nodeData.width = newWidth;
                        nodeData.x += dx / 2;
                    }
                } else if (handleData.position.includes('left')) {
                    const newWidth = nodeData.width - dx;
                    if (newWidth >= minWidth) {
                        nodeData.width = newWidth;
                        nodeData.x += dx / 2;
                    }
                }

                if (handleData.position.includes('bottom')) {
                    const newHeight = nodeData.height + dy;
                    if (newHeight >= minHeight) {
                        nodeData.height = newHeight;
                        nodeData.y += dy / 2;
                    }
                } else if (handleData.position.includes('top')) {
                    const newHeight = nodeData.height - dy;
                    if (newHeight >= minHeight) {
                        nodeData.height = newHeight;
                        nodeData.y += dy / 2;
                    }
                }

                // Update visuals in real-time
                selectedNodeGroup.attr('transform', `translate(${nodeData.x - nodeData.width/2}, ${nodeData.y - nodeData.height/2})`);
                selectedNodeGroup.select('rect:not(.resize-handle)').attr('width', nodeData.width).attr('height', nodeData.height);
                selectedNodeGroup.select('.node-text-container').attr('width', nodeData.width).attr('height', nodeData.height);

                selectedNodeGroup.selectAll('.resize-handle')
                    .attr('x', d => d.position.includes('left') ? -handleSize/2 : nodeData.width - handleSize/2)
                    .attr('y', d => d.position.includes('top') ? -handleSize/2 : nodeData.height - handleSize/2);

                linkGroup.selectAll('path.link')
                    .filter(linkData => linkData.source === nodeData.id || linkData.target === nodeData.id)
                    .attr('d', calculateLinkPath);
            })
            .on('end', updateMermaidCode);

        selectedNodeGroup.selectAll('.resize-handle')
            .data(resizeHandles)
            .enter().append('rect')
            .attr('class', 'resize-handle')
            .attr('width', handleSize)
            .attr('height', handleSize)
            .attr('x', d => d.position.includes('left') ? -handleSize/2 : nodeData.width - handleSize/2)
            .attr('y', d => d.position.includes('top') ? -handleSize/2 : nodeData.height - handleSize/2)
            .style('cursor', d => d.cursor)
            .call(resizeDrag);
    }
    updateLinkPaths();
}

// --- Drag Handling ---
function dragstarted(event, d) {
    d3.select(this).raise().classed("active", true);
}

function dragged(event, d) {
    d.x = event.x;
    d.y = event.y;
    d3.select(this).attr("transform", `translate(${d.x - d.width/2},${d.y - d.height/2})`);

    linkGroup.selectAll('path.link')
        .filter(linkData => linkData.source === d.id || linkData.target === d.id)
        .attr('d', calculateLinkPath);
}

function dragended(event, d) {
    d3.select(this).classed("active", false);
    updateAll();
}

// --- Node & Link Management ---
function selectNode(node) {
    selectedNode = node;
    document.getElementById('node-editor').classList.remove('hidden');
    document.getElementById('node-text').value = node.text;
    document.getElementById('node-id').value = node.id;
    updateAll();
}

function deselectAll() {
    selectedNode = null;
    selectedLink = null;
    document.getElementById('node-editor').classList.add('hidden');
    isLinking = false;
    linkStartNode = null;
    document.getElementById('create-link-btn').textContent = 'Create Link';
    document.getElementById('create-link-btn').classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
    document.getElementById('create-link-btn').classList.add('bg-green-500', 'hover:bg-green-600');
    svg.classed('linking-cursor', false);
    updateAll();
}

function handleLinking(targetNode) {
    if (!linkStartNode) {
        linkStartNode = targetNode;
        document.getElementById('create-link-btn').textContent = '...Select Target Node';
        updateAll();
    } else {
        if (linkStartNode.id !== targetNode.id) {
            const linkExists = links.some(l => (l.source === linkStartNode.id && l.target === targetNode.id));
            if (!linkExists) {
                links.push({ source: linkStartNode.id, target: targetNode.id });
            }
        }
        deselectAll();
    }
}

// --- Event Listeners ---
document.getElementById('add-node-btn').addEventListener('click', () => {
    const newNode = {
        id: generateUniqueId(),
        text: 'New Node',
        x: Math.random() * (width - 200) + 100,
        y: Math.random() * (height - 100) + 50,
        width: 120,
        height: 60,
    };
    nodes.push(newNode);
    selectNode(newNode);
});

document.getElementById('create-link-btn').addEventListener('click', () => {
    isLinking = !isLinking;
    if (isLinking) {
        selectedNode = null;
        linkStartNode = null;
        document.getElementById('node-editor').classList.add('hidden');
        document.getElementById('create-link-btn').textContent = 'Cancel Linking';
        document.getElementById('create-link-btn').classList.remove('bg-green-500', 'hover:bg-green-600');
        document.getElementById('create-link-btn').classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        svg.classed('linking-cursor', true);
        updateAll();
    } else {
        deselectAll();
    }
});

document.getElementById('node-text').addEventListener('input', (e) => {
    if (selectedNode) {
        selectedNode.text = e.target.value;
        updateAll();
    }
});

document.getElementById('delete-node-btn').addEventListener('click', () => {
    if (selectedNode) {
        nodes = nodes.filter(n => n.id !== selectedNode.id);
        links = links.filter(l => l.source !== selectedNode.id && l.target !== selectedNode.id);
        deselectAll();
    }
});

document.getElementById('copy-code-btn').addEventListener('click', () => {
    const codeTextArea = document.getElementById('mermaid-code');
    codeTextArea.select();
    document.execCommand('copy');
});

svg.on('click', () => {
    if (!isLinking) {
        deselectAll();
    }
});

// --- Initial Load ---
updateAll();