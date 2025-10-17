#!/usr/bin/env python3
"""
Test runner script for the refactored API test suite
"""
import os
import sys
import argparse
import subprocess
from pathlib import Path

# Add the parent directory to the path so we can import framework modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from framework.config import load_environment, TEST_ENV, API_BASE_URL, ALLOW_DATA_MUTATION, CLEANUP_TEST_DATA


def main():
    parser = argparse.ArgumentParser(description='Run API tests')
    parser.add_argument('--env', choices=['dev', 'staging', 'prod'], 
                       default='dev', help='Environment to test against')
    parser.add_argument('--readonly-only', action='store_true',
                       help='Run only read-only functional tests')
    parser.add_argument('--mutating-only', action='store_true',
                       help='Run only mutating data validation tests')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Verbose output')
    parser.add_argument('--coverage', action='store_true',
                       help='Run with coverage reporting')
    parser.add_argument('--parallel', '-n', type=int, default=1,
                       help='Number of parallel workers')
    
    args = parser.parse_args()
    
    # Load environment configuration
    load_environment(args.env)
    
    # Set environment variables
    os.environ['TEST_ENV'] = args.env
    
    # Display environment info
    print(f"🌍 Testing Environment: {TEST_ENV}")
    print(f"🔗 API URL: {API_BASE_URL}")
    print(f"🔒 Data Mutations: {'Allowed' if ALLOW_DATA_MUTATION else 'Disabled'}")
    print(f"🧹 Cleanup: {'Enabled' if CLEANUP_TEST_DATA else 'Disabled'}")
    
    if TEST_ENV == 'prod':
        print("⚠️  PRODUCTION MODE: Extra safety checks enabled")
        if not args.readonly_only:
            print("💡 Consider using --readonly-only for production testing")
    
    print("-" * 50)
    
    # Build pytest command
    cmd = ['python', '-m', 'pytest']
    
    # Add test selection
    if args.readonly_only:
        cmd.extend(['-m', 'readonly'])
    elif args.mutating_only:
        cmd.extend(['-m', 'mutating'])
    
    # Add verbosity
    if args.verbose:
        cmd.append('-v')
    else:
        cmd.append('-q')
    
    # Add parallel execution
    if args.parallel > 1:
        cmd.extend(['-n', str(args.parallel)])
    
    # Add coverage
    if args.coverage:
        cmd.extend(['--cov=framework', '--cov-report=html', '--cov-report=term'])
    
    # Add test directory
    cmd.append('tests/')
    
    # Run tests
    try:
        result = subprocess.run(cmd, cwd=Path(__file__).parent.parent)
        return result.returncode
    except KeyboardInterrupt:
        print("\n❌ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
