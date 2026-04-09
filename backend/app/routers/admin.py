from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.models.game import Game
from app.models.prediction import Prediction
from app.services.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard")
async def admin_dashboard(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users_count = (await db.execute(select(func.count(User.id)))).scalar()
    active_subs = (await db.execute(
        select(func.count(User.id)).where(User.subscription_status == "active")
    )).scalar()
    total_games = (await db.execute(select(func.count(Game.id)))).scalar()
    total_predictions = (await db.execute(select(func.count(Prediction.id)))).scalar()

    return {
        "total_users": users_count,
        "active_subscriptions": active_subs,
        "total_games": total_games,
        "total_predictions": total_predictions,
    }


@router.get("/users")
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(100))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "subscription_status": u.subscription_status,
            "is_admin": u.is_admin,
            "created_at": str(u.created_at),
        }
        for u in users
    ]
