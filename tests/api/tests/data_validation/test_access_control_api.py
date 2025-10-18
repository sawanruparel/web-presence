"""
Data validation tests for access control API CRUD operations
"""
import pytest
import time


@pytest.mark.mutating
@pytest.mark.data_validation
class TestAccessControlAPICRUD:
    """Test access control API operations with data validation"""
    
    def test_create_password_rule(self, api_client, test_access_control_password_rule, skip_if_no_mutation, created_resources):
        """Create and validate password-protected access rule via new API"""
        response, status = api_client.create_access_control_rule(test_access_control_password_rule)
        
        assert status in [200, 201]
        assert response['slug'] == test_access_control_password_rule['slug']
        assert response['accessMode'] == 'password'
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_password_rule['type'], 
            'slug': test_access_control_password_rule['slug']
        })
    
    def test_create_email_rule(self, api_client, test_access_control_email_rule, skip_if_no_mutation, created_resources):
        """Create and validate email-list access rule via new API"""
        response, status = api_client.create_access_control_rule(test_access_control_email_rule)
        
        assert status in [200, 201]
        assert response['slug'] == test_access_control_email_rule['slug']
        assert response['accessMode'] == 'email-list'
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_email_rule['type'], 
            'slug': test_access_control_email_rule['slug']
        })
    
    def test_create_open_rule(self, api_client, test_access_control_open_rule, skip_if_no_mutation, created_resources):
        """Create and validate open access rule via new API"""
        response, status = api_client.create_access_control_rule(test_access_control_open_rule)
        
        assert status in [200, 201]
        assert response['slug'] == test_access_control_open_rule['slug']
        assert response['accessMode'] == 'open'
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_open_rule['type'], 
            'slug': test_access_control_open_rule['slug']
        })
    
    def test_get_access_control_rule(self, api_client, test_access_control_password_rule, skip_if_no_mutation, created_resources):
        """Test retrieving a specific access control rule via new API"""
        # First create the rule
        response, status = api_client.create_access_control_rule(test_access_control_password_rule)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_password_rule['type'], 
            'slug': test_access_control_password_rule['slug']
        })
        
        # Then retrieve it
        response, status = api_client.get_access_control_rule(
            test_access_control_password_rule['type'], 
            test_access_control_password_rule['slug']
        )
        
        assert status == 200
        assert response['slug'] == test_access_control_password_rule['slug']
        assert response['accessMode'] == 'password'
    
    def test_update_access_control_rule(self, api_client, test_access_control_password_rule, test_access_control_updates, skip_if_no_mutation, created_resources):
        """Test updating an access control rule via new API"""
        # First create the rule
        response, status = api_client.create_access_control_rule(test_access_control_password_rule)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_password_rule['type'], 
            'slug': test_access_control_password_rule['slug']
        })
        
        # Update the rule with description change
        update_data = test_access_control_updates[1]  # update_description
        response, status = api_client.update_access_control_rule(
            test_access_control_password_rule['type'], 
            test_access_control_password_rule['slug'],
            update_data
        )
        
        assert status in [200, 201]
        assert response['description'] == 'Updated test rule'
    
    def test_delete_access_control_rule(self, api_client, test_access_control_password_rule, skip_if_no_mutation):
        """Test deleting an access control rule via new API"""
        # First create the rule
        response, status = api_client.create_access_control_rule(test_access_control_password_rule)
        assert status in [200, 201]
        
        # Delete the rule
        response, status = api_client.delete_access_control_rule(
            test_access_control_password_rule['type'], 
            test_access_control_password_rule['slug'],
            {}  # Empty data for delete
        )
        
        assert status in [200, 204]
        
        # Verify it's deleted
        response, status = api_client.get_access_control_rule(
            test_access_control_password_rule['type'], 
            test_access_control_password_rule['slug']
        )
        assert status == 404
    
    def test_list_access_control_rules(self, api_client, skip_if_no_mutation):
        """Test listing all access control rules via new API"""
        response, status = api_client.get_access_control_rules()
        
        assert status == 200
        assert 'rules' in response
        assert isinstance(response['rules'], list)
        assert 'count' in response
        assert isinstance(response['count'], int)
    
    def test_get_access_control_logs(self, api_client, skip_if_no_mutation):
        """Test getting access control logs via new API"""
        response, status = api_client.get_access_control_logs()
        
        assert status == 200
        assert 'logs' in response
        assert isinstance(response['logs'], list)
        assert 'pagination' in response
        
        # Check pagination structure
        pagination = response['pagination']
        assert 'page' in pagination
        assert 'limit' in pagination
        assert 'total' in pagination
        assert 'totalPages' in pagination
        assert 'hasNext' in pagination
        assert 'hasPrev' in pagination


@pytest.mark.mutating
@pytest.mark.data_validation
class TestAccessControlAPIValidation:
    """Test access control API validation and error handling"""
    
    def test_create_rule_missing_required_fields(self, api_client, test_access_control_invalid_data, skip_if_no_mutation):
        """Test creating rule with missing required fields"""
        invalid_data = test_access_control_invalid_data[0]  # missing_required_fields
        response, status = api_client.create_access_control_rule(invalid_data['data'])
        
        assert status == 400
        assert 'required fields' in response.get('error', '').lower()
    
    def test_create_rule_invalid_access_mode(self, api_client, test_access_control_invalid_data, skip_if_no_mutation):
        """Test creating rule with invalid access mode"""
        invalid_data = test_access_control_invalid_data[1]  # invalid_access_mode
        response, status = api_client.create_access_control_rule(invalid_data['data'])
        
        assert status == 400
        assert 'access mode' in response.get('error', '').lower()
    
    def test_create_rule_empty_email_list(self, api_client, test_access_control_invalid_data, skip_if_no_mutation):
        """Test creating email-list rule with empty email list"""
        invalid_data = test_access_control_invalid_data[2]  # empty_email_list
        response, status = api_client.create_access_control_rule(invalid_data['data'])
        
        assert status == 400
        assert 'email list' in response.get('error', '').lower()
    
    def test_get_nonexistent_rule(self, api_client):
        """Test getting a rule that doesn't exist"""
        response, status = api_client.get_access_control_rule('notes', 'nonexistent-rule')
        assert status == 404
        assert 'not found' in response.get('error', '').lower()
    
    def test_update_nonexistent_rule(self, api_client, skip_if_no_mutation):
        """Test updating a rule that doesn't exist"""
        update_data = {'description': 'Updated rule'}
        response, status = api_client.update_access_control_rule('notes', 'nonexistent-rule', update_data)
        assert status == 404
        assert 'not found' in response.get('error', '').lower()
    
    def test_delete_nonexistent_rule(self, api_client, skip_if_no_mutation):
        """Test deleting a rule that doesn't exist"""
        response, status = api_client.delete_access_control_rule('notes', 'nonexistent-rule', {})
        assert status == 404
        assert 'not found' in response.get('error', '').lower()


@pytest.mark.mutating
@pytest.mark.data_validation
class TestAccessControlAPIIntegration:
    """Test access control API integration with content processing"""
    
    def test_rule_affects_content_processing(self, api_client, test_access_control_password_rule, skip_if_no_mutation, created_resources):
        """Test that access control rules affect content processing"""
        # Create a password-protected rule
        response, status = api_client.create_access_control_rule(test_access_control_password_rule)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_password_rule['type'], 
            'slug': test_access_control_password_rule['slug']
        })
        
        # Verify the rule exists and has correct access mode
        response, status = api_client.get_access_control_rule(
            test_access_control_password_rule['type'], 
            test_access_control_password_rule['slug']
        )
        assert status == 200
        assert response['accessMode'] == 'password'
        assert 'passwordHash' in response
    
    def test_email_rule_has_allowlist(self, api_client, test_access_control_email_rule, skip_if_no_mutation, created_resources):
        """Test that email-list rules have proper allowlist"""
        # Create an email-list rule
        response, status = api_client.create_access_control_rule(test_access_control_email_rule)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_control_email_rule['type'], 
            'slug': test_access_control_email_rule['slug']
        })
        
        # Verify the rule has allowlist
        response, status = api_client.get_access_control_rule(
            test_access_control_email_rule['type'], 
            test_access_control_email_rule['slug']
        )
        assert status == 200
        assert response['accessMode'] == 'email-list'
        assert 'allowedEmails' in response
        assert isinstance(response['allowedEmails'], list)
        assert len(response['allowedEmails']) > 0


@pytest.mark.functional
@pytest.mark.parametrize("rule_type", ["password", "email-list", "open"])
class TestAccessControlAPIParameterized:
    """Parameterized tests for different access control rule types"""
    
    def test_create_rule_by_type(self, api_client, test_data, rule_type, skip_if_no_mutation, created_resources):
        """Test creating rules of different types"""
        rule_template = test_data['access_control_api']['rules'][f'{rule_type}_rule']
        rule_data = {
            'type': rule_template['type'],
            'slug': rule_template['slug_template'].format(timestamp=int(time.time())),
            'accessMode': rule_template['accessMode'],
            'description': rule_template['description']
        }
        
        # Add type-specific fields
        if rule_type == 'password':
            rule_data['passwordHash'] = rule_template['password']
        elif rule_type == 'email-list':
            rule_data['allowedEmails'] = rule_template['allowedEmails']
        
        response, status = api_client.create_access_control_rule(rule_data)
        assert status in [200, 201]
        assert response['accessMode'] == rule_type
        
        # Track for cleanup
        created_resources.append({
            'type': rule_data['type'], 
            'slug': rule_data['slug']
        })
    
    def test_rule_type_validation(self, api_client, rule_type, skip_if_no_mutation):
        """Test that rule types are properly validated"""
        # Test with invalid access mode
        invalid_rule = {
            'type': 'notes',
            'slug': f'test-{rule_type}-{int(time.time())}',
            'accessMode': 'invalid-mode',
            'description': 'Test rule'
        }
        
        response, status = api_client.create_access_control_rule(invalid_rule)
        assert status == 400
        assert 'access mode' in response.get('error', '').lower()
