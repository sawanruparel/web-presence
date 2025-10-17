"""
Functional tests for health endpoint - safe for all environments
"""
import pytest


@pytest.mark.readonly
@pytest.mark.functional
class TestHealthEndpoint:
    """Functional tests for health endpoint - safe for all environments"""
    
    def test_api_is_accessible(self, api_client):
        """Verify API responds to requests"""
        response_data, status_code = api_client.health_check()
        assert status_code == 200
    
    def test_health_returns_ok_status(self, api_client):
        """Verify health endpoint returns ok status"""
        response_data, status_code = api_client.health_check()
        assert response_data['status'] == 'ok'
    
    def test_health_includes_version(self, api_client):
        """Verify version information is present"""
        response_data, status_code = api_client.health_check()
        assert 'version' in response_data
        assert response_data['version'] == '1.0.0'
    
    def test_health_includes_timestamp(self, api_client):
        """Verify timestamp is present and valid"""
        response_data, status_code = api_client.health_check()
        assert 'timestamp' in response_data
        assert isinstance(response_data['timestamp'], str)
        assert len(response_data['timestamp']) > 0
    
    def test_health_response_structure(self, api_client):
        """Verify health response has correct structure"""
        response_data, status_code = api_client.health_check()
        
        assert status_code == 200
        
        # Check all expected fields are present
        expected_fields = ['status', 'timestamp', 'version']
        for field in expected_fields:
            assert field in response_data, f"Missing field: {field}"
        
        # Check specific field values and types
        assert response_data['status'] == 'ok'
        assert response_data['version'] == '1.0.0'
        assert isinstance(response_data['timestamp'], str)
        assert len(response_data['timestamp']) > 0
    
    def test_health_availability(self, api_client):
        """Test that health endpoint is always available"""
        # Make multiple requests to ensure consistency
        for _ in range(3):
            response_data, status_code = api_client.health_check()
            assert status_code == 200
            assert response_data['status'] == 'ok'
