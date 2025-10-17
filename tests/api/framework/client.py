"""
API Test Client
Provides a convenient interface for making API requests during testing
"""
import requests
import json
from typing import Dict, Any, Optional, Tuple
from .config import API_BASE_URL, API_KEY, STATUS_CODES


class APITestClient:
    """Test client for making API requests"""
    
    def __init__(self, base_url: str = API_BASE_URL, api_key: str = API_KEY):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'API-Test-Client/1.0'
        })
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     headers: Optional[Dict] = None, expected_status: Optional[int] = None) -> Tuple[Dict, int]:
        """Make an API request and return response data and status code"""
        url = f"{self.base_url}{endpoint}"
        
        # Add API key to headers if not already present
        request_headers = headers or {}
        if 'X-API-Key' not in request_headers and (endpoint.startswith('/api/internal') or endpoint.startswith('/api/content-catalog')):
            request_headers['X-API-Key'] = self.api_key
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=request_headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=request_headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=request_headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=request_headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            # Parse JSON response
            try:
                response_data = response.json()
            except json.JSONDecodeError:
                response_data = {'raw_response': response.text}
            
            # Check expected status if provided
            if expected_status and response.status_code != expected_status:
                raise AssertionError(
                    f"Expected status {expected_status}, got {response.status_code}. "
                    f"Response: {response_data}"
                )
            
            return response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {e}")
    
    # Health endpoints
    def health_check(self) -> Tuple[Dict, int]:
        """GET /health"""
        return self._make_request('GET', '/health')
    
    # Authentication endpoints
    def verify_password(self, content_type: str, slug: str, password: str) -> Tuple[Dict, int]:
        """POST /auth/verify with password"""
        data = {
            'type': content_type,
            'slug': slug,
            'password': password
        }
        return self._make_request('POST', '/auth/verify', data)
    
    def verify_email(self, content_type: str, slug: str, email: str) -> Tuple[Dict, int]:
        """POST /auth/verify with email"""
        data = {
            'type': content_type,
            'slug': slug,
            'email': email
        }
        return self._make_request('POST', '/auth/verify', data)
    
    def verify_open_access(self, content_type: str, slug: str) -> Tuple[Dict, int]:
        """POST /auth/verify for open access content"""
        data = {
            'type': content_type,
            'slug': slug
        }
        return self._make_request('POST', '/auth/verify', data)
    
    def check_access(self, content_type: str, slug: str) -> Tuple[Dict, int]:
        """GET /auth/access/:type/:slug"""
        return self._make_request('GET', f'/auth/access/{content_type}/{slug}')
    
    def get_protected_content(self, content_type: str, slug: str, token: str) -> Tuple[Dict, int]:
        """GET /auth/content/:type/:slug with Bearer token"""
        headers = {'Authorization': f'Bearer {token}'}
        return self._make_request('GET', f'/auth/content/{content_type}/{slug}', headers=headers)
    
    # Admin endpoints
    def create_access_rule(self, rule_data: Dict) -> Tuple[Dict, int]:
        """POST /api/internal/access-rules"""
        return self._make_request('POST', '/api/internal/access-rules', rule_data)
    
    def get_access_rules(self, content_type: Optional[str] = None, 
                        access_mode: Optional[str] = None) -> Tuple[Dict, int]:
        """GET /api/internal/access-rules with optional filters"""
        params = []
        if content_type:
            params.append(f'type={content_type}')
        if access_mode:
            params.append(f'mode={access_mode}')
        
        endpoint = '/api/internal/access-rules'
        if params:
            endpoint += '?' + '&'.join(params)
        
        return self._make_request('GET', endpoint)
    
    def get_access_rule(self, content_type: str, slug: str) -> Tuple[Dict, int]:
        """GET /api/internal/access-rules/:type/:slug"""
        return self._make_request('GET', f'/api/internal/access-rules/{content_type}/{slug}')
    
    def update_access_rule(self, content_type: str, slug: str, update_data: Dict) -> Tuple[Dict, int]:
        """PUT /api/internal/access-rules/:type/:slug"""
        return self._make_request('PUT', f'/api/internal/access-rules/{content_type}/{slug}', update_data)
    
    def delete_access_rule(self, content_type: str, slug: str) -> Tuple[Dict, int]:
        """DELETE /api/internal/access-rules/:type/:slug"""
        return self._make_request('DELETE', f'/api/internal/access-rules/{content_type}/{slug}')
    
    def add_email_to_allowlist(self, content_type: str, slug: str, email: str) -> Tuple[Dict, int]:
        """POST /api/internal/access-rules/:type/:slug/emails"""
        data = {'email': email}
        return self._make_request('POST', f'/api/internal/access-rules/{content_type}/{slug}/emails', data)
    
    def remove_email_from_allowlist(self, content_type: str, slug: str, email: str) -> Tuple[Dict, int]:
        """DELETE /api/internal/access-rules/:type/:slug/emails/:email"""
        return self._make_request('DELETE', f'/api/internal/access-rules/{content_type}/{slug}/emails/{email}')
    
    def get_logs(self, limit: Optional[int] = None, failed: Optional[bool] = None,
                content_type: Optional[str] = None, slug: Optional[str] = None) -> Tuple[Dict, int]:
        """GET /api/internal/logs with optional filters"""
        params = []
        if limit:
            params.append(f'limit={limit}')
        if failed is not None:
            params.append(f'failed={str(failed).lower()}')
        if content_type:
            params.append(f'type={content_type}')
        if slug:
            params.append(f'slug={slug}')
        
        endpoint = '/api/internal/logs'
        if params:
            endpoint += '?' + '&'.join(params)
        
        return self._make_request('GET', endpoint)
    
    def get_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Tuple[Dict, int]:
        """GET /api/internal/stats with optional date range"""
        params = []
        if start_date:
            params.append(f'start={start_date}')
        if end_date:
            params.append(f'end={end_date}')
        
        endpoint = '/api/internal/stats'
        if params:
            endpoint += '?' + '&'.join(params)
        
        return self._make_request('GET', endpoint)
    
    # Build script endpoints
    def get_content_catalog(self) -> Tuple[Dict, int]:
        """GET /api/content-catalog"""
        return self._make_request('GET', '/api/content-catalog')
    
    def get_content_catalog_by_type(self, content_type: str) -> Tuple[Dict, int]:
        """GET /api/content-catalog/:type"""
        return self._make_request('GET', f'/api/content-catalog/{content_type}')
