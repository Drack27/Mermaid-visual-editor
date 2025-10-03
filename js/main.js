import * as state from './state.js';
import { initializeD3, renderD3 } from './d3-renderer.js';
import { initializeEventListeners } from './event-handlers.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeD3();
    initializeEventListeners();
    updateAll();
});

export function updateAll() {
    updateMermaidCode();
    renderD3();
}

export function updateMermaidCode() {
    const codeTextArea = document.getElementById('mermaid-code');
    let code = "";
    const comments = document.getElementById('comments-input').value.trim();

    // Case 1: No specific node is selected, place comments at the top.
    if (comments && state.selectedNodes.size !== 1) {
        comments.split('\n').forEach(line => {
            code += `%% ${line}\n`;
        });
    }

    code += "graph TD\n";

    const addCommentAfterNode = (node) => {
        let commentCode = "";
        // Case 2: A single node is selected, place comments after it.
        if (comments && state.selectedNodes.size === 1 && state.selectedNodes.has(node)) {
            const indent = node.subgraphId ? '        ' : '    ';
            comments.split('\n').forEach(line => {
                commentCode += `${indent}%% ${line}\n`;
            });
        }
        return commentCode;
    };

    const nodesBySubgraph = state.nodes.reduce((acc, node) => {
        const subgraphId = node.subgraphId || 'root';
        if (!acc[subgraphId]) {
            acc[subgraphId] = [];
        }
        acc[subgraphId].push(node);
        return acc;
    }, {});

    state.subgraphs.forEach(sg => {
        code += `    subgraph ${sg.id} ["${sg.title}"]\n`;
        const sgNodes = nodesBySubgraph[sg.id] || [];
        sgNodes.forEach(node => {
            const nodeText = node.text.replace(/"/g, '#quot;');
            code += `        ${node.id}["${nodeText}"]\n`;
            code += addCommentAfterNode(node);
        });
        code += `    end\n`;
    });

    const orphanNodes = nodesBySubgraph['root'] || [];
    orphanNodes.forEach(node => {
        const nodeText = node.text.replace(/"/g, '#quot;');
        code += `    ${node.id}["${nodeText}"]\n`;
        code += addCommentAfterNode(node);
    });

    state.links.forEach(link => {
        if (link.label) {
            const linkText = link.label.replace(/"/g, '#quot;');
            code += `    ${link.source} -- "${linkText}" --> ${link.target}\n`;
        } else {
            code += `    ${link.source} --> ${link.target}\n`;
        }
    });
    codeTextArea.value = code;
}