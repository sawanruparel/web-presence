"""
Data validation tests for access rule CRUD operations
"""
import pytest
import time


@pytest.mark.mutating
@pytest.mark.data_validation
class TestAccessRuleCRUD:
    """Test access rule operations with data validation"""
    
    def test_create_password_rule(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Create and validate password-protected access rule"""
        response, status = api_client.create_access_rule(test_access_rule_data)
        
        assert status in [200, 201]
        assert response['slug'] == test_access_rule_data['slug']
        assert response['accessMode'] == 'password'
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
    
    def test_create_email_rule(self, api_client, test_email_rule_data, skip_if_no_mutation, created_resources):
        """Create and validate email-list access rule"""
        response, status = api_client.create_access_rule(test_email_rule_data)
        
        assert status in [200, 201]
        assert response['slug'] == test_email_rule_data['slug']
        assert response['accessMode'] == 'email-list'
        
        # Track for cleanup
        created_resources.append({
            'type': test_email_rule_data['type'], 
            'slug': test_email_rule_data['slug']
        })
    
    def test_create_open_rule(self, api_client, test_open_rule_data, skip_if_no_mutation, created_resources):
        """Create and validate open access rule"""
        response, status = api_client.create_access_rule(test_open_rule_data)
        
        assert status in [200, 201]
        assert response['slug'] == test_open_rule_data['slug']
        assert response['accessMode'] == 'open'
        
        # Track for cleanup
        created_resources.append({
            'type': test_open_rule_data['type'], 
            'slug': test_open_rule_data['slug']
        })
    
    def test_get_access_rule(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test retrieving a specific access rule"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # Then retrieve it
        response, status = api_client.get_access_rule(
            test_access_rule_data['type'], 
            test_access_rule_data['slug']
        )
        
        assert status == 200
        assert response['slug'] == test_access_rule_data['slug']
        assert response['accessMode'] == 'password'
    
    def test_update_access_rule(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test updating an access rule"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # Update the rule
        update_data = {
            'description': 'Updated test rule',
            'password': 'newpassword123'
        }
        
        response, status = api_client.update_access_rule(
            test_access_rule_data['type'], 
            test_access_rule_data['slug'],
            update_data
        )
        
        assert status in [200, 201]
        assert response['description'] == 'Updated test rule'
    
    def test_delete_access_rule(self, api_client, test_access_rule_data, skip_if_no_mutation):
        """Test deleting an access rule"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Delete the rule
        response, status = api_client.delete_access_rule(
            test_access_rule_data['type'], 
            test_access_rule_data['slug']
        )
        
        assert status in [200, 204]
        
        # Verify it's deleted
        response, status = api_client.get_access_rule(
            test_access_rule_data['type'], 
            test_access_rule_data['slug']
        )
        assert status == 404
    
    def test_list_access_rules(self, api_client, skip_if_no_mutation):
        """Test listing all access rules"""
        response, status = api_client.get_access_rules()
        
        assert status == 200
        assert 'rules' in response or isinstance(response, list)
    
    def test_filter_access_rules_by_type(self, api_client, skip_if_no_mutation):
        """Test filtering access rules by type"""
        response, status = api_client.get_access_rules(content_type='ideas')
        
        assert status == 200
        assert 'rules' in response or isinstance(response, list)
    
    def test_filter_access_rules_by_mode(self, api_client, skip_if_no_mutation):
        """Test filtering access rules by access mode"""
        response, status = api_client.get_access_rules(access_mode='password')
        
        assert status == 200
        assert 'rules' in response or isinstance(response, list)
