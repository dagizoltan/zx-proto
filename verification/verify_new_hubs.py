from playwright.sync_api import sync_playwright, expect
import time

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Login
            page.goto("http://localhost:8000/login")
            page.fill("input[name='email']", "admin@imsshop.com")
            page.fill("input[name='password']", "password123")
            page.click("button[type='submit']")
            page.wait_for_url("http://localhost:8000/ims/dashboard")

            # Check Communication Hub - Feed
            page.goto("http://localhost:8000/ims/communication/feed")
            expect(page.get_by_role("heading", name="Activity Feed")).to_be_visible()
            page.screenshot(path="verification/communication_feed.png")
            print("Captured Feed screenshot")

            # Check Communication Hub - Messages
            page.goto("http://localhost:8000/ims/communication/messages")
            expect(page.get_by_role("heading", name="Messages")).to_be_visible()
            page.screenshot(path="verification/communication_messages.png")
            print("Captured Messages screenshot")

            # Check Observability - Logs
            page.goto("http://localhost:8000/ims/observability/logs")
            expect(page.get_by_role("heading", name="Observability")).to_be_visible()
            # Expect System Logs table
            expect(page.get_by_role("table")).to_be_visible()
            page.screenshot(path="verification/observability_logs.png")
            print("Captured Logs screenshot")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
