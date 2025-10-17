"""
Integration tests for end-to-end workflows with data validation
"""
import pytest


@pytest.mark.mutating
@pytest.mark.integration
@pytest.mark.data_validation
class TestIntegrationWorkflows:
    """Test end-to-end workflows with data validation"""
    
    def test_password_protected_content_workflow(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test complete password-protected content workflow"""
        # 1. Create access rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # 2. Check access requirements
        response, status = api_client.check_access(
            test_access_rule_data['type'],
            test_access_rule_data['slug']
        )
        assert status == 200
        assert response['accessMode'] == 'password'
        assert response['requiresPassword'] is True
        
        # 3. Verify with correct password
        response, status = api_client.verify_password(
            test_access_rule_data['type'],
            test_access_rule_data['slug'],
            test_access_rule_data['password']
        )
        assert status == 200
        assert response['success'] is True
        token = response['token']
        
        # 4. Retrieve protected content
        response, status = api_client.get_protected_content(
            test_access_rule_data['type'],
            test_access_rule_data['slug'],
            token
        )
        assert status == 200
    
    def test_email_list_content_workflow(self, api_client, test_email_rule_data, skip_if_no_mutation, created_resources):
        """Test complete email-list content workflow"""
        # 1. Create access rule
        response, status = api_client.create_access_rule(test_email_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_email_rule_data['type'], 
            'slug': test_email_rule_data['slug']
        })
        
        # 2. Check access requirements
        response, status = api_client.check_access(
            test_email_rule_data['type'],
            test_email_rule_data['slug']
        )
        assert status == 200
        assert response['accessMode'] == 'email-list'
        assert response['requiresEmail'] is True
        
        # 3. Verify with allowed email
        response, status = api_client.verify_email(
            test_email_rule_data['type'],
            test_email_rule_data['slug'],
            test_email_rule_data['allowedEmails'][0]
        )
        assert status == 200
        assert response['success'] is True
        token = response['token']
        
        # 4. Retrieve protected content
        response, status = api_client.get_protected_content(
            test_email_rule_data['type'],
            test_email_rule_data['slug'],
            token
        )
        assert status == 200
    
    def test_open_access_content_workflow(self, api_client, test_open_rule_data, skip_if_no_mutation, created_resources):
        """Test complete open access content workflow"""
        # 1. Create access rule
        response, status = api_client.create_access_rule(test_open_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_open_rule_data['type'], 
            'slug': test_open_rule_data['slug']
        })
        
        # 2. Check access requirements
        response, status = api_client.check_access(
            test_open_rule_data['type'],
            test_open_rule_data['slug']
        )
        assert status == 200
        assert response['accessMode'] == 'open'
        assert response['requiresPassword'] is False
        assert response['requiresEmail'] is False
        
        # 3. Verify open access
        response, status = api_client.verify_open_access(
            test_open_rule_data['type'],
            test_open_rule_data['slug']
        )
        assert status == 200
        assert response['success'] is True
        token = response['token']
        
        # 4. Retrieve content
        response, status = api_client.get_protected_content(
            test_open_rule_data['type'],
            test_open_rule_data['slug'],
            token
        )
        assert status == 200
    
    def test_build_script_integration(self, api_client, skip_if_no_mutation):
        """Test build script integration (content catalog)"""
        # Test content catalog endpoint
        response, status = api_client.get_content_catalog()
        assert status == 200
        assert isinstance(response, dict) or isinstance(response, list)
    
    def test_error_handling_workflow(self, api_client):
        """Test error handling in various scenarios"""
        # Test with non-existent content (should be treated as open access)
        response, status = api_client.verify_open_access('ideas', 'nonexistent-slug')
        assert status == 200
        assert response['success'] is True
        assert response['accessMode'] == 'open'
        
        # Test with invalid token
        response, status = api_client.get_protected_content('ideas', 'test', 'invalid-token')
        assert status == 401
        
        # Test with missing required fields
        response, status = api_client.verify_password('', '', '')
        assert status in [200, 400, 404]  # Should handle gracefully
