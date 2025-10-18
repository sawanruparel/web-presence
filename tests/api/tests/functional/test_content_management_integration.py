"""
Integration tests for content management with GitHub
"""
import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.functional
@pytest.mark.integration
class TestContentManagementGitHubIntegration:
    """Test content management integration with GitHub API"""
    
    def test_list_content_github_error(self, api_client):
        """Test listing content when GitHub API fails"""
        with patch('api.src.services.github_service.GitHubService.listContentFiles') as mock_list:
            mock_list.side_effect = Exception("GitHub API error")
            
            response_data, status_code = api_client.list_content_by_type('notes')
            
            assert status_code == 500
            assert 'error' in response_data
            assert 'github' in response_data.get('error', '').lower()
    
    def test_get_content_file_github_error(self, api_client):
        """Test getting content file when GitHub API fails"""
        with patch('api.src.services.github_service.GitHubService.getFileContent') as mock_get:
            mock_get.side_effect = Exception("GitHub API error")
            
            response_data, status_code = api_client.get_content_file('notes', 'test-note')
            
            assert status_code == 500
            assert 'error' in response_data
    
    def test_create_content_file_github_success(self, api_client, test_content_file_data, skip_if_no_mutation):
        """Test creating content file with successful GitHub API call"""
        with patch('api.src.services.github_service.GitHubService.createFile') as mock_create:
            mock_create.return_value = {
                'content': {'sha': 'abc123'},
                'commit': {'sha': 'def456'}
            }
            
            response_data, status_code = api_client.create_content_file(test_content_file_data)
            
            if status_code in [200, 201]:
                assert 'message' in response_data
                assert 'path' in response_data
                assert 'slug' in response_data
                mock_create.assert_called_once()
    
    def test_create_content_file_github_error(self, api_client, test_content_file_data, skip_if_no_mutation):
        """Test creating content file when GitHub API fails"""
        with patch('api.src.services.github_service.GitHubService.createFile') as mock_create:
            mock_create.side_effect = Exception("GitHub API error")
            
            response_data, status_code = api_client.create_content_file(test_content_file_data)
            
            assert status_code == 500
            assert 'error' in response_data
            assert 'github' in response_data.get('error', '').lower()
    
    def test_update_content_file_github_success(self, api_client, test_content_file_data, skip_if_no_mutation, created_resources):
        """Test updating content file with successful GitHub API call"""
        with patch('api.src.services.github_service.GitHubService.getFileContent') as mock_get:
            with patch('api.src.services.github_service.GitHubService.updateFile') as mock_update:
                mock_get.return_value = {
                    'content': 'base64content',
                    'sha': 'abc123'
                }
                mock_update.return_value = {
                    'content': {'sha': 'def456'},
                    'commit': {'sha': 'ghi789'}
                }
                
                # First create the file
                response_data, status_code = api_client.create_content_file(test_content_file_data)
                
                if status_code in [200, 201]:
                    # Track for cleanup
                    created_resources.append({
                        'type': test_content_file_data['type'],
                        'slug': test_content_file_data['slug']
                    })
                    
                    # Update the file
                    update_data = {
                        'markdown': '# Updated Content\n\nThis is updated.',
                        'frontmatter': {'title': 'Updated Title'},
                        'sha': 'abc123',
                        'commitMessage': 'Update test file'
                    }
                    
                    response_data, status_code = api_client.update_content_file(
                        test_content_file_data['type'],
                        test_content_file_data['slug'],
                        update_data
                    )
                    
                    if status_code in [200, 201]:
                        assert 'message' in response_data
                        assert 'slug' in response_data
                        mock_update.assert_called_once()
    
    def test_delete_content_file_github_success(self, api_client, test_content_file_data, skip_if_no_mutation):
        """Test deleting content file with successful GitHub API call"""
        with patch('api.src.services.github_service.GitHubService.getFileContent') as mock_get:
            with patch('api.src.services.github_service.GitHubService.deleteFile') as mock_delete:
                mock_get.return_value = {
                    'content': 'base64content',
                    'sha': 'abc123'
                }
                mock_delete.return_value = {
                    'commit': {'sha': 'def456'}
                }
                
                # First create the file
                response_data, status_code = api_client.create_content_file(test_content_file_data)
                
                if status_code in [200, 201]:
                    # Get the file to get the SHA
                    get_response, get_status = api_client.get_content_file(
                        test_content_file_data['type'],
                        test_content_file_data['slug']
                    )
                    
                    if get_status == 200:
                        # Delete the file
                        delete_data = {
                            'sha': 'abc123',
                            'commitMessage': 'Delete test file'
                        }
                        
                        response_data, status_code = api_client.delete_content_file(
                            test_content_file_data['type'],
                            test_content_file_data['slug'],
                            delete_data
                        )
                        
                        if status_code in [200, 204]:
                            assert 'message' in response_data
                            assert 'slug' in response_data
                            mock_delete.assert_called_once()


@pytest.mark.functional
@pytest.mark.integration
class TestContentManagementValidation:
    """Test content management validation and error handling"""
    
    def test_create_file_missing_required_fields(self, api_client, skip_if_no_mutation):
        """Test creating file with missing required fields"""
        incomplete_data = {
            'type': 'notes',
            'slug': 'test-note'
            # Missing markdown and other required fields
        }
        
        response_data, status_code = api_client.create_content_file(incomplete_data)
        assert status_code == 400
        assert 'required fields' in response_data.get('error', '').lower()
    
    def test_create_file_invalid_content_type(self, api_client, skip_if_no_mutation):
        """Test creating file with invalid content type"""
        invalid_data = {
            'type': 'invalid-type',
            'slug': 'test-file',
            'markdown': '# Test',
            'frontmatter': {'title': 'Test'},
            'commitMessage': 'Test commit'
        }
        
        response_data, status_code = api_client.create_content_file(invalid_data)
        assert status_code == 400
        assert 'content type' in response_data.get('error', '').lower()
    
    def test_create_file_invalid_slug(self, api_client, skip_if_no_mutation):
        """Test creating file with invalid slug"""
        invalid_data = {
            'type': 'notes',
            'slug': 'invalid/slug/with/slashes',
            'markdown': '# Test',
            'frontmatter': {'title': 'Test'},
            'commitMessage': 'Test commit'
        }
        
        response_data, status_code = api_client.create_content_file(invalid_data)
        assert status_code == 400
        assert 'slug' in response_data.get('error', '').lower()
    
    def test_update_file_missing_sha(self, api_client, test_content_file_data, skip_if_no_mutation, created_resources):
        """Test updating file without providing SHA"""
        # First create the file
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        if status_code in [200, 201]:
            # Track for cleanup
            created_resources.append({
                'type': test_content_file_data['type'],
                'slug': test_content_file_data['slug']
            })
            
            # Try to update without SHA
            update_data = {
                'markdown': '# Updated Content',
                'frontmatter': {'title': 'Updated Title'},
                'commitMessage': 'Update test file'
                # Missing 'sha' field
            }
            
            response_data, status_code = api_client.update_content_file(
                test_content_file_data['type'],
                test_content_file_data['slug'],
                update_data
            )
            
            assert status_code == 400
            assert 'sha' in response_data.get('error', '').lower()
    
    def test_delete_file_missing_sha(self, api_client, test_content_file_data, skip_if_no_mutation, created_resources):
        """Test deleting file without providing SHA"""
        # First create the file
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        if status_code in [200, 201]:
            # Track for cleanup
            created_resources.append({
                'type': test_content_file_data['type'],
                'slug': test_content_file_data['slug']
            })
            
            # Try to delete without SHA
            delete_data = {
                'commitMessage': 'Delete test file'
                # Missing 'sha' field
            }
            
            response_data, status_code = api_client.delete_content_file(
                test_content_file_data['type'],
                test_content_file_data['slug'],
                delete_data
            )
            
            assert status_code == 400
            assert 'sha' in response_data.get('error', '').lower()


@pytest.mark.functional
@pytest.mark.integration
@pytest.mark.parametrize("content_type", ["notes", "ideas", "publications", "pages"])
class TestContentManagementByTypeIntegration:
    """Test content management integration for different content types"""
    
    def test_list_content_by_type_integration(self, api_client, content_type):
        """Test listing content for each type with GitHub integration"""
        with patch('api.src.services.github_service.GitHubService.listContentFiles') as mock_list:
            mock_list.return_value = [
                f'content/{content_type}/file1.md',
                f'content/{content_type}/file2.md'
            ]
            
            response_data, status_code = api_client.list_content_by_type(content_type)
            
            assert status_code == 200
            assert response_data['type'] == content_type
            assert 'count' in response_data
            assert 'files' in response_data
            assert isinstance(response_data['files'], list)
            mock_list.assert_called_once_with(content_type)
    
    def test_get_content_file_by_type(self, api_client, content_type):
        """Test getting content file for each type"""
        with patch('api.src.services.github_service.GitHubService.getFileContent') as mock_get:
            mock_get.return_value = {
                'content': 'IyBUZXN0IEZpbGU=',
                'sha': 'abc123',
                'name': f'test-{content_type}.md',
                'path': f'content/{content_type}/test-{content_type}.md'
            }
            
            response_data, status_code = api_client.get_content_file(content_type, f'test-{content_type}')
            
            assert status_code == 200
            assert 'path' in response_data
            assert 'slug' in response_data
            assert 'markdown' in response_data
            assert 'frontmatter' in response_data
            assert 'sha' in response_data
            mock_get.assert_called_once_with(content_type, f'test-{content_type}')


@pytest.mark.functional
@pytest.mark.integration
@pytest.mark.slow
class TestContentManagementEndToEnd:
    """End-to-end tests for content management (requires GitHub token)"""
    
    def test_full_crud_workflow(self, api_client, test_content_file_data, skip_if_no_mutation):
        """Test complete CRUD workflow for content management"""
        # This test will only work if GitHub token is configured
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        if status_code in [200, 201]:
            # Success case - verify file was created
            assert 'message' in response_data
            assert 'path' in response_data
            assert 'slug' in response_data
            
            # Try to get the file
            get_response, get_status = api_client.get_content_file(
                test_content_file_data['type'],
                test_content_file_data['slug']
            )
            
            if get_status == 200:
                # File exists, try to update it
                update_data = {
                    'markdown': '# Updated Test File\n\nThis is updated content.',
                    'frontmatter': {
                        'title': 'Updated Test File',
                        'date': '2024-01-16',
                        'description': 'Updated test file'
                    },
                    'sha': get_response['sha'],
                    'commitMessage': 'Update test file'
                }
                
                update_response, update_status = api_client.update_content_file(
                    test_content_file_data['type'],
                    test_content_file_data['slug'],
                    update_data
                )
                
                if update_status in [200, 201]:
                    # Update successful, try to delete
                    delete_data = {
                        'sha': get_response['sha'],
                        'commitMessage': 'Delete test file'
                    }
                    
                    delete_response, delete_status = api_client.delete_content_file(
                        test_content_file_data['type'],
                        test_content_file_data['slug'],
                        delete_data
                    )
                    
                    if delete_status in [200, 204]:
                        # Verify file is deleted
                        final_get_response, final_get_status = api_client.get_content_file(
                            test_content_file_data['type'],
                            test_content_file_data['slug']
                        )
                        assert final_get_status == 404
        else:
            # Failure case - should be due to missing GitHub token
            assert status_code == 500
            assert 'error' in response_data
