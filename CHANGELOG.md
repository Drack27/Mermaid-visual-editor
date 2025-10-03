# Changelog

This document details the major changes and feature implementations for the Mermaid Visual Editor.

## Version 2.0.0 - Major Overhaul

This release introduces a complete UI overhaul, major feature enhancements, and a significant code refactoring for better maintainability and future development.

### ✨ New Features

*   **Dark Theme:** The entire application now uses a modern, readable dark theme.
*   **Advanced Selection:**
    *   **Multi-Select:** Users can now select multiple items using `Ctrl+Click`.
    *   **Drag-to-Select:** A selection box can be drawn on the canvas to select multiple nodes and links at once.
*   **In-Canvas Text Editing:**
    *   Users can now **double-click** directly on nodes, link labels, and subgraph titles to edit their text in place, removing the need to use the side panel for quick edits.
*   **Node Text Wrapping & Resizing:**
    *   Node text now automatically wraps.
    *   Nodes will expand vertically to fit up to three lines of text. If more text is added, the node will then expand horizontally to accommodate it.
*   **Advanced Subgraph Functionality:**
    *   **Draggable Subgraphs:** Subgraphs can be dragged around the canvas, and all nodes contained within them will move as a single unit.
    *   **Resizable Subgraphs:** Selected subgraphs now display resize handles at their corners, allowing users to change their size.
    *   **Node Locking:** Nodes are now locked within the boundaries of their parent subgraph and cannot be dragged out.
    *   **Automatic Association:** Dragging a node and dropping it inside a subgraph now automatically associates it with that subgraph.
*   **Content Creation Shortcuts & Modes:**
    *   **New Node Shortcut:** `Ctrl+N` now creates a new node.
    *   **"Create Links" Mode:** The link creation tool is now a persistent mode toggled by the "Create Links" button or `Ctrl+L`. In this mode, users can create multiple links by repeatedly single-clicking a source and a target node.
*   **Improved Comment Placement:** The "Add Comment" feature now inserts comments directly after the currently selected node in the Mermaid code. If no node is selected, comments are placed at the top as before.

### 🎨 UI/UX Improvements

*   **Updated Instructions:** The main instruction text in the header has been updated to be clearer and to reflect the new application features.
*   **Keyboard Shortcut Hints:** The UI now displays hints for the `Ctrl+N`, `Ctrl+L`, and `Delete`/`Backspace` shortcuts next to their corresponding controls.

### 🔧 Code & Refactoring

*   **JavaScript Refactoring:** The entire JavaScript codebase has been refactored from a single inline script into a modular structure within the `js/` directory. This includes separate modules for state management (`state.js`), D3 rendering (`d3-renderer.js`), event handling (`event-handlers.js`), utilities (`utils.js`), and a main entry point (`main.js`). This greatly improves code organization and maintainability.
*   **Data-Driven Subgraphs:** Subgraphs are no longer just calculated boundaries but are now independent objects with their own position and dimensions (`x`, `y`, `width`, `height`), enabling the new resizing and dragging features.