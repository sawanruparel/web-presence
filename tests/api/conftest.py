"""
Root pytest configuration
"""
# Import all fixtures to make them available
from framework.fixtures import *

# Configure pytest
def pytest_configure(config):
    """Display environment info before tests"""
    from framework.config import TEST_ENV, ALLOW_DATA_MUTATION, CLEANUP_TEST_DATA
    from framework.utils import get_environment_info
    
    env_info = get_environment_info()
    
    print(f"\n🌍 Test Environment: {env_info['environment']}")
    print(f"🔗 API URL: {env_info['api_url']}")
    print(f"🔒 Data Mutations: {'Allowed' if env_info['mutations_allowed'] else 'Disabled'}")
    print(f"🧹 Cleanup: {'Enabled' if env_info['cleanup_enabled'] else 'Disabled'}")
    
    if env_info['environment'] == 'prod':
        print("⚠️  PRODUCTION MODE: Extra safety checks enabled")
    
    print("-" * 50)


def pytest_collection_modifyitems(config, items):
    """Modify test collection based on environment"""
    from framework.config import ALLOW_DATA_MUTATION, TEST_ENV
    
    # Skip mutating tests if mutations not allowed
    if not ALLOW_DATA_MUTATION:
        for item in items:
            if 'mutating' in item.keywords:
                skip_marker = pytest.mark.skip(reason="Data mutations not allowed in this environment")
                item.add_marker(skip_marker)
    
    # Add warnings for production
    if TEST_ENV == 'prod':
        for item in items:
            if 'mutating' in item.keywords:
                warning_marker = pytest.mark.warning(reason="Running mutating test in production")
                item.add_marker(warning_marker)
