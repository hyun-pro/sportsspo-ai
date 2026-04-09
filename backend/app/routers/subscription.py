from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.config import get_settings
import stripe

router = APIRouter(prefix="/api/subscription", tags=["subscription"])
settings = get_settings()


@router.post("/create-checkout")
async def create_checkout_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    stripe.api_key = settings.stripe_secret_key

    if not user.stripe_customer_id:
        customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = customer.id
        await db.flush()

    session = stripe.checkout.Session.create(
        customer=user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        mode="subscription",
        success_url="http://localhost:5173/subscription?success=true",
        cancel_url="http://localhost:5173/subscription?cancelled=true",
        metadata={"user_id": str(user.id)},
    )
    return {"checkout_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.subscription_status = "active"
            user.stripe_subscription_id = session.get("subscription")

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        from sqlalchemy import select
        result = await db.execute(
            select(User).where(User.stripe_subscription_id == subscription["id"])
        )
        user = result.scalar_one_or_none()
        if user:
            user.subscription_status = "cancelled"

    return {"status": "ok"}


@router.post("/cancel")
async def cancel_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.stripe_secret_key or not user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    stripe.api_key = settings.stripe_secret_key
    stripe.Subscription.modify(user.stripe_subscription_id, cancel_at_period_end=True)
    user.subscription_status = "cancelled"
    return {"status": "subscription will be cancelled at period end"}


@router.get("/status")
async def subscription_status(user: User = Depends(get_current_user)):
    return {
        "subscription_status": user.subscription_status,
        "is_premium": user.subscription_status == "active" or user.is_admin,
    }
