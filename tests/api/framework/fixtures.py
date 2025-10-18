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


# Content Management Fixtures
@pytest.fixture
def test_content_file_data(test_data, unique_slug):
    """Generate test content file data with unique slug"""
    file_template = test_data['content_management']['test_files'][0]
    return {
        'type': file_template['type'],
        'slug': file_template['slug_template'].format(timestamp=int(time.time())),
        'title': file_template['title'],
        'markdown': file_template['markdown'],
        'frontmatter': file_template['frontmatter'],
        'commitMessage': f'Test commit for {file_template["type"]}/{file_template["slug_template"].format(timestamp=int(time.time()))}'
    }


@pytest.fixture
def test_protected_content_file_data(test_data, unique_slug):
    """Generate test protected content file data with unique slug"""
    file_template = test_data['content_management']['test_files'][1]  # ideas with protected: true
    return {
        'type': file_template['type'],
        'slug': file_template['slug_template'].format(timestamp=int(time.time())),
        'title': file_template['title'],
        'markdown': file_template['markdown'],
        'frontmatter': file_template['frontmatter'],
        'commitMessage': f'Test commit for protected {file_template["type"]}/{file_template["slug_template"].format(timestamp=int(time.time()))}'
    }


# Content Sync Fixtures
@pytest.fixture
def test_webhook_payloads(test_data):
    """Get webhook payload test data"""
    return test_data['content_sync']['webhook_payloads']


@pytest.fixture
def test_manual_sync_requests(test_data):
    """Get manual sync request test data"""
    return test_data['content_sync']['manual_sync_requests']


# Access Control API Fixtures (New)
@pytest.fixture
def test_access_control_password_rule(test_data, unique_slug):
    """Generate test access control password rule data"""
    rule_template = test_data['access_control_api']['rules']['password_rule']
    return {
        'type': rule_template['type'],
        'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
        'accessMode': rule_template['accessMode'],
        'description': rule_template['description'],
        'passwordHash': rule_template['password']  # In real tests, this would be hashed
    }


@pytest.fixture
def test_access_control_email_rule(test_data, unique_slug):
    """Generate test access control email rule data"""
    rule_template = test_data['access_control_api']['rules']['email_rule']
    return {
        'type': rule_template['type'],
        'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
        'accessMode': rule_template['accessMode'],
        'description': rule_template['description'],
        'allowedEmails': rule_template['allowedEmails']
    }


@pytest.fixture
def test_access_control_open_rule(test_data, unique_slug):
    """Generate test access control open rule data"""
    rule_template = test_data['access_control_api']['rules']['open_rule']
    return {
        'type': rule_template['type'],
        'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
        'accessMode': rule_template['accessMode'],
        'description': rule_template['description']
    }


@pytest.fixture
def test_access_control_updates(test_data):
    """Get access control update test data"""
    return test_data['access_control_api']['updates']


@pytest.fixture
def test_access_control_invalid_data(test_data):
    """Get access control invalid data test cases"""
    return test_data['access_control_api']['invalid_data']
