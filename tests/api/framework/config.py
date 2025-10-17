import os
import yaml
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
def load_environment(env_name=None):
    """Load environment variables from .env file"""
    if env_name:
        env_file = Path(__file__).parent.parent / f'.env.{env_name}'
        if env_file.exists():
            load_dotenv(env_file)
    else:
        # Try to load based on TEST_ENV or default to dev
        test_env = os.getenv('TEST_ENV', 'dev')
        env_file = Path(__file__).parent.parent / f'.env.{test_env}'
        if env_file.exists():
            load_dotenv(env_file)

# Load environment on import
load_environment()

# Environment configuration
TEST_ENV = os.getenv('TEST_ENV', 'dev')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8787')
API_KEY = os.getenv('API_KEY', 'd458ab3fede5cfefb6f33b8aa21cc93988052c020e59075b8bdc6d95b9847246')

# Mutation and cleanup settings
ALLOW_DATA_MUTATION = os.getenv('ALLOW_DATA_MUTATION', 'true').lower() == 'true'
CLEANUP_TEST_DATA = os.getenv('CLEANUP_TEST_DATA', 'true').lower() == 'true'

# Safety settings
REQUIRE_CONFIRMATION = os.getenv('REQUIRE_CONFIRMATION', 'false').lower() == 'true'
MAX_TEST_DATA_AGE_HOURS = int(os.getenv('MAX_TEST_DATA_AGE_HOURS', '24'))

# Safety: In prod, force-disable mutations unless explicitly allowed
if TEST_ENV == 'prod':
    ALLOW_DATA_MUTATION = os.getenv('ALLOW_DATA_MUTATION_PROD', 'false').lower() == 'true'
    # In prod, we can cleanup test data but only with strict criteria
    CLEANUP_TEST_DATA = True  # Allow cleanup but with strict criteria

def load_test_data():
    """Load environment-specific test data"""
    data_file = Path(__file__).parent.parent / 'data' / f'test-data-{TEST_ENV}.yaml'
    with open(data_file) as f:
        return yaml.safe_load(f)

def load_scenarios():
    """Load test scenarios"""
    scenarios_file = Path(__file__).parent.parent / 'data' / 'test-scenarios.yaml'
    with open(scenarios_file) as f:
        return yaml.safe_load(f)

# HTTP Status codes
STATUS_CODES = {
    'OK': 200,
    'CREATED': 201,
    'NO_CONTENT': 204,
    'BAD_REQUEST': 400,
    'UNAUTHORIZED': 401,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'INTERNAL_SERVER_ERROR': 500
}

def is_test_resource(resource_data):
    """Check if a resource is a test resource that can be safely cleaned up"""
    if not CLEANUP_TEST_DATA:
        return False
    
    # Check slug patterns
    slug = resource_data.get('slug', '')
    description = resource_data.get('description', '')
    
    # Load cleanup criteria from prod config
    if TEST_ENV == 'prod':
        prod_data = load_test_data()
        cleanup_criteria = prod_data.get('cleanup_criteria', {})
        
        # Check slug patterns
        slug_patterns = cleanup_criteria.get('slug_patterns', [])
        for pattern in slug_patterns:
            if pattern.replace('*', '') in slug:
                return True
        
        # Check description markers
        description_markers = cleanup_criteria.get('description_markers', [])
        for marker in description_markers:
            if marker in description:
                return True
    
    # For dev/staging, allow cleanup of test resources
    if TEST_ENV in ['dev', 'staging']:
        return 'test' in slug.lower() or '[test]' in description.lower()
    
    return False
