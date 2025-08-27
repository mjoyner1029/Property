"""
Account security utilities to prevent brute force attacks.
Implements account lockout after multiple failed login attempts.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, Set, Any, Optional
from flask import current_app, request
from ..extensions import db
from ..models.user import User
from .tracing import log_with_context

# Cache to track failed login attempts
# Structure: {email: {'attempts': int, 'last_attempt': datetime, 'ip_addresses': set}}
failed_attempts: Dict[str, Dict[str, Any]] = {}


def track_failed_login(email: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
    """
    Track failed login attempt for an email address.
    
    Args:
        email: The email address that failed login
        ip_address: Optional IP address to track
        
    Returns:
        dict: Status information about the account
    """
    if not email:
        return {'locked': False, 'attempts': 0}
        
    # Get settings from app config
    max_attempts = current_app.config.get('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', 5)
    lockout_minutes = current_app.config.get('ACCOUNT_LOCKOUT_DURATION_MINUTES', 30)
    attempt_window = current_app.config.get('ACCOUNT_LOCKOUT_WINDOW_MINUTES', 15)
    
    now = datetime.utcnow()
    attempt_window_delta = timedelta(minutes=attempt_window)
    
    # Initialize if not exists
    if email not in failed_attempts:
        failed_attempts[email] = {'attempts': 1, 'last_attempt': now, 'ip_addresses': set()}
        if ip_address:
            failed_attempts[email]['ip_addresses'].add(ip_address)
        
        log_with_context(
            f"First failed login attempt for {email}",
            level='info',
            email=email,
            ip_address=ip_address,
            attempts=1
        )
        return {'locked': False, 'attempts': 1}
    
    # Reset attempts if outside the window
    if now - failed_attempts[email]['last_attempt'] > attempt_window_delta:
        prev_attempts = failed_attempts[email]['attempts']
        failed_attempts[email] = {'attempts': 1, 'last_attempt': now, 'ip_addresses': set()}
        if ip_address:
            failed_attempts[email]['ip_addresses'].add(ip_address)
        
        log_with_context(
            f"Failed login attempt for {email} - window reset",
            level='info',
            email=email,
            ip_address=ip_address,
            attempts=1,
            prev_attempts=prev_attempts
        )
        return {'locked': False, 'attempts': 1}
    
    # Increment attempts
    failed_attempts[email]['attempts'] += 1
    failed_attempts[email]['last_attempt'] = now
    if ip_address:
        failed_attempts[email]['ip_addresses'].add(ip_address)
    
    # Get current IP addresses
    ip_addresses = list(failed_attempts[email]['ip_addresses']) if 'ip_addresses' in failed_attempts[email] else []
    current_attempts = failed_attempts[email]['attempts']
    
    # Check if account should be locked
    if current_attempts >= max_attempts:
        # Update the user record to locked state
        try:
            user = User.query.filter_by(email=email).first()
            if user:
                lockout_until = now + timedelta(minutes=lockout_minutes)
                user.locked_until = lockout_until
                user.failed_login_attempts = current_attempts
                user.last_failed_login = now
                db.session.commit()
                
                log_with_context(
                    f"Account locked: {email} after {current_attempts} failed attempts",
                    level='warning',
                    email=email,
                    ip_addresses=ip_addresses,
                    attempts=current_attempts,
                    lockout_minutes=lockout_minutes,
                    unlock_time=lockout_until.isoformat()
                )
        except Exception as e:
            log_with_context(
                f"Failed to update user lock status: {str(e)}",
                level='error',
                email=email,
                error=str(e)
            )
                
        # Return locked status
        lockout_time = now + timedelta(minutes=lockout_minutes)
        return {
            'locked': True, 
            'attempts': current_attempts,
            'unlock_time': lockout_time
        }
    
    # Log the failed attempt
    log_with_context(
        f"Failed login attempt {current_attempts}/{max_attempts} for {email}",
        level='info',
        email=email,
        ip_address=ip_address,
        attempts=current_attempts,
        max_attempts=max_attempts
    )
    
    return {
        'locked': False, 
        'attempts': current_attempts
    }


def check_account_lockout(email: str) -> Dict[str, Any]:
    """
    Check if an account is currently locked out.
    
    Args:
        email: The email to check
        
    Returns:
        dict: Status with locked flag and unlock time if applicable
    """
    if not email:
        return {'locked': False}
        
    # Check persistent storage first
    try:
        user = User.query.filter_by(email=email).first()
        if user and user.locked_until and user.locked_until > datetime.utcnow():
            remaining_seconds = (user.locked_until - datetime.utcnow()).total_seconds()
            log_with_context(
                f"Account still locked: {email}",
                level='info',
                email=email,
                unlock_time=user.locked_until.isoformat(),
                remaining_seconds=int(remaining_seconds)
            )
            return {
                'locked': True,
                'unlock_time': user.locked_until
            }
    except Exception as e:
        log_with_context(
            f"Failed to check user lock status: {str(e)}",
            level='error',
            email=email,
            error=str(e)
        )
    
    # Then check in-memory cache
    max_attempts = current_app.config.get('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', 5)
    
    if (email in failed_attempts and 
        failed_attempts[email]['attempts'] >= max_attempts):
        # Get lockout duration
        lockout_minutes = current_app.config.get('ACCOUNT_LOCKOUT_DURATION_MINUTES', 30)
        # Check if still in lockout period
        lockout_time = failed_attempts[email]['last_attempt'] + timedelta(minutes=lockout_minutes)
        if datetime.utcnow() < lockout_time:
            remaining_seconds = (lockout_time - datetime.utcnow()).total_seconds()
            log_with_context(
                f"Account locked in memory cache: {email}",
                level='info',
                email=email,
                unlock_time=lockout_time.isoformat(),
                remaining_seconds=int(remaining_seconds),
                attempts=failed_attempts[email]['attempts']
            )
            return {
                'locked': True,
                'unlock_time': lockout_time
            }
        else:
            # Reset if lockout period has passed
            failed_attempts[email] = {'attempts': 0, 'last_attempt': datetime.utcnow()}
            log_with_context(
                f"Lockout period expired for {email}, resetting attempts",
                level='info',
                email=email
            )
            
    return {'locked': False}


def reset_login_attempts(email: str) -> None:
    """
    Reset failed login attempts for an email after successful login.
    
    Args:
        email: The email address to reset
    """
    if not email:
        return
        
    if email in failed_attempts:
        prev_attempts = failed_attempts[email]['attempts']
        del failed_attempts[email]
        log_with_context(
            f"Reset login attempts for {email} after successful login",
            level='info',
            email=email,
            prev_attempts=prev_attempts
        )
        
    # Also clear any persistent lockout
    try:
        user = User.query.filter_by(email=email).first()
        if user:
            if user.locked_until or user.failed_login_attempts:
                user.locked_until = None
                user.failed_login_attempts = 0
                db.session.commit()
                log_with_context(
                    f"Cleared account lockout for {email} after successful login",
                    level='info',
                    email=email
                )
    except Exception as e:
        log_with_context(
            f"Failed to reset user lock status: {str(e)}",
            level='error',
            email=email,
            error=str(e)
        )
