"""
Pytest fixtures for API testing
"""
import pytest
import time
from typing import List, Dict, Any
from .config import load_test_data, CLEANUP_TEST_DATA, ALLOW_DATA_MUTATION, is_test_resource
from .client import APITestClient


@pytest.fixture(scope='session')
def api_client():
    """Provides API client for all tests"""
    return APITestClient()


@pytest.fixture(scope='session')
def test_data():
    """Loads environment-specific test data"""
    return load_test_data()


@pytest.fixture
def skip_if_no_mutation():
    """Skip test if mutations not allowed"""
    if not ALLOW_DATA_MUTATION:
        pytest.skip("Data mutations not allowed in this environment")


@pytest.fixture
def created_resources(api_client):
    """Track and cleanup created resources"""
    resources = []
    yield resources
    
    # Cleanup only if enabled and for test resources
    if CLEANUP_TEST_DATA:
        for resource in resources:
            if is_test_resource(resource):
                try:
                    api_client.delete_access_rule(resource['type'], resource['slug'])
                    print(f"Cleaned up test resource: {resource['type']}/{resource['slug']}")
                except Exception as e:
                    print(f"Failed to cleanup resource {resource['type']}/{resource['slug']}: {e}")


@pytest.fixture
def unique_slug():
    """Generate a unique slug for test data"""
    return f"test-{int(time.time())}"


@pytest.fixture
def test_access_rule_data(test_data, unique_slug):
    """Generate test access rule data with unique slug"""
    rule_template = test_data['access_rules']['password_protected'][0]
    return {
        'type': rule_template['type'],
        'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
        'accessMode': 'password',
        'password': rule_template['password'],
        'description': rule_template['description']
    }


@pytest.fixture
def test_email_rule_data(test_data, unique_slug):
    """Generate test email list rule data with unique slug"""
    rule_template = test_data['access_rules']['email_list'][0]
    return {
        'type': rule_template['type'],
        'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
        'accessMode': 'email-list',
        'allowedEmails': rule_template['allowed_emails'],
        'description': rule_template['description']
    }


@pytest.fixture
def test_open_rule_data(test_data, unique_slug):
    """Generate test open access rule data with unique slug"""
    rule_template = test_data['access_rules']['open_access'][0]
    return {
        'type': rule_template['type'],
        'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
        'accessMode': 'open',
        'description': rule_template['description']
    }
