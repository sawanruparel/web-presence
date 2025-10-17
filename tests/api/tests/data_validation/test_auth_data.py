"""
Data validation tests for authentication with data validation
"""
import pytest


@pytest.mark.mutating
@pytest.mark.data_validation
class TestAuthenticationDataValidation:
    """Test authentication with data validation"""
    
    def test_password_verification_with_existing_rule(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test password verification with an existing rule"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # Test correct password
        response, status = api_client.verify_password(
            test_access_rule_data['type'],
            test_access_rule_data['slug'],
            test_access_rule_data['password']
        )
        
        assert status == 200
        assert response['success'] is True
        assert 'token' in response
        assert response['accessMode'] == 'password'
    
    def test_password_verification_with_wrong_password(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test password verification with wrong password"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # Test wrong password
        response, status = api_client.verify_password(
            test_access_rule_data['type'],
            test_access_rule_data['slug'],
            'wrongpassword'
        )
        
        assert status == 200
        assert response['success'] is False
        assert 'message' in response
    
    def test_email_verification_with_existing_rule(self, api_client, test_email_rule_data, skip_if_no_mutation, created_resources):
        """Test email verification with an existing email-list rule"""
        # First create the rule
        response, status = api_client.create_access_rule(test_email_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_email_rule_data['type'], 
            'slug': test_email_rule_data['slug']
        })
        
        # Test with allowed email
        response, status = api_client.verify_email(
            test_email_rule_data['type'],
            test_email_rule_data['slug'],
            test_email_rule_data['allowedEmails'][0]
        )
        
        assert status == 200
        assert response['success'] is True
        assert 'token' in response
        assert response['accessMode'] == 'email-list'
    
    def test_email_verification_with_unauthorized_email(self, api_client, test_email_rule_data, skip_if_no_mutation, created_resources):
        """Test email verification with unauthorized email"""
        # First create the rule
        response, status = api_client.create_access_rule(test_email_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_email_rule_data['type'], 
            'slug': test_email_rule_data['slug']
        })
        
        # Test with unauthorized email
        response, status = api_client.verify_email(
            test_email_rule_data['type'],
            test_email_rule_data['slug'],
            'unauthorized@example.com'
        )
        
        assert status == 200
        assert response['success'] is False
        assert 'message' in response
    
    def test_open_access_verification(self, api_client, test_open_rule_data, skip_if_no_mutation, created_resources):
        """Test open access verification"""
        # First create the rule
        response, status = api_client.create_access_rule(test_open_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_open_rule_data['type'], 
            'slug': test_open_rule_data['slug']
        })
        
        # Test open access
        response, status = api_client.verify_open_access(
            test_open_rule_data['type'],
            test_open_rule_data['slug']
        )
        
        assert status == 200
        assert response['success'] is True
        assert 'token' in response
        assert response['accessMode'] == 'open'
    
    def test_protected_content_retrieval(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test protected content retrieval with valid token"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # Get token
        verify_response, status = api_client.verify_password(
            test_access_rule_data['type'],
            test_access_rule_data['slug'],
            test_access_rule_data['password']
        )
        
        assert status == 200
        assert verify_response['success'] is True
        token = verify_response['token']
        
        # Retrieve protected content
        response, status = api_client.get_protected_content(
            test_access_rule_data['type'],
            test_access_rule_data['slug'],
            token
        )
        
        assert status == 200
        assert 'content' in response or 'html' in response
    
    def test_access_check_with_existing_rule(self, api_client, test_access_rule_data, skip_if_no_mutation, created_resources):
        """Test access check with an existing rule"""
        # First create the rule
        response, status = api_client.create_access_rule(test_access_rule_data)
        assert status in [200, 201]
        
        # Track for cleanup
        created_resources.append({
            'type': test_access_rule_data['type'], 
            'slug': test_access_rule_data['slug']
        })
        
        # Check access requirements
        response, status = api_client.check_access(
            test_access_rule_data['type'],
            test_access_rule_data['slug']
        )
        
        assert status == 200
        assert response['accessMode'] == 'password'
        assert response['requiresPassword'] is True
