from pydantic import BaseModel


class UserLoginRequest(BaseModel):
    email: str | None = None
    password: str | None = None

class UserLoginResponse(BaseModel):
    email: str
    user_id: int
    role: str 
