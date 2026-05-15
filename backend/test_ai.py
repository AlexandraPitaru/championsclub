import logging
logging.basicConfig(level=logging.INFO)
from app.database import engine
from sqlmodel import Session
from app.models.app_user import AppUser
from app.AI.manager_ai.analysis_service import generate_manager_ai_analysis_with_ai, build_manager_ai_analysis_context
import traceback
with Session(engine) as s:
    user = s.get(AppUser, 1)
    payload = build_manager_ai_analysis_context(s, user)
try:
    r = generate_manager_ai_analysis_with_ai(payload)
    print('SUCCESS', r.model_version, r.is_fallback)
except Exception as e:
    print('FAILED:', type(e).__name__, str(e)[:1000])
    traceback.print_exc()
