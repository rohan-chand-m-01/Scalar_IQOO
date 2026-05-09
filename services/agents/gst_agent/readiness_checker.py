from services.api.database import Business, Obligation
from sqlalchemy import and_, select


class GSTReadinessChecker:
    async def compute_readiness_score(self, business_id: str, period: str, db_session, portal_data: dict) -> float:
        business = await db_session.get(Business, business_id)
        obligations = (
            await db_session.scalars(
                select(Obligation).where(and_(Obligation.business_id == business_id, Obligation.domain == "GST"))
            )
        ).all()
        
        if not obligations:
            return 100.0 if business and business.gst_registered else 0.0

        total_obs = len(obligations)
        compliant_obs = sum(1 for o in obligations if o.status == "compliant")
        
        score = (compliant_obs / total_obs) * 100.0
        return float(min(100.0, score))

    async def get_filing_checklist(self, business_id: str, period: str, db_session) -> list[dict]:
        obligations = (
            await db_session.scalars(
                select(Obligation).where(and_(Obligation.business_id == business_id, Obligation.domain == "GST"))
            )
        ).all()
        return [
            {
                "item": o.title,
                "status": o.status,
                "instructions": f"Complete '{o.title}' before {o.due_date}" if o.due_date else "Complete as per GST schedule",
            }
            for o in obligations
        ]
