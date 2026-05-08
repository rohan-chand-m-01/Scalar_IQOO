from fastapi import APIRouter

from services.knowledge.obligation_graph.graph_builder import ObligationGraphBuilder


router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/graph")
async def get_obligation_graph():
    builder = ObligationGraphBuilder()
    builder.build_graph()
    return builder.to_json()

