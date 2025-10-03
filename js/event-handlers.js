import * as state from './state.js';
import { renderD3 } from './d3-renderer.js';
import { generateUniqueId } from './utils.js';
// NOTE: avoid importing updateAll/updateMermaidCode from './main.js' to prevent a circular
// module dependency. Those functions are attached to window by main.js and accessed here
// as window.updateAll() / window.updateMermaidCode().

export function initializeEventListeners() {
    document.getElementById('add-node-btn').addEventListener('click', addNewNode);
    document.getElementById('add-subgraph-btn').addEventListener('click', addNewSubgraph);
    document.getElementById('create-link-btn').addEventListener('click', toggleLinkingMode);

    document.getElementById('node-text').addEventListener('input', (e) => {
        if (state.selectedNodes.size === 1) {
            const selectedNode = state.selectedNodes.values().next().value;
            selectedNode.text = e.target.value;
            if (typeof window.updateAll === 'function') window.updateAll();
        }
    });

    document.getElementById('node-subgraph').addEventListener('change', (e) => {
        if (state.selectedNodes.size === 1) {
            const selectedNode = state.selectedNodes.values().next().value;
            selectedNode.subgraphId = e.target.value || null;
            if (typeof window.updateAll === 'function') window.updateAll();
        }
    });

    document.getElementById('delete-node-btn').addEventListener('click', deleteSelected);

    document.getElementById('link-label').addEventListener('input', (e) => {
        if (state.selectedLinks.size === 1) {
            const selectedLink = state.selectedLinks.values().next().value;
            selectedLink.label = e.target.value;
            if (typeof window.updateAll === 'function') window.updateAll();
        }
    });

    document.getElementById('delete-link-btn').addEventListener('click', deleteSelected);

    document.getElementById('subgraph-title').addEventListener('input', (e) => {
        if (state.selectedSubgraph) {
            state.selectedSubgraph.title = e.target.value;
            if (typeof window.updateAll === 'function') window.updateAll();
        }
    });

    document.getElementById('delete-subgraph-btn').addEventListener('click', deleteSelected);

    document.getElementById('comments-input').addEventListener('input', () => {
        if (typeof window.updateMermaidCode === 'function') window.updateMermaidCode();
    });

    document.getElementById('copy-code-btn').addEventListener('click', () => {
        const codeTextArea = document.getElementById('mermaid-code');
        codeTextArea.select();
        document.execCommand('copy');
    });

    const svg = d3.select("#visual-editor-svg");

    // Handle deselection on simple click on the background
    svg.on('click', (event) => {
        if (event.target === svg.node() && !state.isLinking) {
            deselectAll();
        }
    });

    // Handle drag-to-select
    svg.call(d3.drag()
        .filter(event => !state.isLinking && event.target === svg.node()) // Only drag on background, and not in linking mode
        .on("start", (event) => {
            if (!event.sourceEvent.ctrlKey) {
                state.selectedNodes.clear();
                state.selectedLinks.clear();
                state.setSelectedSubgraph(null);
            }

            const [x, y] = d3.pointer(event, svg.node());
            svg.append("rect")
                .attr("class", "selection-box")
                .attr("x", x)
                .attr("y", y)
                .attr("width", 0)
                .attr("height", 0);

            renderD3();
        })
        .on("drag", (event) => {
            const selectionBox = svg.select(".selection-box");
            if (selectionBox.empty()) return;

            const startX = +selectionBox.attr("x");
            const startY = +selectionBox.attr("y");
            const [currentX, currentY] = d3.pointer(event, svg.node());

            const newX = Math.min(startX, currentX);
            const newY = Math.min(startY, currentY);
            const newWidth = Math.abs(currentX - startX);
            const newHeight = Math.abs(currentY - startY);

            selectionBox
                .attr("x", newX)
                .attr("y", newY)
                .attr("width", newWidth)
                .attr("height", newHeight);
        })
        .on("end", (event) => {
            const selectionBox = svg.select(".selection-box");
            if (selectionBox.empty()) return;

            const x1 = +selectionBox.attr("x");
            const y1 = +selectionBox.attr("y");
            const x2 = x1 + (+selectionBox.attr("width"));
            const y2 = y1 + (+selectionBox.attr("height"));

            state.nodes.forEach(node => {
                if (node.x >= x1 && node.x <= x2 && node.y >= y1 && node.y <= y2) {
                    if (!state.selectedNodes.has(node)) {
                       state.selectedNodes.add(node);
                    }
                }
            });

            state.links.forEach(link => {
                const sourceNode = state.nodes.find(n => n.id === link.source);
                const targetNode = state.nodes.find(n => n.id === link.target);
                if(sourceNode && targetNode) {
                    const midX = (sourceNode.x + targetNode.x) / 2;
                    const midY = (sourceNode.y + targetNode.y) / 2;
                    if (midX >= x1 && midX <= x2 && midY >= y1 && midY <= y2) {
                         if (!state.selectedLinks.has(link)) {
                            state.selectedLinks.add(link);
                         }
                    }
                }
            });

            selectionBox.remove();
            updateEditorPanels();
            renderD3();
        })
    );

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelected();
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            addNewNode();
        }
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            toggleLinkingMode();
        }
    });
}

function addNewNode() {
    const svg = d3.select("#visual-editor-svg");
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;

    const newNode = {
        id: generateUniqueId('node'),
        text: 'New Node',
        x: Math.random() * (width - 200) + 100,
        y: Math.random() * (height - 100) + 50,
        width: 120,
        height: 60,
        subgraphId: state.selectedSubgraph ? state.selectedSubgraph.id : null
    };
    state.nodes.push(newNode);
    selectNode(newNode, false); // Select only the new node
}

function addNewSubgraph() {
    const svg = d3.select("#visual-editor-svg");
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;

    const newSubgraph = {
        id: generateUniqueId('sg'),
        title: 'New Subgraph',
        x: Math.random() * (width - 400) + 100,
        y: Math.random() * (height - 400) + 100,
        width: 300,
        height: 250
    };
    state.subgraphs.push(newSubgraph);
    selectSubgraph(newSubgraph);
}

function toggleLinkingMode() {
    state.setLinking(!state.isLinking);
    if (state.isLinking) {
        deselectAll();
        state.setLinking(true); // deselectAll sets it to false
        state.setLinkStartNode(null);
        document.getElementById('create-link-btn').textContent = 'Cancel Linking';
        document.getElementById('create-link-btn').classList.replace('bg-green-500', 'bg-yellow-500');
        d3.select("#visual-editor-svg").classed('linking-cursor', true);
    } else {
        deselectAll();
    }
    updateAll();
}


export function selectNode(node, multiSelect = false) {
    if (!multiSelect) {
        deselectAll(true);
    }

    if (state.selectedNodes.has(node)) {
        state.selectedNodes.delete(node);
    } else {
        state.selectedNodes.add(node);
    }

    state.setSelectedSubgraph(null);
    updateEditorPanels();
    renderD3();
}

export function selectLink(link, multiSelect = false) {
    if (!multiSelect) {
        deselectAll(true);
    }

    if (state.selectedLinks.has(link)) {
        state.selectedLinks.delete(link);
    } else {
        state.selectedLinks.add(link);
    }

    state.setSelectedSubgraph(null);
    updateEditorPanels();
    renderD3();
}

export function selectSubgraph(subgraph) {
    deselectAll(true);
    state.setSelectedSubgraph(subgraph);
    updateEditorPanels();
    renderD3();
}

export function deselectAll(keepSelection = false) {
    if (!keepSelection) {
        state.selectedNodes.clear();
        state.selectedLinks.clear();
        state.setSelectedSubgraph(null);
    }
    state.setLinking(false);
    state.setLinkStartNode(null);

    const createLinkBtn = document.getElementById('create-link-btn');
    createLinkBtn.textContent = 'Create Links';
    createLinkBtn.classList.replace('bg-yellow-500', 'bg-green-500');
    d3.select("#visual-editor-svg").classed('linking-cursor', false);

    updateEditorPanels();
    updateAll();
}

function deleteSelected() {
    // Delete nodes
    state.setNodes(state.nodes.filter(n => !state.selectedNodes.has(n)));
    // Delete links connected to deleted nodes
    state.setLinks(state.links.filter(l =>
        !Array.from(state.selectedNodes).some(n => n.id === l.source || n.id === l.target)
    ));
    // Delete selected links
    state.setLinks(state.links.filter(l => !state.selectedLinks.has(l)));

    // Handle subgraph deletion
    if (state.selectedSubgraph) {
        state.nodes.forEach(n => {
            if (n.subgraphId === state.selectedSubgraph.id) {
                n.subgraphId = null;
            }
        });
        state.setSubgraphs(state.subgraphs.filter(sg => sg.id !== state.selectedSubgraph.id));
    }

    state.selectedNodes.clear();
    state.selectedLinks.clear();
    state.setSelectedSubgraph(null);

    deselectAll();
}

export function handleLinking(targetNode) {
    if (!state.linkStartNode) {
        state.setLinkStartNode(targetNode);
        document.getElementById('create-link-btn').textContent = '...Select Target';
    } else {
        if (state.linkStartNode.id !== targetNode.id) {
            const linkExists = state.links.some(l => (l.source === state.linkStartNode.id && l.target === targetNode.id));
            if (!linkExists) {
                state.links.push({ source: state.linkStartNode.id, target: targetNode.id, label: '' });
            }
        }
        // Reset for next link creation
        state.setLinkStartNode(null);
        document.getElementById('create-link-btn').textContent = 'Cancel Linking';
    }
    updateAll();
}

export function handleDoubleClick(d, type, element) {
    // If an editor is already open, don't open another one.
    if (d3.select('.text-editor-foreign-object').node()) return;

    const d3Element = d3.select(element);
    let textSelection, initialValue, getBBox, parent, onUpdate;

    if (type === 'node') {
        textSelection = d3Element.select('text');
        initialValue = d.text;
        getBBox = () => ({ x: 0, y: 0, width: d.width, height: d.height });
        parent = d3Element;
        onUpdate = (newValue) => { d.text = newValue; };
    } else if (type === 'subgraph') {
        textSelection = d3Element.select('text');
        initialValue = d.title;
        getBBox = () => {
            const textBBox = textSelection.node().getBBox();
            // Center the editor on the text
            return {
                x: textBBox.x + textBBox.width / 2 - 75, // 150px width
                y: textBBox.y,
                width: 150,
                height: textBBox.height + 4
            };
        };
        parent = d3Element;
        onUpdate = (newValue) => { d.title = newValue; };
    } else if (type === 'link') {
        const linkLabels = d3.select('g.links').selectAll('text.link-label');
        textSelection = linkLabels.filter(ld => ld === d);
        initialValue = d.label || '';

        getBBox = () => {
            const sourceNode = state.nodes.find(n => n.id === d.source);
            const targetNode = state.nodes.find(n => n.id === d.target);
            const x = (sourceNode.x + targetNode.x) / 2 - 50; // 100px width
            const y = (sourceNode.y + targetNode.y) / 2 - 15; // 30px height
            return { x, y, width: 100, height: 30 };
        };
        parent = d3.select('g.links');
        onUpdate = (newValue) => { d.label = newValue; };
    }

    if (!textSelection) return;

    // Hide original text
    textSelection.style('visibility', 'hidden');

    const bbox = getBBox();
    const foreignObject = parent.append('foreignObject')
        .attr('class', 'text-editor-foreign-object')
        .attr('x', bbox.x)
        .attr('y', bbox.y)
        .attr('width', bbox.width)
        .attr('height', bbox.height);

    // Using a textarea for better text wrapping and editing experience
    const editor = foreignObject.append('xhtml:textarea')
        .style('width', `${bbox.width}px`)
        .style('height', `${bbox.height}px`)
        .style('background-color', 'var(--color-node-bg)')
        .style('border', '1px solid var(--color-accent)')
        .style('color', 'var(--color-text-primary)')
        .style('font-family', 'inherit')
        .style('font-size', 'inherit')
        .style('text-align', 'center')
        .style('resize', 'none')
        .style('padding', '5px')
        .style('overflow', 'hidden')
        .text(initialValue);

    editor.node().focus();
    editor.node().select();

    const cleanup = () => {
        foreignObject.remove();
        textSelection.style('visibility', 'visible');
    };

    editor.on('blur', function() {
        onUpdate(this.value);
        cleanup();
        updateAll();
    });

    editor.on('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.blur();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            // Don't save changes on escape
            cleanup();
            renderD3();
        }
    });
}

function updateEditorPanels() {
    // Hide all editors by default
    document.getElementById('node-editor').classList.add('hidden');
    document.getElementById('link-editor').classList.add('hidden');
    document.getElementById('subgraph-editor').classList.add('hidden');

    // Show node editor if exactly one node is selected
    if (state.selectedNodes.size === 1) {
        const node = state.selectedNodes.values().next().value;
        document.getElementById('node-editor').classList.remove('hidden');
        document.getElementById('node-text').value = node.text;
        document.getElementById('node-id').value = node.id;

        const subgraphSelect = document.getElementById('node-subgraph');
        subgraphSelect.innerHTML = '<option value="">None</option>';
        state.subgraphs.forEach(sg => {
            const option = document.createElement('option');
            option.value = sg.id;
            option.textContent = sg.title;
            subgraphSelect.appendChild(option);
        });
        subgraphSelect.value = node.subgraphId || '';
    }

    // Show link editor if exactly one link is selected
    if (state.selectedLinks.size === 1) {
        const link = state.selectedLinks.values().next().value;
        document.getElementById('link-editor').classList.remove('hidden');
        document.getElementById('link-label').value = link.label;
    }

    // Show subgraph editor if a subgraph is selected
    if (state.selectedSubgraph) {
        document.getElementById('subgraph-editor').classList.remove('hidden');
        document.getElementById('subgraph-title').value = state.selectedSubgraph.title;
        document.getElementById('subgraph-id').value = state.selectedSubgraph.id;
    }
}