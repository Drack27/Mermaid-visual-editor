from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:8000/EditorMain.html", wait_until="networkidle")
        page.wait_for_selector("#visual-editor-svg g.node")

        # 1. Verify Subgraph Dragging
        page.locator("#add-subgraph-btn").click()
        subgraph = page.locator("g.subgraph").first
        expect(subgraph).to_be_visible()

        initial_transform = subgraph.get_attribute("transform")
        svg_box = page.locator("#visual-editor-svg").bounding_box()
        subgraph.drag_to(page.locator("#visual-editor-svg"), target_position={'x': svg_box['width'] / 2, 'y': svg_box['height'] / 2})

        expect(subgraph).not_to_have_attribute("transform", initial_transform)
        print("Subgraph dragging verified.")

        # 2. Verify Node Selection Logic
        node1 = page.locator("g.node").nth(0)
        node2 = page.locator("g.node").nth(1)

        node1.click()
        expect(node1).to_have_attribute("class", "node selected")
        expect(node2).to_have_attribute("class", "node")

        node2.click()
        expect(node1).to_have_attribute("class", "node")
        expect(node2).to_have_attribute("class", "node selected")

        node1.click(modifiers=["Control"])
        expect(node1).to_have_attribute("class", "node selected")
        expect(node2).to_have_attribute("class", "node selected")

        page.locator("#visual-editor-svg").click()
        expect(node1).to_have_attribute("class", "node")
        expect(node2).to_have_attribute("class", "node")
        print("Node selection logic verified.")

        # 3. Verify Backspace Does Not Delete Node When Editing
        node_to_edit = page.locator("g.node").nth(1)
        initial_node_count = page.locator("g.node").count()

        node_to_edit.dblclick()

        editor_textarea = page.locator(".text-editor-foreign-object textarea")
        expect(editor_textarea).to_be_visible()

        initial_text = editor_textarea.input_value()
        editor_textarea.press("Backspace")
        expect(editor_textarea).not_to_have_value(initial_text)

        page.locator("#visual-editor-svg").click()

        final_node_count = page.locator("g.node").count()
        assert initial_node_count == final_node_count, "A node was deleted while editing text"
        print("Backspace behavior verified.")

        # 4. Verify Link Selection
        page.locator("#visual-editor-svg").click()

        link_container = page.locator(".link-container").first
        link_hit_area = link_container.locator(".link-hit-area")
        link_visible_path = link_container.locator("path.link")

        link_hit_area.click()

        expect(link_visible_path).to_have_attribute("class", "link selected")
        print("Link selection verified.")

        print("\nAll verification steps passed successfully.")
        page.screenshot(path="jules-scratch/verification/bug_fixes_verified.png")

    except Exception as e:
        print(f"\nVerification failed: {e}")
        page.screenshot(path="jules-scratch/verification/verification_error.png")
        raise e
    finally:
        browser.close()

with sync_playwright() as p:
    run_verification(p)