import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_connect_account(user_id):
    account = stripe.Account.create(
        type="standard",  # Or "express" if you want faster onboarding
        country="US",
        capabilities={"transfers": {"requested": True}},
        business_type="individual",
        metadata={"user_id": user_id}
    )
    return account

def create_account_link(account_id):
    return stripe.AccountLink.create(
        account=account_id,
        refresh_url="http://localhost:3000/retry",  # Adjust for prod
        return_url="http://localhost:3000/dashboard",
        type="account_onboarding"
    )
