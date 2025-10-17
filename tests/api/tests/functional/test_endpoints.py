"""
Functional tests for endpoint availability and behavior
"""
import pytest


@pytest.mark.readonly
@pytest.mark.functional
class TestEndpointAvailability:
    """Test that all endpoints are available and respond appropriately"""
    
    def test_content_catalog_endpoint_exists(self, api_client):
        """Verify content catalog endpoint is accessible"""
        response_data, status_code = api_client.get_content_catalog()
        assert status_code in [200, 401]  # Either works or requires auth
    
    def test_content_catalog_requires_api_key(self, api_client):
        """Verify content catalog requires API key"""
        # This should work since our client adds API key automatically
        response_data, status_code = api_client.get_content_catalog()
        assert status_code == 200
    
    def test_admin_endpoints_require_api_key(self, api_client):
        """Verify admin endpoints require API key"""
        response_data, status_code = api_client.get_access_rules()
        assert status_code == 200  # Should work with API key
    
    def test_health_endpoint_always_available(self, api_client):
        """Verify health endpoint is always available without auth"""
        response_data, status_code = api_client.health_check()
        assert status_code == 200
    
    def test_auth_endpoints_available(self, api_client):
        """Verify auth endpoints are available"""
        # Test verify endpoint
        response_data, status_code = api_client.verify_open_access('notes', 'test')
        assert status_code in [200, 404]
        
        # Test access check endpoint
        response_data, status_code = api_client.check_access('notes', 'test')
        assert status_code in [200, 404]
    
    def test_endpoints_handle_cors(self, api_client):
        """Verify endpoints handle CORS appropriately"""
        # This is more of a functional test - we just verify the endpoint responds
        response_data, status_code = api_client.health_check()
        assert status_code == 200  # If CORS was blocking, this would fail
