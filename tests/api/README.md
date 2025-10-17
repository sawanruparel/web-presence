# API Test Suite

A comprehensive, config-driven test suite for the Web Presence API with environment-aware testing and proper separation of concerns.

## 🏗️ Architecture

### Folder Structure

```
tests/api/
├── data/                           # Test data and configurations
│   ├── test-data-dev.yaml         # Dev environment test data
│   ├── test-data-staging.yaml     # Staging environment test data
│   ├── test-data-prod.yaml        # Prod environment test data
│   └── test-scenarios.yaml        # Test scenarios
├── framework/                      # Generic test framework
│   ├── config.py                  # Environment configuration
│   ├── client.py                  # API client
│   ├── fixtures.py                # Pytest fixtures
│   └── utils.py                   # Helper utilities
├── tests/                          # Application-specific tests
│   ├── functional/                # Read-only functional tests
│   │   ├── test_health.py        # Health endpoint tests
│   │   ├── test_auth_flow.py     # Auth flow tests
│   │   └── test_endpoints.py     # Endpoint availability tests
│   └── data_validation/           # Data mutation tests
│       ├── test_access_rules.py  # Access rule CRUD tests
│       ├── test_auth_data.py     # Auth with data validation
│       └── test_integration.py   # End-to-end workflows
├── scripts/                        # Test execution scripts
│   ├── run_tests.py               # Python test runner
│   └── run.sh                     # Shell test runner
├── .env.dev                       # Development environment config
├── .env.staging                   # Staging environment config
├── .env.prod                      # Production environment config
├── conftest.py                    # Pytest configuration
├── pytest.ini                    # Pytest settings
└── requirements.txt               # Python dependencies
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- API running (for dev environment)

### Installation

```bash
# Navigate to test directory
cd tests/api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running Tests

#### Quick Test (Development)

```bash
# Run all tests in dev environment
./scripts/run.sh dev

# Or using Python directly
python scripts/run_tests.py --env dev
```

#### Environment-Specific Testing

```bash
# Development (full test suite)
./scripts/run.sh dev

# Staging (full test suite)
./scripts/run.sh staging

# Production (functional tests only)
./scripts/run.sh prod
```

#### Test Selection

```bash
# Run only functional tests (safe for production)
python scripts/run_tests.py --env prod --readonly-only

# Run only data validation tests
python scripts/run_tests.py --env dev --mutating-only

# Run with verbose output
python scripts/run_tests.py --env dev --verbose

# Run with coverage
python scripts/run_tests.py --env dev --coverage
```

## 🔧 Configuration

### Environment Configuration (.env files)

Each environment has its own configuration file:

#### Development (.env.dev)
```bash
TEST_ENV=dev
API_BASE_URL=http://localhost:8787
API_KEY=your-dev-api-key
ALLOW_DATA_MUTATION=true
CLEANUP_TEST_DATA=true
REQUIRE_CONFIRMATION=false
```

#### Production (.env.prod)
```bash
TEST_ENV=prod
API_BASE_URL=https://api.production.com
API_KEY=your-prod-api-key
ALLOW_DATA_MUTATION=true
CLEANUP_TEST_DATA=true
REQUIRE_CONFIRMATION=true
MAX_TEST_DATA_AGE_HOURS=24
```

### Test Data Configuration (YAML files)

Test data is defined in YAML files for each environment:

#### Example: test-data-dev.yaml
```yaml
test_users:
  - email: user1@example.com
  - email: user2@example.com

access_rules:
  password_protected:
    - type: ideas
      slug_template: "test-idea-{timestamp}"
      password: test123
      description: Test password-protected idea
  
  email_list:
    - type: publications
      slug_template: "test-pub-{timestamp}"
      allowed_emails: [user1@example.com, user2@example.com]
      description: Test email-list publication
```

## 🧪 Test Types

### Functional Tests (Read-Only)

- **Purpose**: Test API behavior and availability
- **Safety**: Safe to run in all environments
- **Examples**: Endpoint availability, response structure, error handling
- **Markers**: `@pytest.mark.readonly`, `@pytest.mark.functional`

### Data Validation Tests (Mutating)

- **Purpose**: Test data operations and validate specific values
- **Safety**: Only run in dev/staging environments
- **Examples**: CRUD operations, data validation, end-to-end workflows
- **Markers**: `@pytest.mark.mutating`, `@pytest.mark.data_validation`

## 🛡️ Safety Features

### Production Safety

- **Qualified Test Data**: Production tests use prefixed slugs (`test-automated-*`)
- **Cleanup Criteria**: Only resources with specific markers are cleaned up
- **Confirmation Required**: Production tests require explicit confirmation
- **Age Limits**: Only cleanup test data older than specified hours

### Environment Guards

- **Mutation Control**: Data mutations can be disabled per environment
- **Cleanup Control**: Automatic cleanup can be disabled
- **Confirmation Prompts**: Interactive confirmation for dangerous operations

## 📊 Test Markers

| Marker | Description | Environment |
|--------|-------------|-------------|
| `readonly` | Read-only functional tests | All |
| `mutating` | Data mutation tests | Dev/Staging |
| `functional` | API behavior tests | All |
| `data_validation` | Data value validation | Dev/Staging |
| `integration` | End-to-end workflows | Dev/Staging |

## 🔍 Troubleshooting

### Common Issues

#### API Not Running (Dev Environment)
```bash
# Start the API
cd ../../api && npm run dev

# Then run tests
./scripts/run.sh dev
```

#### Permission Denied
```bash
# Make scripts executable
chmod +x scripts/run.sh
chmod +x scripts/run_tests.py
```

#### Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Test Data Conflicts
```bash
# Tests use unique timestamps to avoid conflicts
# If you still see conflicts, check for leftover test data
```

### Debug Mode

```bash
# Run with verbose output and debugging
python scripts/run_tests.py --env dev --verbose

# Run specific test file
python -m pytest tests/functional/test_health.py -v

# Run specific test method
python -m pytest tests/functional/test_health.py::TestHealthEndpoint::test_api_is_accessible -v
```

## 📈 Advanced Usage

### Custom Test Data

Create custom test data by modifying the YAML files:

```yaml
# Add new test scenario
access_rules:
  custom_scenario:
    - type: notes
      slug_template: "custom-test-{timestamp}"
      description: "Custom test scenario"
```

### Environment Variables

Override configuration with environment variables:

```bash
# Override API URL
export API_BASE_URL=https://custom-api.example.com
python scripts/run_tests.py --env dev

# Force production mutations (dangerous!)
export ALLOW_DATA_MUTATION_PROD=true
python scripts/run_tests.py --env prod
```

### Parallel Testing

```bash
# Run tests in parallel (faster)
python scripts/run_tests.py --env dev --parallel 4
```

### Coverage Reporting

```bash
# Generate coverage report
python scripts/run_tests.py --env dev --coverage

# View HTML coverage report
open htmlcov/index.html
```

## 🤝 Contributing

### Adding New Tests

1. **Functional Tests**: Add to `tests/functional/`
2. **Data Validation Tests**: Add to `tests/data_validation/`
3. **Use Appropriate Markers**: Mark tests with `@pytest.mark.readonly` or `@pytest.mark.mutating`
4. **Use Fixtures**: Leverage existing fixtures for setup/teardown

### Adding New Test Data

1. **Update YAML Files**: Add new test data to environment-specific YAML files
2. **Use Templates**: Use `{timestamp}` for unique slugs
3. **Follow Naming**: Use consistent naming patterns

### Adding New Environments

1. **Create .env File**: Add `.env.{environment}` file
2. **Create Test Data**: Add `test-data-{environment}.yaml` file
3. **Update Scripts**: Add environment to argument choices

## 📝 License

This test suite is part of the Web Presence project.