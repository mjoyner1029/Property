import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_connect_account(user_id, email):
    account = stripe.Account.create(
        type="express",  # Use "express" for SaaS landlord onboarding
        country="US",
        email=email,
        capabilities={"transfers": {"requested": True}},
        business_type="individual",
        metadata={"user_id": user_id}
    )
    return account

def create_account_link(account_id):
    return stripe.AccountLink.create(
        account=account_id,
        refresh_url=os.getenv("STRIPE_REFRESH_URL", "http://localhost:3000/retry"),
        return_url=os.getenv("STRIPE_RETURN_URL", "http://localhost:3000/dashboard"),
        type="account_onboarding"
    )
