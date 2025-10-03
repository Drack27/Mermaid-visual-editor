# Mermaid Visual Editor

The Mermaid Visual Editor is a user-friendly, web-based tool for creating and editing Mermaid flowcharts. It provides a drag-and-drop interface that allows users to build diagrams visually, without needing to write Mermaid code manually. The editor generates the corresponding Mermaid syntax in real-time, which can be copied and used in any Mermaid-supported platform.

## Features

-   **Visual Node Manipulation**: Add, delete, and select nodes with simple button clicks.
-   **Text Editing**: Easily edit the text content of any node.
-   **Node Resizing**: Resize nodes dynamically using intuitive drag handles that appear on selection.
-   **Text Wrapping**: Node text automatically wraps to fit within the node's boundaries.
-   **Draggable Nodes**: Reposition nodes anywhere on the canvas with a simple drag-and-drop action.
-   **Link Creation**: Create directional links between nodes by selecting a source and a target.
-   **Real-time Code Generation**: View the generated Mermaid `graph TD` syntax as you build your diagram.
-   **Copy to Clipboard**: A convenient "Copy" button to instantly copy the generated code.
-   **Performance Optimized**: Dragging and resizing operations are optimized to ensure a smooth user experience, even with complex diagrams.

## How to Use

1.  **Open the Editor**: Launch the `EditorMain` file in a modern web browser.
2.  **Add a Node**: Click the "Add Node" button. A new node with default text will appear on the canvas.
3.  **Select a Node**: Click on any node to select it. The selected node will be highlighted, and the "Edit Selected Node" panel will appear.
4.  **Edit Node Text**: With a node selected, type your desired text into the "Node Text" input field.
5.  **Resize a Node**: Click and drag the square handles that appear on the corners of a selected node to adjust its width and height.
6.  **Delete a Node**: Select a node and click the "Delete Node" button. This will also remove any links connected to it.
7.  **Create a Link**:
    -   Click the "Create Link" button.
    -   Click on the node you want the link to start from (the source).
    -   Click on the node you want the link to point to (the target).
8.  **Copy Mermaid Code**: The "Generated Mermaid Code" panel displays the live code for your diagram. Click the "Copy" button to copy the code to your clipboard.
9.  **Deselect**: To deselect a node or cancel an action, click on any empty space on the canvas.