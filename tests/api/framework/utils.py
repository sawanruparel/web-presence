"""
Utility functions for API testing
"""
import time
import re
from typing import Dict, Any, List, Optional


def generate_unique_slug(template: str) -> str:
    """Generate a unique slug from a template"""
    timestamp = int(time.time())
    return template.format(timestamp=timestamp)


def is_test_slug(slug: str) -> bool:
    """Check if a slug is a test slug"""
    test_patterns = [
        r'test-.*',
        r'.*-test-.*',
        r'test-automated-.*',
        r'.*-{timestamp}'
    ]
    
    for pattern in test_patterns:
        if re.match(pattern, slug):
            return True
    return False


def validate_response_structure(response_data: Dict, expected_fields: Dict) -> List[str]:
    """Validate response structure and return list of errors"""
    errors = []
    
    for field, expected_type in expected_fields.items():
        if field not in response_data:
            errors.append(f"Missing field: {field}")
            continue
            
        actual_value = response_data[field]
        
        if expected_type == 'string':
            if not isinstance(actual_value, str):
                errors.append(f"Field {field} should be string, got {type(actual_value).__name__}")
        elif expected_type == 'int':
            if not isinstance(actual_value, int):
                errors.append(f"Field {field} should be int, got {type(actual_value).__name__}")
        elif expected_type == 'bool':
            if not isinstance(actual_value, bool):
                errors.append(f"Field {field} should be bool, got {type(actual_value).__name__}")
        elif expected_type == 'list':
            if not isinstance(actual_value, list):
                errors.append(f"Field {field} should be list, got {type(actual_value).__name__}")
        elif expected_type == 'dict':
            if not isinstance(actual_value, dict):
                errors.append(f"Field {field} should be dict, got {type(actual_value).__name__}")
        elif expected_type == 'exists':
            # Just check that field exists (already done above)
            pass
        else:
            # For specific values
            if actual_value != expected_type:
                errors.append(f"Field {field} should be {expected_type}, got {actual_value}")
    
    return errors


def format_test_name(scenario_name: str, test_type: str) -> str:
    """Format test name from scenario"""
    return f"test_{scenario_name}_{test_type}"


def get_environment_info() -> Dict[str, Any]:
    """Get current environment information"""
    from .config import TEST_ENV, API_BASE_URL, ALLOW_DATA_MUTATION, CLEANUP_TEST_DATA
    
    return {
        'environment': TEST_ENV,
        'api_url': API_BASE_URL,
        'mutations_allowed': ALLOW_DATA_MUTATION,
        'cleanup_enabled': CLEANUP_TEST_DATA,
        'timestamp': time.time()
    }
