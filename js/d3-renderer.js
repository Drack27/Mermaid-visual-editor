import * as state from './state.js';
import { handleLinking, selectNode, selectLink, selectSubgraph, handleDoubleClick } from './event-handlers.js';
import { updateAll } from './main.js';

let svg, nodeGroup, linkGroup, subgraphGroup;

const handleSize = 8;
const resizeHandles = [
    { position: 'top-left', cursor: 'nwse-resize' },
    { position: 'top-right', cursor: 'nesw-resize' },
    { position: 'bottom-left', cursor: 'nesw-resize' },
    { position: 'bottom-right', cursor: 'nwse-resize' }
];

export function initializeD3() {
    svg = d3.select("#visual-editor-svg");
    subgraphGroup = svg.append("g").attr("class", "subgraphs");
    linkGroup = svg.append("g").attr("class", "links");
    nodeGroup = svg.append("g").attr("class", "nodes");

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
}

// Bugfix: Links were hard to click because the visible path is very thin.
// Solution: Create a wider, invisible "hit area" path for each link and attach the
// event listeners to it. Both paths are wrapped in a <g> container.
function updateLinkPaths() {
    const linkContainerSelection = linkGroup.selectAll("g.link-container")
        .data(state.links, d => `${d.source}-${d.target}`);

    linkContainerSelection.exit().remove();

    const linkContainerEnter = linkContainerSelection.enter().append("g")
        .attr("class", "link-container");

    // The visible path
    linkContainerEnter.append("path")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)");

    // The invisible, wider hit area
    linkContainerEnter.append("path")
        .attr("class", "link-hit-area")
        .on('click', (event, d) => {
            event.stopPropagation();
            selectLink(d, event.ctrlKey);
        })
        .on('dblclick', function(event, d) {
            event.stopPropagation();
            const label = linkGroup.selectAll("text.link-label").filter(ld => ld === d).node();
            handleDoubleClick(d, 'link', label || this);
        });


    const allLinkContainers = linkContainerEnter.merge(linkContainerSelection);

    // Update the visible path class
    allLinkContainers.select("path.link")
        .attr("class", d => `link ${state.selectedLinks.has(d) ? 'selected' : ''}`);

    const pathGenerator = d => {
        const sourceNode = state.nodes.find(n => n.id === d.source);
        const targetNode = state.nodes.find(n => n.id === d.target);
        if (!sourceNode || !targetNode) return "";

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const gamma = Math.atan2(dy, dx);

        const getIntersection = (node, angle) => {
            const w = node.width / 2;
            const h = node.height / 2;
            const tan_gamma = Math.tan(angle);
            let x, y;
            if (Math.abs(h * Math.cos(angle)) > Math.abs(w * Math.sin(angle))) {
                x = w * (Math.cos(angle) > 0 ? 1 : -1) + node.x;
                y = w * (Math.cos(angle) > 0 ? 1 : -1) * tan_gamma + node.y;
            } else {
                y = h * (Math.sin(angle) > 0 ? 1 : -1) + node.y;
                x = h * (Math.sin(angle) > 0 ? 1 : -1) / tan_gamma + node.x;
            }
            return { x, y };
        };

        const sourcePoint = getIntersection(sourceNode, gamma);
        const targetPoint = getIntersection(targetNode, gamma + Math.PI);

        return `M${sourcePoint.x},${sourcePoint.y}L${targetPoint.x},${targetPoint.y}`;
    };

    // Apply the path to both the visible link and the hit area
    allLinkContainers.selectAll("path")
        .attr("d", pathGenerator);
}

function updateLinkLabels() {
     linkGroup.selectAll("text.link-label")
        .data(state.links, d => `${d.source}-${d.target}`)
        .join("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("dy", "-4")
        .text(d => d.label)
        .attr("x", d => {
            const sourceNode = state.nodes.find(n => n.id === d.source);
            const targetNode = state.nodes.find(n => n.id === d.target);
            if (!sourceNode || !targetNode) return 0;
            return (sourceNode.x + targetNode.x) / 2;
        })
        .attr("y", d => {
            const sourceNode = state.nodes.find(n => n.id === d.source);
            const targetNode = state.nodes.find(n => n.id === d.target);
            if (!sourceNode || !targetNode) return 0;
            return (sourceNode.y + targetNode.y) / 2;
        });
}

function updateSubgraphRects() {
    const subgraphSelection = subgraphGroup.selectAll("g.subgraph").data(state.subgraphs, d => d.id);

    subgraphSelection.attr('transform', d => `translate(${d.x}, ${d.y})`);

    subgraphSelection.select('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height);

    const titleHeight = 30;
    subgraphSelection.select('text')
        .attr('x', d => d.width / 2)
        .attr('y', titleHeight / 2);
}

export function renderD3() {
    if (!svg) return;
    // Render subgraphs
    const subgraphSelection = subgraphGroup.selectAll("g.subgraph").data(state.subgraphs, d => d.id);
    subgraphSelection.exit().remove();

    const subgraphEnter = subgraphSelection.enter().append("g")
        .attr("class", "subgraph")
        .on('click', (event, d) => {
            event.stopPropagation();
            selectSubgraph(d);
        })
        .on('dblclick', function(event, d) {
            event.stopPropagation();
            handleDoubleClick(d, 'subgraph', this);
        })
        .call(d3.drag()
            .on("start", subgraphDragStarted)
            .on("drag", subgraphDragged)
            .on("end", subgraphDragEnded));
    subgraphEnter.append("rect");
    subgraphEnter.append("text").attr("text-anchor", "middle");

    subgraphEnter.merge(subgraphSelection)
        .attr("class", d => `subgraph ${state.selectedSubgraph === d ? 'selected' : ''}`)
        .select("text").text(d => d.title);

    // Render nodes
    const nodeSelection = nodeGroup.selectAll("g.node").data(state.nodes, d => d.id);
    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection.enter().append("g").attr("class", "node");
    nodeEnter.append("rect");

    // Use foreignObject for text wrapping
    const fo = nodeEnter.append('foreignObject')
        .attr('class', 'node-text-fo');

    fo.append('xhtml:div')
        .attr('class', 'node-text-wrapper')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('text-align', 'center')
        .style('width', '100%')
        .style('height', '100%')
        .style('padding', '5px')
        .style('box-sizing', 'border-box')
        .style('line-height', '1.2')
        // Bugfix: The foreignObject for text was capturing pointer events,
        // preventing the node's <g> element from receiving the click.
        // This ensures the click passes through to the intended target.
        .style('pointer-events', 'none');

    const allNodes = nodeEnter.merge(nodeSelection);

    allNodes
        .attr("transform", d => `translate(${d.x - d.width/2},${d.y - d.height/2})`)
        .attr("class", d => {
            let classes = 'node';
            if (state.selectedNodes.has(d)) classes += ' selected';
            if (state.linkStartNode && d.id === state.linkStartNode.id) classes += ' linking-source';
            return classes;
        });

    // Auto-resize logic based on text content
    allNodes.each(function(d) {
        const nodeElement = d3.select(this);
        const textWrapper = nodeElement.select('.node-text-wrapper');

        // Set content to measure
        textWrapper.html(d.text);
        // Set initial width for calculation
        textWrapper.style('width', `${d.width}px`);

        const scrollHeight = textWrapper.node().scrollHeight;
        const baseHeight = 60; // Corresponds to default node height
        const lineHeight = 20; // Approximate, should match CSS line-height effects
        const maxVHeight = baseHeight - 10 + (lineHeight * 2); // Base for one line + 2 more lines

        let newHeight = Math.max(baseHeight, scrollHeight + 15); // +15 for padding
        let newWidth = d.width;

        // If height exceeds max for 3 lines, cap height and expand width
        if (newHeight > maxVHeight) {
            newHeight = maxVHeight;
            let tempWidth = newWidth;
            // Temporarily un-set height style to measure natural height at new widths
            textWrapper.style('height', 'auto');

            while (textWrapper.node().scrollHeight > maxVHeight && tempWidth < 500) { // Safety break at 500px
                tempWidth += 10;
                textWrapper.style('width', `${tempWidth}px`);
            }
            newWidth = tempWidth;
        }

        // Update data for this node
        d.width = newWidth;
        d.height = newHeight;
    });

    // Apply the new dimensions to the visuals
    allNodes.select("rect")
        .attr("width", d => d.width)
        .attr("height", d => d.height);

    allNodes.select('.node-text-fo')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .select('.node-text-wrapper')
        .style('height', '100%') // Re-apply fixed height for flex centering
        .html(d => d.text);

    allNodes
        .on("click", (event, d) => {
            event.stopPropagation();
            if (state.isLinking) {
                handleLinking(d);
            } else {
                selectNode(d, event.ctrlKey);
            }
        })
        .on('dblclick', function(event, d) {
            event.stopPropagation();
            handleDoubleClick(d, 'node', this);
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    updateLinkPaths();
    updateLinkLabels();
    updateSubgraphRects();
    renderResizeHandles();
}

function renderResizeHandles() {
    subgraphGroup.selectAll('.resize-handle').remove();

    if (!state.selectedSubgraph) return;

    const selectedSubgraphGroup = subgraphGroup.selectAll("g.subgraph")
        .filter(d => d === state.selectedSubgraph);

    if (selectedSubgraphGroup.empty()) return;

    const subgraphData = state.selectedSubgraph;

    const resizeDrag = d3.drag()
        .on('start', function(event) {
            event.sourceEvent.stopPropagation();
        })
        .on('drag', function(event, handleData) {
            const minSize = 50;
            const { dx, dy } = event;

            if (handleData.position.includes('right')) {
                const newWidth = subgraphData.width + dx;
                if (newWidth >= minSize) subgraphData.width = newWidth;
            } else if (handleData.position.includes('left')) {
                const newWidth = subgraphData.width - dx;
                if (newWidth >= minSize) {
                    subgraphData.width = newWidth;
                    subgraphData.x += dx;
                }
            }

            if (handleData.position.includes('bottom')) {
                const newHeight = subgraphData.height + dy;
                if (newHeight >= minSize) subgraphData.height = newHeight;
            } else if (handleData.position.includes('top')) {
                const newHeight = subgraphData.height - dy;
                if (newHeight >= minSize) {
                    subgraphData.height = newHeight;
                    subgraphData.y += dy;
                }
            }
            renderD3();
        })
        .on('end', updateAll);

    selectedSubgraphGroup.selectAll('.resize-handle')
        .data(resizeHandles)
        .enter().append('rect')
        .attr('class', 'resize-handle')
        .attr('width', handleSize)
        .attr('height', handleSize)
        .style('fill', 'var(--color-accent)')
        .style('cursor', d => d.cursor)
        .attr('x', d => d.position.includes('left') ? -handleSize / 2 : subgraphData.width - handleSize / 2)
        .attr('y', d => d.position.includes('top') ? -handleSize / 2 : subgraphData.height - handleSize / 2)
        .call(resizeDrag);
}


// --- Drag Handling ---
function dragstarted(event, d) {
    d3.select(this).raise().classed("active", true);
}

function dragged(event, d) {
    let newX = event.x;
    let newY = event.y;

    if (d.subgraphId) {
        const parentSubgraph = state.subgraphs.find(sg => sg.id === d.subgraphId);
        if (parentSubgraph) {
            const nodeWidth = d.width;
            const nodeHeight = d.height;

            // Calculate the bounding box for the node's center
            const minX = parentSubgraph.x + nodeWidth / 2;
            const maxX = parentSubgraph.x + parentSubgraph.width - nodeWidth / 2;
            const minY = parentSubgraph.y + nodeHeight / 2;
            const maxY = parentSubgraph.y + parentSubgraph.height - nodeHeight / 2;

            // Clamp the new position to within the subgraph boundaries
            newX = Math.max(minX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));
        }
    }

    d.x = newX;
    d.y = newY;

    d3.select(this).attr("transform", `translate(${d.x - d.width/2},${d.y - d.height/2})`);
    updateLinkPaths();
    updateLinkLabels();
}

function dragended(event, d) {
    d3.select(this).classed("active", false);

    // Check if the node is dropped into a subgraph
    const nodeX = d.x;
    const nodeY = d.y;
    let parentFound = false;

    // Iterate subgraphs in reverse order to check the topmost one first
    for (const sg of [...state.subgraphs].reverse()) {
        if (nodeX > sg.x && nodeX < sg.x + sg.width &&
            nodeY > sg.y && nodeY < sg.y + sg.height) {

            d.subgraphId = sg.id;
            parentFound = true;
            break; // Found parent, no need to check others
        }
    }

    if (!parentFound) {
        d.subgraphId = null; // Release from any subgraph if dropped outside
    }

    updateAll();
}

// --- Subgraph Drag Handling ---
// Bugfix: Original drag logic only moved child nodes, not the subgraph container itself.
// It also used a confusing and unnecessary `dragStartPositions` map.
// The new logic is simpler: on drag, update the position of the subgraph and all its
// children by the same delta (dx, dy).
function subgraphDragStarted(event, d) {
    d3.select(this).raise().classed("active", true);
}

function subgraphDragged(event, d) {
    const { dx, dy } = event;

    // Move the subgraph itself
    d.x += dx;
    d.y += dy;

    // Move its child nodes
    const childNodes = state.nodes.filter(n => n.subgraphId === d.id);
    childNodes.forEach(node => {
        node.x += dx;
        node.y += dy;
    });

    updateAll(); // Re-render everything to show movement
}

function subgraphDragEnded(event, d) {
    d3.select(this).classed("active", false);
    updateAll(); // Final update to ensure state is saved
}