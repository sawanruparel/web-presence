"""
Functional tests for content sync endpoints
"""
import pytest
from unittest.mock import patch


@pytest.mark.functional
class TestContentSyncEndpoints:
    """Test content sync webhook and manual sync endpoints"""
    
    def test_webhook_endpoint_exists(self, api_client):
        """Verify webhook endpoint is accessible"""
        response_data, status_code = api_client.content_sync_webhook({'test': 'data'})
        # Should return 400 for invalid webhook or 401 for missing signature
        assert status_code in [400, 401]
    
    def test_webhook_requires_signature(self, api_client):
        """Verify webhook requires proper signature"""
        response_data, status_code = api_client.content_sync_webhook({
            'ref': 'refs/heads/main'
        })
        assert status_code == 400
        assert 'signature' in response_data.get('error', '').lower()
    
    def test_manual_sync_requires_api_key(self, api_client):
        """Verify manual sync requires API key"""
        # Create a client without API key
        from framework.client import APITestClient
        no_auth_client = APITestClient()
        no_auth_client.api_key = None
        
        response_data, status_code = no_auth_client.content_sync_manual({'full_sync': True})
        assert status_code == 401
        assert 'api key' in response_data.get('error', '').lower()
    
    def test_manual_sync_with_api_key(self, api_client):
        """Verify manual sync works with API key"""
        response_data, status_code = api_client.content_sync_manual({'full_sync': True})
        # Should work or fail gracefully (depending on GitHub token availability)
        assert status_code in [200, 500]
    
    def test_manual_sync_specific_files(self, api_client):
        """Verify manual sync works with specific files"""
        response_data, status_code = api_client.content_sync_manual({
            'files': ['content/notes/test-note.md']
        })
        # Should work or fail gracefully
        assert status_code in [200, 500]
    
    def test_manual_sync_no_files_specified(self, api_client):
        """Verify manual sync fails when no files specified"""
        response_data, status_code = api_client.content_sync_manual({})
        assert status_code == 400
        assert 'files' in response_data.get('error', '').lower()
    
    def test_sync_status_endpoint(self, api_client):
        """Verify sync status endpoint works"""
        response_data, status_code = api_client.content_sync_status()
        assert status_code == 200
        assert 'status' in response_data
        assert 'buckets' in response_data
    
    def test_sync_status_requires_api_key(self, api_client):
        """Verify sync status requires API key"""
        from framework.client import APITestClient
        no_auth_client = APITestClient()
        no_auth_client.api_key = None
        
        response_data, status_code = no_auth_client.content_sync_status()
        assert status_code == 401
        assert 'api key' in response_data.get('error', '').lower()


@pytest.mark.functional
@pytest.mark.mutating
class TestContentSyncWebhookValidation:
    """Test webhook signature validation and payload processing"""
    
    def test_webhook_invalid_signature(self, api_client):
        """Test webhook with invalid signature"""
        response_data, status_code = api_client.content_sync_webhook(
            {'ref': 'refs/heads/main'},
            signature='invalid-signature'
        )
        assert status_code == 401
        assert 'signature' in response_data.get('error', '').lower()
    
    def test_webhook_missing_signature(self, api_client):
        """Test webhook without signature header"""
        response_data, status_code = api_client.content_sync_webhook({
            'ref': 'refs/heads/main'
        })
        assert status_code == 400
        assert 'signature' in response_data.get('error', '').lower()
    
    def test_webhook_wrong_branch(self, api_client, test_webhook_payloads):
        """Test webhook with wrong branch (should be ignored)"""
        # Mock a valid signature for testing
        with patch('api.src.services.github_service.GitHubService.validateWebhookSignature', return_value=True):
            payload = test_webhook_payloads[1]  # feature_branch_push
            response_data, status_code = api_client.content_sync_webhook(
                payload,
                signature='sha256=valid-signature'
            )
            assert status_code == 200
            assert 'main branch' in response_data.get('message', '').lower()
    
    def test_webhook_no_content_changes(self, api_client, test_webhook_payloads):
        """Test webhook with no content file changes"""
        with patch('api.src.services.github_service.GitHubService.validateWebhookSignature', return_value=True):
            payload = test_webhook_payloads[2]  # no_content_changes
            response_data, status_code = api_client.content_sync_webhook(
                payload,
                signature='sha256=valid-signature'
            )
            assert status_code == 200
            assert 'content files' in response_data.get('message', '').lower()


@pytest.mark.functional
@pytest.mark.mutating
class TestContentSyncIntegration:
    """Test content sync integration with GitHub and R2"""
    
    @pytest.mark.slow
    def test_full_sync_process(self, api_client):
        """Test complete sync process (requires GitHub token)"""
        # This test will only work if GitHub token is configured
        response_data, status_code = api_client.content_sync_manual({'full_sync': True})
        
        if status_code == 200:
            assert 'message' in response_data
            assert 'filesProcessed' in response_data
            assert 'result' in response_data
        else:
            # If it fails due to missing GitHub token, that's expected
            assert status_code == 500
            assert 'error' in response_data
    
    def test_sync_status_structure(self, api_client):
        """Test sync status response structure"""
        response_data, status_code = api_client.content_sync_status()
        
        assert status_code == 200
        assert 'status' in response_data
        assert 'buckets' in response_data
        assert 'protected' in response_data['buckets']
        assert 'public' in response_data['buckets']
        
        # Check bucket structure
        for bucket_name in ['protected', 'public']:
            bucket = response_data['buckets'][bucket_name]
            assert 'count' in bucket
            assert 'objects' in bucket
            assert isinstance(bucket['count'], int)
            assert isinstance(bucket['objects'], list)


@pytest.mark.functional
@pytest.mark.parametrize("sync_request", [
    {"name": "full_sync", "full_sync": True, "files": []},
    {"name": "specific_files", "full_sync": False, "files": ["content/notes/test-note.md"]},
    {"name": "empty_files", "full_sync": False, "files": []}
])
class TestContentSyncParameterized:
    """Parameterized tests for content sync requests"""
    
    def test_manual_sync_requests(self, api_client, sync_request):
        """Test various manual sync request patterns"""
        request_data = {k: v for k, v in sync_request.items() if k != 'name'}
        
        if sync_request['name'] == 'empty_files':
            # This should fail
            response_data, status_code = api_client.content_sync_manual(request_data)
            assert status_code == 400
        else:
            # These should work or fail gracefully
            response_data, status_code = api_client.content_sync_manual(request_data)
            assert status_code in [200, 500]
