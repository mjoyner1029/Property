#!/usr/bin/env python3

import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def test_profile_page():
    print("🧪 Testing Profile Page Functionality")
    print("=" * 50)
    
    # Setup Chrome options
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        driver.get('http://localhost:3000')
        
        print("✅ Opened frontend")
        
        # Wait for login form
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        password_input = driver.find_element(By.NAME, "password")
        login_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        print("✅ Found login form")
        
        # Login as admin
        email_input.send_keys("admin@example.com")
        password_input.send_keys("Password123!")
        login_btn.click()
        
        print("🔐 Attempted login")
        
        # Wait for dashboard to load
        WebDriverWait(driver, 10).until(
            EC.url_contains("/dashboard")
        )
        print("✅ Reached dashboard")
        
        # Navigate to profile
        driver.get('http://localhost:3000/profile')
        
        # Wait for profile page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TEXT, "My Profile"))
        )
        print("✅ Profile page loaded")
        
        # Check if user data is displayed
        try:
            name_field = driver.find_element(By.CSS_SELECTOR, "input[label='Full Name'], input[name='fullName']")
            email_field = driver.find_element(By.CSS_SELECTOR, "input[label='Email Address'], input[name='email']")
            
            name_value = name_field.get_attribute('value')
            email_value = email_field.get_attribute('value')
            
            print(f"📝 Profile data found:")
            print(f"   Name: '{name_value}'")
            print(f"   Email: '{email_value}'")
            
            if name_value and email_value:
                print("✅ Profile page is populated with user data")
            else:
                print("❌ Profile page is empty - user data not loaded")
                
        except Exception as e:
            print(f"❌ Could not find profile form fields: {e}")
            
            # Take a screenshot for debugging
            driver.save_screenshot("/tmp/profile_page_debug.png")
            print("📸 Saved screenshot to /tmp/profile_page_debug.png")
            
            # Print page source for debugging
            print("\n📄 Page source (first 1000 chars):")
            print(driver.page_source[:1000])
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        if driver:
            driver.save_screenshot("/tmp/profile_test_error.png")
            print("📸 Saved error screenshot to /tmp/profile_test_error.png")
    
    finally:
        if driver:
            driver.quit()
    
    print("\n" + "=" * 50)
    print("🏁 Profile Page Test Complete")

if __name__ == "__main__":
    test_profile_page()
