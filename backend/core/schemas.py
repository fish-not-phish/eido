from ninja import Schema
from typing import Optional, Dict, Any
from uuid import UUID

class RegisterIn(Schema):
    email: str
    password: str

class LoginIn(Schema):
    email: str
    password: str 

class FileCreateIn(Schema):
    name: str

class FileUpdateIn(Schema):
    name: Optional[str] = None
    whiteboard_state: Optional[Dict[str, Any]] = None
    code_content: Optional[str] = None

class UserUpdateIn(Schema):
    email: Optional[str] = None
    password: Optional[str] = None

class UserSchema(Schema):
    id: int
    username: str
    email: str
    
class DSLIn(Schema):
    code: str

class ExcalidrawOut(Schema):
    elements: dict
    files: dict
    appState: dict

class WorkspaceIn(Schema):
    name: str

class WorkspaceOut(Schema):
    id: UUID
    name: str
    owner_id: int

class MembershipOut(Schema):
    id: UUID
    user_id: int
    email: str
    workspace_id: UUID
    role: str
    can_read: bool
    can_write: bool
    can_delete: bool

class MembershipUpdateIn(Schema):
    role: Optional[str] = None
    can_read: Optional[bool] = None
    can_write: Optional[bool] = None
    can_delete: Optional[bool] = None

class InviteIn(Schema):
    email: str
    role: str  
    can_read: Optional[bool] = True
    can_write: Optional[bool] = True
    can_delete: Optional[bool] = False

class SuperuserOut(Schema):
    id: int
    username: str
    email: str
    is_superuser: bool
    is_staff: bool

class RegistrationToggleOut(Schema):
    allow_registration: bool