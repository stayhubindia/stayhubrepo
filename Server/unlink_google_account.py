#!/usr/bin/env python
"""
Script to unlink a Google account from a user by clearing their firebase_uid.
Usage: python unlink_google_account.py <email>
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.users.models import User

def unlink_google_account(email: str):
    """Unlink Google account by clearing firebase_uid"""
    try:
        user = User.objects.get(email=email)
        old_uid = user.firebase_uid
        user.firebase_uid = None
        user.save(update_fields=['firebase_uid'])
        print(f"✓ Successfully unlinked Google account from {email}")
        print(f"  Old Firebase UID: {old_uid}")
        print(f"  User can now link a different Google account")
    except User.DoesNotExist:
        print(f"✗ No user found with email: {email}")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python unlink_google_account.py <email>")
        sys.exit(1)
    
    email = sys.argv[1]
    unlink_google_account(email)
