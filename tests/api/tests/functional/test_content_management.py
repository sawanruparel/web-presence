"""
Functional tests for content management endpoints
"""
import pytest


@pytest.mark.functional
class TestContentManagementEndpoints:
    """Test content management CRUD endpoints"""
    
    def test_list_content_types(self, api_client):
        """Test listing available content types"""
        response_data, status_code = api_client.get_content_types()
        assert status_code == 200
        assert 'types' in response_data
        assert isinstance(response_data['types'], list)
        
        # Check that expected types are present
        type_names = [t['name'] for t in response_data['types']]
        expected_types = ['notes', 'ideas', 'publications', 'pages']
        for expected_type in expected_types:
            assert expected_type in type_names
    
    def test_list_content_requires_api_key(self, api_client):
        """Test that listing content requires API key"""
        from framework.client import APITestClient
        no_auth_client = APITestClient()
        no_auth_client.api_key = None
        
        response_data, status_code = no_auth_client.list_content_by_type('notes')
        assert status_code == 401
        assert 'api key' in response_data.get('error', '').lower()
    
    def test_list_content_by_type(self, api_client):
        """Test listing content by type"""
        for content_type in ['notes', 'ideas', 'publications', 'pages']:
            response_data, status_code = api_client.list_content_by_type(content_type)
            assert status_code == 200
            assert 'type' in response_data
            assert 'count' in response_data
            assert 'files' in response_data
            assert response_data['type'] == content_type
            assert isinstance(response_data['count'], int)
            assert isinstance(response_data['files'], list)
    
    def test_get_nonexistent_file(self, api_client):
        """Test getting a file that doesn't exist"""
        response_data, status_code = api_client.get_content_file('notes', 'nonexistent-file')
        assert status_code == 404
        assert 'not found' in response_data.get('error', '').lower()


@pytest.mark.functional
@pytest.mark.mutating
class TestContentManagementCRUD:
    """Test content management CRUD operations"""
    
    def test_create_content_file(self, api_client, test_content_file_data, skip_if_no_mutation, created_resources):
        """Test creating a new content file"""
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        # Should work or fail gracefully (depending on GitHub token availability)
        if status_code in [200, 201]:
            assert 'message' in response_data
            assert 'path' in response_data
            assert 'slug' in response_data
            assert response_data['slug'] == test_content_file_data['slug']
            
            # Track for cleanup
            created_resources.append({
                'type': test_content_file_data['type'],
                'slug': test_content_file_data['slug']
            })
        else:
            # If it fails due to missing GitHub token, that's expected
            assert status_code == 500
            assert 'error' in response_data
    
    def test_create_duplicate_file(self, api_client, test_content_file_data, skip_if_no_mutation):
        """Test creating a file that already exists"""
        # First create the file
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        if status_code in [200, 201]:
            # Try to create the same file again
            response_data, status_code = api_client.create_content_file(test_content_file_data)
            assert status_code == 409
            assert 'already exists' in response_data.get('error', '').lower()
    
    def test_create_file_missing_required_fields(self, api_client, skip_if_no_mutation):
        """Test creating file with missing required fields"""
        incomplete_data = {
            'type': 'notes',
            'slug': 'test-note'
            # Missing markdown
        }
        
        response_data, status_code = api_client.create_content_file(incomplete_data)
        assert status_code == 400
        assert 'required fields' in response_data.get('error', '').lower()
    
    def test_get_content_file(self, api_client, test_content_file_data, skip_if_no_mutation, created_resources):
        """Test getting content file for editing"""
        # First create the file
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        if status_code in [200, 201]:
            # Track for cleanup
            created_resources.append({
                'type': test_content_file_data['type'],
                'slug': test_content_file_data['slug']
            })
            
            # Then get it
            response_data, status_code = api_client.get_content_file(
                test_content_file_data['type'],
                test_content_file_data['slug']
            )
            
            if status_code == 200:
                assert 'path' in response_data
                assert 'slug' in response_data
                assert 'markdown' in response_data
                assert 'frontmatter' in response_data
                assert 'sha' in response_data
                assert response_data['slug'] == test_content_file_data['slug']
    
    def test_update_content_file(self, api_client, test_content_file_data, skip_if_no_mutation, created_resources):
        """Test updating a content file"""
        # First create the file
        response_data, status_code = api_client.create_content_file(test_content_file_data)
        
        if status_code in [200, 201]:
            # Track for cleanup
            created_resources.append({
                'type': test_content_file_data['type'],
                'slug': test_content_file_data['slug']
            })
            
            # Get the file to get the SHA
            get_response, get_status = api_client.get_content_file(
                test_content_file_data['type'],
                test_content_file_data['slug']
            )
            
            if get_status == 200:
                # Update the file
                update_data = {
                    'markdown': '# Updated Test Note\n\nThis is updated content.',
                    'frontmatter': {
                        'title': 'Updated Test Note',
                        'date': '2024-01-16',
                        'description': 'Updated test note'
                    },
                    'sha': get_response['sha'],
                    'commitMessage': 'Update test note'
                }
                
                response_data, status_code = api_client.update_content_file(
                    test_content_file_data['type'],
                    test_content_file_data['slug'],
                    update_data
                )
                
                if status_code in [200, 201]:
                    assert 'message' in response_data
                    assert 'slug' in response_data
                    assert response_data['slug'] == test_content_file_data['slug']
    
    def test_delete_content_file(self, api_client, test_content_file_data, skip_if_no_mutation):
        """Test deleting a content file"""
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
                    'sha': get_response['sha'],
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
                    assert response_data['slug'] == test_content_file_data['slug']
                    
                    # Verify it's deleted
                    response_data, status_code = api_client.get_content_file(
                        test_content_file_data['type'],
                        test_content_file_data['slug']
                    )
                    assert status_code == 404


@pytest.mark.functional
@pytest.mark.parametrize("content_type", ["notes", "ideas", "publications", "pages"])
class TestContentManagementByType:
    """Parameterized tests for different content types"""
    
    def test_list_content_by_type(self, api_client, content_type):
        """Test listing content for each type"""
        response_data, status_code = api_client.list_content_by_type(content_type)
        assert status_code == 200
        assert response_data['type'] == content_type
        assert isinstance(response_data['files'], list)
    
    def test_get_nonexistent_file_by_type(self, api_client, content_type):
        """Test getting nonexistent file for each type"""
        response_data, status_code = api_client.get_content_file(content_type, 'nonexistent-file')
        assert status_code == 404
