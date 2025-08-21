#!/usr/bin/env python3
"""
Multi-Tenancy Isolation Tester

This script tests multi-tenancy isolation by:
1. Creating two tenant organizations
2. Creating similar data structures in both organizations
3. Testing for data leakage between organizations
4. Verifying strict isolation across entities

Usage:
    python3 test_multi_tenancy.py [api_url] [admin_token]

Example:
    python3 test_multi_tenancy.py https://staging-api.example.com eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
"""

import sys
import requests
import json
import time
import uuid
import random
from datetime import datetime, timedelta

# ANSI color codes for output formatting
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

class MultiTenancyTester:
    def __init__(self, api_url, admin_token):
        self.api_url = api_url.rstrip('/')
        self.admin_token = admin_token
        self.tenant_orgs = []
        self.test_results = []
        
        # Store tokens and IDs for created entities
        self.org_tokens = {}
        self.org_data = {}
        
    def add_result(self, test_name, success, details=None):
        """Add a test result"""
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        })
        
        status = f"{Colors.GREEN}✓ PASS{Colors.ENDC}" if success else f"{Colors.RED}✗ FAIL{Colors.ENDC}"
        print(f"{status} {test_name}")
        if details and not success:
            print(f"  Details: {json.dumps(details, indent=2)}")
            
    def create_tenant_orgs(self):
        """Create two tenant organizations for testing"""
        print(f"{Colors.HEADER}Creating tenant organizations...{Colors.ENDC}")
        
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        for i in range(1, 3):
            org_name = f"Test Organization {i} - {uuid.uuid4().hex[:8]}"
            org_data = {
                'name': org_name,
                'type': 'property_management',
                'admin_email': f'admin{i}@example.com',
                'admin_password': f'SecurePass{i}!{uuid.uuid4().hex[:8]}',
                'admin_name': f'Admin User {i}'
            }
            
            try:
                response = requests.post(
                    f"{self.api_url}/api/admin/organizations", 
                    headers=headers,
                    json=org_data
                )
                
                if response.status_code == 201:
                    org_info = response.json()
                    self.tenant_orgs.append(org_info)
                    print(f"{Colors.GREEN}Created organization: {org_name}{Colors.ENDC}")
                    
                    # Login as admin for this org
                    login_response = requests.post(
                        f"{self.api_url}/api/auth/login",
                        json={
                            'email': org_data['admin_email'],
                            'password': org_data['admin_password']
                        }
                    )
                    
                    if login_response.status_code == 200:
                        token = login_response.json().get('access_token')
                        self.org_tokens[org_info['id']] = token
                        self.org_data[org_info['id']] = {
                            'name': org_name,
                            'admin_email': org_data['admin_email'],
                            'properties': [],
                            'tenants': [],
                            'payments': [],
                            'messages': []
                        }
                    else:
                        print(f"{Colors.WARNING}Couldn't login as admin for {org_name}{Colors.ENDC}")
                else:
                    print(f"{Colors.RED}Error creating organization: {response.text}{Colors.ENDC}")
            except Exception as e:
                print(f"{Colors.RED}Exception creating organization: {str(e)}{Colors.ENDC}")
                
        self.add_result(
            "Create tenant organizations", 
            len(self.tenant_orgs) == 2,
            {"orgs_created": len(self.tenant_orgs)}
        )
        
        return len(self.tenant_orgs) == 2
        
    def create_test_properties(self):
        """Create properties in each tenant org"""
        print(f"\n{Colors.HEADER}Creating properties for each organization...{Colors.ENDC}")
        
        for org_id, token in self.org_tokens.items():
            headers = {'Authorization': f'Bearer {token}'}
            
            # Create a few properties
            for i in range(1, 4):
                property_data = {
                    'name': f"Property {i} - Org {org_id}",
                    'address': f"{random.randint(100, 999)} Main St, Test City {i}",
                    'units': random.randint(1, 10),
                    'description': f"Test property {i} for organization {org_id}",
                    'property_type': random.choice(['apartment', 'house', 'commercial']),
                    'status': 'active'
                }
                
                try:
                    response = requests.post(
                        f"{self.api_url}/api/properties",
                        headers=headers,
                        json=property_data
                    )
                    
                    if response.status_code in (201, 200):
                        property_info = response.json()
                        self.org_data[org_id]['properties'].append(property_info)
                        print(f"{Colors.GREEN}Created property: {property_data['name']} in org {org_id}{Colors.ENDC}")
                    else:
                        print(f"{Colors.RED}Error creating property: {response.text}{Colors.ENDC}")
                except Exception as e:
                    print(f"{Colors.RED}Exception creating property: {str(e)}{Colors.ENDC}")
        
        # Check if properties were created in both orgs
        success = all(len(data['properties']) > 0 for _, data in self.org_data.items())
        self.add_result(
            "Create properties in each organization", 
            success,
            {org_id: len(data['properties']) for org_id, data in self.org_data.items()}
        )
        
        return success
        
    def create_test_tenants(self):
        """Create tenant users in each org"""
        print(f"\n{Colors.HEADER}Creating tenant users for each organization...{Colors.ENDC}")
        
        for org_id, token in self.org_tokens.items():
            headers = {'Authorization': f'Bearer {token}'}
            
            # Create a few tenant users
            for i in range(1, 3):
                tenant_data = {
                    'email': f"tenant{i}_org{org_id}@example.com",
                    'password': f'TenantPass{i}!{uuid.uuid4().hex[:8]}',
                    'name': f"Tenant {i} - Org {org_id}",
                    'phone': f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    'role': 'tenant'
                }
                
                try:
                    response = requests.post(
                        f"{self.api_url}/api/tenants", 
                        headers=headers,
                        json=tenant_data
                    )
                    
                    if response.status_code in (201, 200):
                        tenant_info = response.json()
                        self.org_data[org_id]['tenants'].append({**tenant_info, 'credentials': tenant_data})
                        print(f"{Colors.GREEN}Created tenant: {tenant_data['name']} in org {org_id}{Colors.ENDC}")
                    else:
                        print(f"{Colors.RED}Error creating tenant: {response.text}{Colors.ENDC}")
                except Exception as e:
                    print(f"{Colors.RED}Exception creating tenant: {str(e)}{Colors.ENDC}")
        
        # Check if tenants were created in both orgs
        success = all(len(data['tenants']) > 0 for _, data in self.org_data.items())
        self.add_result(
            "Create tenant users in each organization", 
            success,
            {org_id: len(data['tenants']) for org_id, data in self.org_data.items()}
        )
        
        return success
        
    def create_test_payments(self):
        """Create test payment records in each org"""
        print(f"\n{Colors.HEADER}Creating test payments for each organization...{Colors.ENDC}")
        
        for org_id, token in self.org_tokens.items():
            headers = {'Authorization': f'Bearer {token}'}
            
            if not self.org_data[org_id]['properties'] or not self.org_data[org_id]['tenants']:
                print(f"{Colors.WARNING}Skipping payments for org {org_id} - missing properties or tenants{Colors.ENDC}")
                continue
                
            # Create a few payment records
            for i in range(1, 3):
                property_id = self.org_data[org_id]['properties'][0].get('id', 0)
                tenant_id = self.org_data[org_id]['tenants'][0].get('id', 0)
                
                payment_data = {
                    'amount': random.randint(800, 2500),
                    'description': f"Rent payment {i} - Org {org_id}",
                    'tenant_id': tenant_id,
                    'property_id': property_id,
                    'status': 'completed',
                    'payment_type': 'rent',
                    'payment_method': 'credit_card',
                    'transaction_id': f"txn_{uuid.uuid4().hex}"
                }
                
                try:
                    # Different APIs might have different endpoints for payments
                    # Try common patterns
                    endpoints = [
                        f"{self.api_url}/api/payments",
                        f"{self.api_url}/api/invoices",
                        f"{self.api_url}/api/payments/record"
                    ]
                    
                    for endpoint in endpoints:
                        response = requests.post(
                            endpoint,
                            headers=headers,
                            json=payment_data
                        )
                        
                        if response.status_code in (201, 200):
                            payment_info = response.json()
                            self.org_data[org_id]['payments'].append(payment_info)
                            print(f"{Colors.GREEN}Created payment: ${payment_data['amount']} in org {org_id}{Colors.ENDC}")
                            break
                        elif response.status_code == 404:
                            continue
                        else:
                            print(f"{Colors.RED}Error creating payment at {endpoint}: {response.text}{Colors.ENDC}")
                except Exception as e:
                    print(f"{Colors.RED}Exception creating payment: {str(e)}{Colors.ENDC}")
        
        # Check if payments were created (might not be applicable to all systems)
        payment_counts = {org_id: len(data['payments']) for org_id, data in self.org_data.items()}
        success = sum(payment_counts.values()) > 0
        self.add_result(
            "Create payments in each organization",
            success,
            payment_counts
        )
        
        return success
        
    def create_test_messages(self):
        """Create test messages in each org"""
        print(f"\n{Colors.HEADER}Creating test messages for each organization...{Colors.ENDC}")
        
        for org_id, token in self.org_tokens.items():
            headers = {'Authorization': f'Bearer {token}'}
            
            if not self.org_data[org_id]['tenants']:
                print(f"{Colors.WARNING}Skipping messages for org {org_id} - missing tenants{Colors.ENDC}")
                continue
                
            # Create a few test messages
            for i in range(1, 3):
                message_data = {
                    'subject': f"Test Message {i} - Org {org_id}",
                    'body': f"This is test message {i} for organization {org_id}. Created at {datetime.now().isoformat()}",
                    'recipient_id': self.org_data[org_id]['tenants'][0].get('id', 0),
                    'message_type': 'notification'
                }
                
                try:
                    # Different APIs might have different endpoints for messages
                    # Try common patterns
                    endpoints = [
                        f"{self.api_url}/api/messages",
                        f"{self.api_url}/api/notifications",
                        f"{self.api_url}/api/communications"
                    ]
                    
                    for endpoint in endpoints:
                        response = requests.post(
                            endpoint,
                            headers=headers,
                            json=message_data
                        )
                        
                        if response.status_code in (201, 200):
                            message_info = response.json()
                            self.org_data[org_id]['messages'].append(message_info)
                            print(f"{Colors.GREEN}Created message: '{message_data['subject']}' in org {org_id}{Colors.ENDC}")
                            break
                        elif response.status_code == 404:
                            continue
                        else:
                            print(f"{Colors.RED}Error creating message at {endpoint}: {response.text}{Colors.ENDC}")
                except Exception as e:
                    print(f"{Colors.RED}Exception creating message: {str(e)}{Colors.ENDC}")
        
        # Check if messages were created (might not be applicable to all systems)
        message_counts = {org_id: len(data['messages']) for org_id, data in self.org_data.items()}
        success = sum(message_counts.values()) > 0
        self.add_result(
            "Create messages in each organization",
            success,
            message_counts
        )
        
        return success
    
    def test_property_isolation(self):
        """Test property isolation between tenants"""
        print(f"\n{Colors.HEADER}Testing property isolation between organizations...{Colors.ENDC}")
        
        isolation_results = {}
        success = True
        
        # Get list of orgs
        org_ids = list(self.org_tokens.keys())
        if len(org_ids) < 2:
            print(f"{Colors.WARNING}Need at least 2 organizations to test isolation{Colors.ENDC}")
            self.add_result("Property isolation", False, {"error": "Insufficient organizations"})
            return False
        
        # For each org, try to access properties from the other org
        for i, org_id in enumerate(org_ids):
            other_org_id = org_ids[(i + 1) % len(org_ids)]  # Get next org in list
            
            if not self.org_data[other_org_id]['properties']:
                print(f"{Colors.WARNING}No properties in org {other_org_id} to test against{Colors.ENDC}")
                continue
                
            # Get ID of a property from other org
            other_org_property_id = self.org_data[other_org_id]['properties'][0].get('id', 0)
            
            # Try to access it using this org's token
            headers = {'Authorization': f'Bearer {self.org_tokens[org_id]}'}
            
            try:
                response = requests.get(
                    f"{self.api_url}/api/properties/{other_org_property_id}",
                    headers=headers
                )
                
                # Expected: 403 or 404 (forbidden or not found)
                properly_isolated = response.status_code in (403, 404)
                
                isolation_results[f"org{org_id}_accessing_property_{other_org_property_id}"] = {
                    'expected': "403 or 404",
                    'actual': response.status_code,
                    'isolated': properly_isolated
                }
                
                if properly_isolated:
                    print(f"{Colors.GREEN}Property isolation verified: Org {org_id} cannot access property {other_org_property_id}{Colors.ENDC}")
                else:
                    print(f"{Colors.RED}Property isolation FAILED: Org {org_id} CAN access property {other_org_property_id} (status: {response.status_code}){Colors.ENDC}")
                    success = False
                    
            except Exception as e:
                print(f"{Colors.RED}Exception testing property isolation: {str(e)}{Colors.ENDC}")
                success = False
        
        self.add_result("Property isolation", success, isolation_results)
        return success
    
    def test_tenant_isolation(self):
        """Test tenant user isolation between organizations"""
        print(f"\n{Colors.HEADER}Testing tenant isolation between organizations...{Colors.ENDC}")
        
        isolation_results = {}
        success = True
        
        # Get list of orgs
        org_ids = list(self.org_tokens.keys())
        if len(org_ids) < 2:
            print(f"{Colors.WARNING}Need at least 2 organizations to test isolation{Colors.ENDC}")
            self.add_result("Tenant isolation", False, {"error": "Insufficient organizations"})
            return False
        
        # For each org, try to access tenants from the other org
        for i, org_id in enumerate(org_ids):
            other_org_id = org_ids[(i + 1) % len(org_ids)]
            
            if not self.org_data[other_org_id]['tenants']:
                print(f"{Colors.WARNING}No tenants in org {other_org_id} to test against{Colors.ENDC}")
                continue
                
            # Get ID of a tenant from other org
            other_org_tenant_id = self.org_data[other_org_id]['tenants'][0].get('id', 0)
            
            # Try to access it using this org's token
            headers = {'Authorization': f'Bearer {self.org_tokens[org_id]}'}
            
            try:
                response = requests.get(
                    f"{self.api_url}/api/tenants/{other_org_tenant_id}",
                    headers=headers
                )
                
                # Expected: 403 or 404 (forbidden or not found)
                properly_isolated = response.status_code in (403, 404)
                
                isolation_results[f"org{org_id}_accessing_tenant_{other_org_tenant_id}"] = {
                    'expected': "403 or 404",
                    'actual': response.status_code,
                    'isolated': properly_isolated
                }
                
                if properly_isolated:
                    print(f"{Colors.GREEN}Tenant isolation verified: Org {org_id} cannot access tenant {other_org_tenant_id}{Colors.ENDC}")
                else:
                    print(f"{Colors.RED}Tenant isolation FAILED: Org {org_id} CAN access tenant {other_org_tenant_id} (status: {response.status_code}){Colors.ENDC}")
                    success = False
                    
            except Exception as e:
                print(f"{Colors.RED}Exception testing tenant isolation: {str(e)}{Colors.ENDC}")
                success = False
        
        self.add_result("Tenant isolation", success, isolation_results)
        return success
        
    def test_payment_isolation(self):
        """Test payment data isolation between orgs"""
        print(f"\n{Colors.HEADER}Testing payment isolation between organizations...{Colors.ENDC}")
        
        isolation_results = {}
        success = True
        
        # Get list of orgs
        org_ids = list(self.org_tokens.keys())
        if len(org_ids) < 2:
            print(f"{Colors.WARNING}Need at least 2 organizations to test isolation{Colors.ENDC}")
            self.add_result("Payment isolation", False, {"error": "Insufficient organizations"})
            return False
            
        # For each org, check if they can see only their own payments
        for org_id in org_ids:
            headers = {'Authorization': f'Bearer {self.org_tokens[org_id]}'}
            
            try:
                # Try common payment endpoints
                endpoints = [
                    f"{self.api_url}/api/payments",
                    f"{self.api_url}/api/invoices",
                    f"{self.api_url}/api/payment-history"
                ]
                
                payment_list = None
                for endpoint in endpoints:
                    response = requests.get(endpoint, headers=headers)
                    
                    if response.status_code == 200:
                        payment_list = response.json()
                        if isinstance(payment_list, dict) and 'items' in payment_list:
                            payment_list = payment_list['items']
                        elif isinstance(payment_list, dict) and 'results' in payment_list:
                            payment_list = payment_list['results']
                        
                        print(f"{Colors.GREEN}Found payments endpoint: {endpoint}{Colors.ENDC}")
                        break
                    elif response.status_code != 404:
                        print(f"{Colors.WARNING}Error accessing {endpoint}: Status {response.status_code}{Colors.ENDC}")
                
                if payment_list is None:
                    print(f"{Colors.WARNING}Could not find payment list for org {org_id}{Colors.ENDC}")
                    continue
                    
                # Check if any payment data appears to be from another org
                # This is a heuristic check since we don't know exactly how the API formats data
                cross_contamination = False
                for payment in payment_list:
                    # Look for identifiable information from other orgs
                    for other_org_id in org_ids:
                        if other_org_id == org_id:
                            continue
                            
                        # Check if this payment contains data specific to another org
                        for other_payment in self.org_data[other_org_id].get('payments', []):
                            if 'transaction_id' in other_payment and 'transaction_id' in payment:
                                if other_payment['transaction_id'] == payment['transaction_id']:
                                    cross_contamination = True
                                    print(f"{Colors.RED}Found payment from org {other_org_id} in org {org_id}'s payment list{Colors.ENDC}")
                                    break
                    
                    if cross_contamination:
                        break
                        
                isolation_results[f"org_{org_id}_payment_isolation"] = {
                    'payment_count': len(payment_list),
                    'cross_contamination_detected': cross_contamination
                }
                
                if not cross_contamination:
                    print(f"{Colors.GREEN}Payment isolation verified for org {org_id}{Colors.ENDC}")
                else:
                    success = False
                    
            except Exception as e:
                print(f"{Colors.RED}Exception testing payment isolation: {str(e)}{Colors.ENDC}")
                success = False
        
        self.add_result("Payment isolation", success, isolation_results)
        return success
        
    def test_message_isolation(self):
        """Test message isolation between orgs"""
        print(f"\n{Colors.HEADER}Testing message isolation between organizations...{Colors.ENDC}")
        
        isolation_results = {}
        success = True
        
        # Get list of orgs
        org_ids = list(self.org_tokens.keys())
        if len(org_ids) < 2:
            print(f"{Colors.WARNING}Need at least 2 organizations to test isolation{Colors.ENDC}")
            self.add_result("Message isolation", False, {"error": "Insufficient organizations"})
            return False
            
        # For each org, check if they can see only their own messages
        for org_id in org_ids:
            headers = {'Authorization': f'Bearer {self.org_tokens[org_id]}'}
            
            try:
                # Try common message endpoints
                endpoints = [
                    f"{self.api_url}/api/messages",
                    f"{self.api_url}/api/notifications",
                    f"{self.api_url}/api/communications"
                ]
                
                message_list = None
                for endpoint in endpoints:
                    response = requests.get(endpoint, headers=headers)
                    
                    if response.status_code == 200:
                        message_list = response.json()
                        if isinstance(message_list, dict) and 'items' in message_list:
                            message_list = message_list['items']
                        elif isinstance(message_list, dict) and 'results' in message_list:
                            message_list = message_list['results']
                            
                        print(f"{Colors.GREEN}Found messages endpoint: {endpoint}{Colors.ENDC}")
                        break
                    elif response.status_code != 404:
                        print(f"{Colors.WARNING}Error accessing {endpoint}: Status {response.status_code}{Colors.ENDC}")
                
                if message_list is None:
                    print(f"{Colors.WARNING}Could not find message list for org {org_id}{Colors.ENDC}")
                    continue
                    
                # Check for cross-contamination based on message content
                cross_contamination = False
                for message in message_list:
                    message_text = json.dumps(message).lower()
                    
                    # Look for identifiers from other orgs
                    for other_org_id in org_ids:
                        if other_org_id == org_id:
                            continue
                            
                        # Check for org identifier in message
                        org_identifier = f"org {other_org_id}"
                        if org_identifier in message_text:
                            cross_contamination = True
                            print(f"{Colors.RED}Found message from org {other_org_id} in org {org_id}'s message list{Colors.ENDC}")
                            print(f"Message content: {message_text[:100]}...")
                            break
                    
                    if cross_contamination:
                        break
                        
                isolation_results[f"org_{org_id}_message_isolation"] = {
                    'message_count': len(message_list),
                    'cross_contamination_detected': cross_contamination
                }
                
                if not cross_contamination:
                    print(f"{Colors.GREEN}Message isolation verified for org {org_id}{Colors.ENDC}")
                else:
                    success = False
                    
            except Exception as e:
                print(f"{Colors.RED}Exception testing message isolation: {str(e)}{Colors.ENDC}")
                success = False
        
        self.add_result("Message isolation", success, isolation_results)
        return success
        
    def check_white_labeling(self):
        """Check if white labeling/branding is supported and properly isolated"""
        print(f"\n{Colors.HEADER}Checking white labeling/branding isolation...{Colors.ENDC}")
        
        # This test may need manual verification if white labeling is UI-based
        print(f"{Colors.WARNING}White labeling test may require manual verification{Colors.ENDC}")
        print("Instructions for manual verification:")
        print("1. Log in to each tenant organization's portal")
        print("2. Check for organization-specific branding (logos, colors, themes)")
        print("3. Verify branding elements are isolated between organizations")
        
        # Try to check through API if system supports branding configuration
        branding_results = {}
        api_branding_check = False
        
        for org_id, token in self.org_tokens.items():
            headers = {'Authorization': f'Bearer {token}'}
            
            # Try common branding/settings endpoints
            endpoints = [
                f"{self.api_url}/api/organization-settings",
                f"{self.api_url}/api/branding",
                f"{self.api_url}/api/settings/branding",
                f"{self.api_url}/api/organizations/{org_id}/settings"
            ]
            
            for endpoint in endpoints:
                try:
                    response = requests.get(endpoint, headers=headers)
                    
                    if response.status_code == 200:
                        branding_info = response.json()
                        branding_results[f"org_{org_id}_branding"] = branding_info
                        api_branding_check = True
                        print(f"{Colors.GREEN}Found branding settings for org {org_id}{Colors.ENDC}")
                        break
                except:
                    continue
        
        if api_branding_check:
            self.add_result("White labeling/branding", True, branding_results)
        else:
            self.add_result(
                "White labeling/branding", 
                None,  # None indicates manual verification needed
                {"message": "Manual verification required"}
            )
        
        return api_branding_check
        
    def generate_report(self):
        """Generate a detailed isolation test report"""
        print(f"\n{Colors.HEADER}Generating multi-tenancy isolation test report...{Colors.ENDC}")
        
        # Calculate overall results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'] is True)
        failed_tests = sum(1 for result in self.test_results if result['success'] is False)
        manual_tests = sum(1 for result in self.test_results if result['success'] is None)
        
        pass_percentage = (passed_tests / (total_tests - manual_tests)) * 100 if (total_tests - manual_tests) > 0 else 0
        
        # Create report
        report = {
            'summary': {
                'timestamp': datetime.now().isoformat(),
                'api_url': self.api_url,
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': failed_tests,
                'manual_verification_needed': manual_tests,
                'pass_percentage': pass_percentage,
                'overall_result': 'PASS' if failed_tests == 0 else 'FAIL'
            },
            'organizations': [
                {
                    'id': org_id,
                    'name': data['name'],
                    'entity_counts': {
                        'properties': len(data['properties']),
                        'tenants': len(data['tenants']),
                        'payments': len(data['payments']),
                        'messages': len(data['messages'])
                    }
                } for org_id, data in self.org_data.items()
            ],
            'test_results': self.test_results
        }
        
        # Save report to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"multi_tenancy_test_report_{timestamp}.json"
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        # Print summary
        print(f"\n{Colors.BOLD}=== Multi-tenancy Isolation Test Summary ==={Colors.ENDC}")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {Colors.GREEN}{passed_tests}{Colors.ENDC}")
        print(f"Failed: {Colors.RED}{failed_tests}{Colors.ENDC}")
        print(f"Manual Verification Needed: {Colors.BLUE}{manual_tests}{Colors.ENDC}")
        print(f"Pass Rate: {Colors.BOLD}{pass_percentage:.1f}%{Colors.ENDC}")
        print(f"\nOverall Result: {Colors.GREEN if failed_tests == 0 else Colors.RED}{report['summary']['overall_result']}{Colors.ENDC}")
        print(f"\nDetailed report saved to: {report_file}")
        
        return report
        
    def run_all_tests(self):
        """Run all multi-tenancy isolation tests"""
        if not self.create_tenant_orgs():
            print(f"{Colors.RED}Failed to create tenant organizations. Aborting tests.{Colors.ENDC}")
            return False
            
        # Create test data in each org
        self.create_test_properties()
        self.create_test_tenants()
        self.create_test_payments()
        self.create_test_messages()
        
        # Test isolation between orgs
        self.test_property_isolation()
        self.test_tenant_isolation()
        self.test_payment_isolation()
        self.test_message_isolation()
        self.check_white_labeling()
        
        # Generate final report
        return self.generate_report()

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 test_multi_tenancy.py [api_url] [admin_token]")
        print("Example: python3 test_multi_tenancy.py https://staging-api.example.com eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
        sys.exit(1)
    
    api_url = sys.argv[1]
    admin_token = sys.argv[2]
    
    print(f"{Colors.HEADER}Multi-tenancy Isolation Tester{Colors.ENDC}")
    print(f"API URL: {api_url}")
    
    tester = MultiTenancyTester(api_url, admin_token)
    tester.run_all_tests()

if __name__ == "__main__":
    main()
