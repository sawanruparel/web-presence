"""
Integration tests for content sync with GitHub and R2
"""
import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.functional
@pytest.mark.integration
class TestContentSyncIntegration:
    """Test content sync integration with external services"""
    
    def test_webhook_signature_validation(self, api_client):
        """Test webhook signature validation with mock"""
        with patch('api.src.services.github_service.GitHubService.validateWebhookSignature') as mock_validate:
            mock_validate.return_value = False
            
            response_data, status_code = api_client.content_sync_webhook(
                {'ref': 'refs/heads/main'},
                signature='sha256=invalid-signature'
            )
            
            assert status_code == 401
            assert 'signature' in response_data.get('error', '').lower()
            mock_validate.assert_called_once()
    
    def test_webhook_valid_signature(self, api_client, test_webhook_payloads):
        """Test webhook with valid signature"""
        with patch('api.src.services.github_service.GitHubService.validateWebhookSignature') as mock_validate:
            with patch('api.src.routes.content_sync.processContentChanges') as mock_process:
                mock_validate.return_value = True
                mock_process.return_value = {
                    'filesProcessed': 1,
                    'result': 'success',
                    'errors': []
                }
                
                payload = test_webhook_payloads[0]  # main_branch_push
                response_data, status_code = api_client.content_sync_webhook(
                    payload,
                    signature='sha256=valid-signature'
                )
                
                assert status_code == 200
                assert 'filesProcessed' in response_data
                mock_validate.assert_called_once()
                mock_process.assert_called_once()
    
    def test_manual_sync_with_github_error(self, api_client):
        """Test manual sync when GitHub API fails"""
        with patch('api.src.services.github_service.GitHubService.listContentFiles') as mock_list:
            mock_list.side_effect = Exception("GitHub API error")
            
            response_data, status_code = api_client.content_sync_manual({'full_sync': True})
            
            assert status_code == 500
            assert 'error' in response_data
            assert 'github' in response_data.get('error', '').lower()
    
    def test_manual_sync_with_r2_error(self, api_client):
        """Test manual sync when R2 operations fail"""
        with patch('api.src.services.github_service.GitHubService.listContentFiles') as mock_list:
            with patch('api.src.services.r2_sync_service.R2SyncService.syncContent') as mock_sync:
                mock_list.return_value = ['content/notes/test.md']
                mock_sync.side_effect = Exception("R2 error")
                
                response_data, status_code = api_client.content_sync_manual({'full_sync': True})
                
                assert status_code == 500
                assert 'error' in response_data
                assert 'r2' in response_data.get('error', '').lower()
    
    def test_sync_status_bucket_operations(self, api_client):
        """Test sync status endpoint bucket operations"""
        with patch('api.src.services.r2_sync_service.R2SyncService.listObjects') as mock_list:
            mock_list.return_value = {
                'protected': {'count': 5, 'objects': ['file1.json', 'file2.json']},
                'public': {'count': 10, 'objects': ['file1.html', 'file2.html']}
            }
            
            response_data, status_code = api_client.content_sync_status()
            
            assert status_code == 200
            assert 'buckets' in response_data
            assert response_data['buckets']['protected']['count'] == 5
            assert response_data['buckets']['public']['count'] == 10
            mock_list.assert_called_once()


@pytest.mark.functional
@pytest.mark.integration
@pytest.mark.parametrize("webhook_payload", [
    {"name": "main_branch_push", "ref": "refs/heads/main", "repository": {"full_name": "test/repo", "default_branch": "main"}},
    {"name": "feature_branch_push", "ref": "refs/heads/feature", "repository": {"full_name": "test/repo", "default_branch": "main"}},
    {"name": "no_content_changes", "ref": "refs/heads/main", "repository": {"full_name": "test/repo", "default_branch": "main"}}
])
class TestWebhookPayloadProcessing:
    """Test webhook payload processing for different scenarios"""
    
    def test_webhook_payload_processing(self, api_client, webhook_payload):
        """Test webhook processing with different payload types"""
        with patch('api.src.services.github_service.GitHubService.validateWebhookSignature') as mock_validate:
            with patch('api.src.routes.content_sync.processContentChanges') as mock_process:
                mock_validate.return_value = True
                mock_process.return_value = {
                    'filesProcessed': 0,
                    'result': 'success',
                    'errors': []
                }
                
                response_data, status_code = api_client.content_sync_webhook(
                    webhook_payload,
                    signature='sha256=valid-signature'
                )
                
                if webhook_payload['name'] == 'feature_branch_push':
                    # Feature branch should be ignored
                    assert status_code == 200
                    assert 'main branch' in response_data.get('message', '').lower()
                else:
                    assert status_code == 200
                    assert 'filesProcessed' in response_data


@pytest.mark.functional
@pytest.mark.integration
@pytest.mark.slow
class TestContentSyncEndToEnd:
    """End-to-end tests for content sync (requires external services)"""
    
    def test_full_sync_workflow(self, api_client):
        """Test complete sync workflow (may fail if GitHub token not configured)"""
        response_data, status_code = api_client.content_sync_manual({'full_sync': True})
        
        if status_code == 200:
            # Success case - verify response structure
            assert 'message' in response_data
            assert 'filesProcessed' in response_data
            assert 'result' in response_data
            assert 'buckets' in response_data
            
            # Verify bucket structure
            buckets = response_data['buckets']
            assert 'protected' in buckets
            assert 'public' in buckets
            
            for bucket_name in ['protected', 'public']:
                bucket = buckets[bucket_name]
                assert 'count' in bucket
                assert 'objects' in bucket
                assert isinstance(bucket['count'], int)
                assert isinstance(bucket['objects'], list)
        else:
            # Failure case - should be due to missing GitHub token or other config
            assert status_code in [400, 500]
            assert 'error' in response_data
    
    def test_specific_files_sync(self, api_client):
        """Test syncing specific files"""
        response_data, status_code = api_client.content_sync_manual({
            'files': ['content/notes/test-note.md', 'content/ideas/test-idea.md']
        })
        
        if status_code == 200:
            assert 'filesProcessed' in response_data
            assert 'result' in response_data
        else:
            # Should fail gracefully if files don't exist or GitHub token missing
            assert status_code in [400, 500]
            assert 'error' in response_data
    
    def test_sync_status_real_buckets(self, api_client):
        """Test sync status with real R2 buckets"""
        response_data, status_code = api_client.content_sync_status()
        
        assert status_code == 200
        assert 'status' in response_data
        assert 'buckets' in response_data
        
        # Verify bucket structure
        buckets = response_data['buckets']
        for bucket_name in ['protected', 'public']:
            assert bucket_name in buckets
            bucket = buckets[bucket_name]
            assert 'count' in bucket
            assert 'objects' in bucket
            assert isinstance(bucket['count'], int)
            assert isinstance(bucket['objects'], list)


@pytest.mark.functional
@pytest.mark.integration
class TestContentSyncErrorHandling:
    """Test error handling in content sync operations"""
    
    def test_webhook_malformed_payload(self, api_client):
        """Test webhook with malformed payload"""
        response_data, status_code = api_client.content_sync_webhook({
            'invalid': 'payload',
            'missing': 'required_fields'
        })
        
        assert status_code == 400
        assert 'error' in response_data
    
    def test_manual_sync_invalid_request(self, api_client):
        """Test manual sync with invalid request"""
        # Test with neither full_sync nor files specified
        response_data, status_code = api_client.content_sync_manual({})
        assert status_code == 400
        assert 'files' in response_data.get('error', '').lower()
        
        # Test with both full_sync and files specified
        response_data, status_code = api_client.content_sync_manual({
            'full_sync': True,
            'files': ['content/notes/test.md']
        })
        assert status_code == 400
        assert 'conflict' in response_data.get('error', '').lower()
    
    def test_sync_with_network_timeout(self, api_client):
        """Test sync behavior with network timeout"""
        with patch('api.src.services.github_service.GitHubService.listContentFiles') as mock_list:
            mock_list.side_effect = TimeoutError("Request timeout")
            
            response_data, status_code = api_client.content_sync_manual({'full_sync': True})
            
            assert status_code == 500
            assert 'timeout' in response_data.get('error', '').lower()
    
    def test_sync_with_r2_permission_error(self, api_client):
        """Test sync behavior with R2 permission error"""
        with patch('api.src.services.github_service.GitHubService.listContentFiles') as mock_list:
            with patch('api.src.services.r2_sync_service.R2SyncService.syncContent') as mock_sync:
                mock_list.return_value = ['content/notes/test.md']
                mock_sync.side_effect = Exception("R2 permission denied")
                
                response_data, status_code = api_client.content_sync_manual({'full_sync': True})
                
                assert status_code == 500
                assert 'permission' in response_data.get('error', '').lower()
