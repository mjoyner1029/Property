# backend/src/utils/validation.py

import re

def is_valid_email(email):
    return re.match(r"^[^@]+@[^@]+\.[^@]+$", email) is not None

def is_strong_password(password):
    return (
        len(password) >= 8 and
        re.search(r"[A-Z]", password) and
        re.search(r"[a-z]", password) and
        re.search(r"[0-9]", password)
    )
