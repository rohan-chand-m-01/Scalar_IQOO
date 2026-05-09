import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, Business
from models import ChatMessage, ChatResponse
from services.knowledge.rag.gemini_client import GeminiComplianceClient, SYSTEM_PROMPT
from services.knowledge.rag.retriever import retrieve_relevant_regulations, build_context_prompt

router = APIRouter(prefix="/assistant", tags=["assistant"])

@router.post("/chat", response_model=ChatResponse)
async def rag_chat(payload: ChatMessage, db: AsyncSession = Depends(get_db)):
    # 1. Load Business Context
    business = await db.scalar(select(Business).where(Business.id == payload.business_id))
    business_profile = business.__dict__ if business else {}

    # 2. Retrieve Relevant Regulations via Chroma RAG (Run in thread to avoid blocking)
    retrieved_docs = await asyncio.to_thread(
        retrieve_relevant_regulations,
        payload.message, 
        business_profile, 
        5
    )
    
    # 3. Build Context Prompt
    context = build_context_prompt(payload.message, retrieved_docs, business_profile)

    # 4. Generate Gemini Response (Run in thread to avoid blocking)
    client = GeminiComplianceClient()
    llm_result = await asyncio.to_thread(
        client.generate_compliance_response,
        SYSTEM_PROMPT, 
        payload.message, 
        context
    )
    
    # 5. Determine sources and confidence heuristically for demo
    sources = list(set([doc.get("metadata", {}).get("domain", "general") for doc in retrieved_docs]))
    if not sources:
        sources = ["general_knowledge"]
        
    text = payload.message.lower()
    confidence = 0.92
    hitl_escalated = False
    rail_agreement = True

    if "uncertain" in text or "override" in text:
        confidence = 0.54
        hitl_escalated = True
        rail_agreement = False
        sources.append("hitl_queue")

    return ChatResponse(
        response=llm_result["response"],
        confidence_score=confidence,
        sources=sources,
        rail_agreement=rail_agreement,
        hitl_escalated=hitl_escalated,
    )
