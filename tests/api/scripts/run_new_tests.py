#!/usr/bin/env python3
"""
Test runner for new API endpoints and services
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

# Add the tests directory to Python path
tests_dir = Path(__file__).parent.parent
sys.path.insert(0, str(tests_dir))

def run_tests(test_pattern=None, verbose=False, markers=None, environment='dev'):
    """Run tests with specified parameters"""
    
    # Set environment
    os.environ['TEST_ENV'] = environment
    
    # Build pytest command
    cmd = ['python', '-m', 'pytest']
    
    # Add test pattern if specified
    if test_pattern:
        cmd.append(test_pattern)
    else:
        # Default to new test files
        cmd.extend([
            'tests/functional/test_content_sync.py',
            'tests/functional/test_content_management.py',
            'tests/functional/test_content_sync_integration.py',
            'tests/functional/test_content_management_integration.py',
            'tests/data_validation/test_access_control_api.py'
        ])
    
    # Add markers if specified
    if markers:
        cmd.extend(['-m', markers])
    
    # Add verbosity
    if verbose:
        cmd.append('-v')
    else:
        cmd.append('-q')
    
    # Add other useful options
    cmd.extend([
        '--tb=short',
        '--strict-markers',
        '--disable-warnings'
    ])
    
    print(f"Running command: {' '.join(cmd)}")
    print(f"Environment: {environment}")
    print("-" * 50)
    
    # Run the tests
    try:
        result = subprocess.run(cmd, cwd=tests_dir, check=False)
        return result.returncode
    except KeyboardInterrupt:
        print("\nTest run interrupted by user")
        return 1
    except Exception as e:
        print(f"Error running tests: {e}")
        return 1

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Run new API tests')
    parser.add_argument(
        '--pattern', '-p',
        help='Test pattern to run (e.g., "test_content_sync")'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Verbose output'
    )
    parser.add_argument(
        '--markers', '-m',
        help='Pytest markers to filter tests (e.g., "functional and not slow")'
    )
    parser.add_argument(
        '--environment', '-e',
        choices=['dev', 'staging', 'prod'],
        default='dev',
        help='Test environment (default: dev)'
    )
    parser.add_argument(
        '--list-tests',
        action='store_true',
        help='List available tests without running them'
    )
    
    args = parser.parse_args()
    
    if args.list_tests:
        # List available tests
        cmd = ['python', '-m', 'pytest', '--collect-only', '-q']
        if args.pattern:
            cmd.append(args.pattern)
        else:
            cmd.extend([
                'tests/functional/test_content_sync.py',
                'tests/functional/test_content_management.py',
                'tests/functional/test_content_sync_integration.py',
                'tests/functional/test_content_management_integration.py',
                'tests/data_validation/test_access_control_api.py'
            ])
        
        print("Available tests:")
        print("-" * 50)
        subprocess.run(cmd, cwd=tests_dir)
        return 0
    
    # Run tests
    return run_tests(
        test_pattern=args.pattern,
        verbose=args.verbose,
        markers=args.markers,
        environment=args.environment
    )

if __name__ == '__main__':
    sys.exit(main())
