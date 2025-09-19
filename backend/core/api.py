from ninja import NinjaAPI
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from ninja.orm import create_schema
from files.models import File
from workspaces.models import Workspace, Membership
from .schemas import LoginIn, RegisterIn, FileCreateIn, FileUpdateIn, UserUpdateIn, UserSchema, WorkspaceIn, WorkspaceOut, MembershipOut, MembershipUpdateIn, InviteIn, SuperuserOut, RegistrationToggleOut
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken
from ninja.errors import HttpError
from ninja_extra import NinjaExtraAPI
from ninja_jwt.controller import NinjaJWTDefaultController
from files.parser import parse_dsl, generate_excalidraw
from .permissions import require_workspace_membership, require_admin_or_owner, assert_can_modify_target
from django.db.models import Q
from uuid import UUID
from accounts.models import SiteSetting

api = NinjaExtraAPI(docs_url=None)
api.register_controllers(NinjaJWTDefaultController)


FileSchema = create_schema(File, exclude=["user"])

# ------------------------
# Auth
# ------------------------
@api.post("/register")
def register(request, payload: RegisterIn):
    settings = SiteSetting.get_settings()
    if not settings.allow_registration:
        raise HttpError(403, "Registration is currently disabled")
    email = payload.email
    password = payload.password
    if User.objects.filter(username=email).exists():
        return {"error": "User already exists"}
    
    is_first_user = not User.objects.exists()

    user = User.objects.create(
        username=email,
        email=email,
        password=make_password(password),
        is_superuser=is_first_user,
        is_staff=is_first_user,
    )

    ws = Workspace.objects.create(name=f"Default", owner=user)
    Membership.objects.create(
        user=user, workspace=ws, role=Membership.ROLE_OWNER,
        can_read=True, can_write=True, can_delete=True
    )
    return {"success": True, "id": user.id}

# ------------------------
# Workspaces
# ------------------------
@api.get("/workspaces", response=list[WorkspaceOut], auth=JWTAuth())
def list_workspaces(request):
    qs = Workspace.objects.filter(memberships__user=request.user).distinct()
    return [{"id": w.id, "name": w.name, "owner_id": w.owner_id} for w in qs]

@api.post("/workspaces", response=WorkspaceOut, auth=JWTAuth())
def create_workspace(request, payload: WorkspaceIn):
    ws = Workspace.objects.create(name=payload.name.strip(), owner=request.user)
    Membership.objects.create(
        user=request.user, workspace=ws, role=Membership.ROLE_OWNER,
        can_read=True, can_write=True, can_delete=True
    )
    return {"id": ws.id, "name": ws.name, "owner_id": ws.owner_id}

@api.get("/workspaces/{workspace_id}/members", response=list[MembershipOut], auth=JWTAuth())
def list_members(request, workspace_id: UUID):
    m = require_workspace_membership(request.user, workspace_id)
    members = Membership.objects.filter(workspace_id=workspace_id).select_related("user")
    return [
        {
            "id": mem.id,
            "user_id": mem.user_id,
            "email": mem.user.email,
            "workspace_id": mem.workspace_id,
            "role": mem.role,
            "can_read": mem.can_read,
            "can_write": mem.can_write,
            "can_delete": mem.can_delete,
        }
        for mem in members
    ]

@api.post("/workspaces/{workspace_id}/invite", response=MembershipOut, auth=JWTAuth())
def invite_member(request, workspace_id: UUID, payload: InviteIn):
    actor = require_workspace_membership(request.user, workspace_id)
    require_admin_or_owner(actor)

    if payload.role not in [Membership.ROLE_ADMIN, Membership.ROLE_MEMBER]:
        raise HttpError(400, "Invalid role (owner not allowed)")

    try:
        user = User.objects.get(email=payload.email)
    except User.DoesNotExist:
        raise HttpError(404, "User must already exist to be invited")

    mem, created = Membership.objects.get_or_create(
        user=user,
        workspace_id=workspace_id,
        defaults={
            "role": payload.role,
            "can_read": bool(payload.can_read),
            "can_write": bool(payload.can_write),
            "can_delete": bool(payload.can_delete),
        },
    )

    if not created:
        if mem.is_owner:
            raise HttpError(403, "Cannot modify the Owner")
        mem.role = payload.role
        mem.can_read = bool(payload.can_read)
        mem.can_write = bool(payload.can_write)
        mem.can_delete = bool(payload.can_delete)
        mem.save()

    return {
        "id": mem.id,
        "user_id": mem.user_id,
        "workspace_id": mem.workspace_id,
        "role": mem.role,
        "can_read": mem.can_read,
        "can_write": mem.can_write,
        "can_delete": mem.can_delete,
        "email": mem.user.email,
    }

@api.put("/workspaces/{workspace_id}/members/{member_id}", response=MembershipOut, auth=JWTAuth())
def update_member(request, workspace_id: UUID, member_id: UUID, payload: MembershipUpdateIn):
    actor = require_workspace_membership(request.user, workspace_id)
    require_admin_or_owner(actor)

    target = get_object_or_404(Membership, id=member_id, workspace_id=workspace_id)
    assert_can_modify_target(actor, target)

    if payload.role is not None:
        if payload.role not in [Membership.ROLE_ADMIN, Membership.ROLE_MEMBER]:
            raise HttpError(400, "Invalid role (owner not allowed)")
        target.role = payload.role

    for field in ("can_read", "can_write", "can_delete"):
        val = getattr(payload, field)
        if val is not None:
            setattr(target, field, bool(val))

    target.save()
    return {
        "id": target.id,
        "user_id": target.user_id,
        "workspace_id": target.workspace_id,
        "role": target.role,
        "can_read": target.can_read,
        "can_write": target.can_write,
        "can_delete": target.can_delete,
        "email": target.user.email,
    }

@api.delete("/workspaces/{workspace_id}/members/{member_id}", auth=JWTAuth())
def remove_member(request, workspace_id: UUID, member_id: UUID):
    actor = require_workspace_membership(request.user, workspace_id)
    require_admin_or_owner(actor)

    target = get_object_or_404(Membership, id=member_id, workspace_id=workspace_id)
    assert_can_modify_target(actor, target)

    target.delete()
    return {"success": True}

@api.delete("/workspaces/{workspace_id}", auth=JWTAuth())
def delete_workspace(request, workspace_id: UUID):
    mem = require_workspace_membership(request.user, workspace_id)
    require_admin_or_owner(mem)

    ws = get_object_or_404(Workspace, id=workspace_id)

    if mem.role != Membership.ROLE_OWNER:
        raise HttpError(403, "Only the workspace owner can delete the workspace")

    File.objects.filter(workspace_id=workspace_id).delete()

    Membership.objects.filter(workspace_id=workspace_id).delete()

    ws.delete()

    return {"success": True}

# ------------------------
# Users
# ------------------------
@api.get("/users", auth=JWTAuth())
def list_users(request, q: str = None, workspace_id: UUID = None):
    qs = User.objects.all()

    if q:
        qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))

    if workspace_id:
        member_ids = Membership.objects.filter(workspace_id=workspace_id).values_list("user_id", flat=True)
        qs = qs.exclude(id__in=member_ids)

    return [
        {"id": u.id, "username": u.username, "email": u.email}
        for u in qs
    ]

@api.get("/superusers", response=list[SuperuserOut], auth=JWTAuth())
def list_superusers(request):
    if not request.user.is_superuser:
        raise HttpError(403, "Superuser required")
    qs = User.objects.filter(is_active=True, is_superuser=True)
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_superuser": u.is_superuser,
            "is_staff": u.is_staff,
        }
        for u in qs
    ]

@api.get("/users/search_for_superuser", response=list[SuperuserOut], auth=JWTAuth())
def search_users_for_superuser(request, q: str = None):
    if not request.user.is_superuser:
        raise HttpError(403, "Superuser required")

    qs = User.objects.filter(is_active=True, is_superuser=False).exclude(id=request.user.id)

    if q:
        qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))

    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_superuser": u.is_superuser,
            "is_staff": u.is_staff,
        }
        for u in qs
    ]

@api.put("/superusers/{user_id}", response=SuperuserOut, auth=JWTAuth())
def set_superuser(request, user_id: int, is_superuser: bool):
    if not request.user.is_superuser:
        raise HttpError(403, "Superuser required")

    target = get_object_or_404(User, id=user_id, is_active=True)

    if target.id == request.user.id and not is_superuser:
        raise HttpError(400, "Cannot demote yourself")

    first_user_id = User.objects.order_by("id").values_list("id", flat=True).first()
    if target.id == first_user_id and not is_superuser:
        raise HttpError(400, "Cannot demote the first user")

    target.is_superuser = is_superuser
    target.is_staff = is_superuser
    target.save()

    return {
        "id": target.id,
        "username": target.username,
        "email": target.email,
        "is_superuser": target.is_superuser,
        "is_staff": target.is_staff,
    }

# ------------------------
# Files
# ------------------------
@api.post("/workspaces/{workspace_id}/files", response=FileSchema, auth=JWTAuth())
def create_file(request, workspace_id: UUID, payload: FileCreateIn):
    mem = require_workspace_membership(request.user, workspace_id)
    if not mem.can_write:
        raise HttpError(403, "Write permission required")
    file = File.objects.create(
        user=request.user,
        workspace_id=workspace_id,
        name=payload.name.strip(),
    )
    return file

@api.get("/workspaces/{workspace_id}/files", response=list[FileSchema], auth=JWTAuth())
def list_files(request, workspace_id: UUID):
    mem = require_workspace_membership(request.user, workspace_id)
    if not mem.can_read:
        raise HttpError(403, "Read permission required")
    return File.objects.filter(workspace_id=workspace_id).order_by("-updated_at")

@api.put("/workspaces/{workspace_id}/files/{file_id}", response=FileSchema, auth=JWTAuth())
def update_file(request, workspace_id: UUID, file_id: UUID, payload: FileUpdateIn):
    mem = require_workspace_membership(request.user, workspace_id)
    if not mem.can_write:
        raise HttpError(403, "Write permission required")

    file = get_object_or_404(File, id=file_id, workspace_id=workspace_id)

    if payload.name is not None:
        file.name = payload.name.strip()

    if payload.code_content is not None:
        file.code_content = payload.code_content
        parsed = parse_dsl(payload.code_content)
        excalidraw_json = generate_excalidraw(parsed["nodes"], parsed["connections"])
        file.whiteboard_state = excalidraw_json
    elif payload.whiteboard_state is not None:
        file.whiteboard_state = payload.whiteboard_state

    file.save()
    return file

@api.get("/workspaces/{workspace_id}/files/{file_id}", response=FileSchema, auth=JWTAuth())
def get_file(request, workspace_id: UUID, file_id: UUID):
    mem = require_workspace_membership(request.user, workspace_id)
    if not mem.can_read:
        raise HttpError(403, "Read permission required")
    file = get_object_or_404(File, id=file_id, workspace_id=workspace_id)
    return file

@api.delete("/workspaces/{workspace_id}/files/{file_id}", auth=JWTAuth())
def delete_file(request, workspace_id: UUID, file_id: UUID):
    mem = require_workspace_membership(request.user, workspace_id)
    if not mem.can_delete:
        raise HttpError(403, "Delete permission required")

    file = get_object_or_404(File, id=file_id, workspace_id=workspace_id)
    file.delete()
    return {"success": True}

# ------------------------
# User endpoints
# ------------------------
@api.get("/me", response=UserSchema, auth=JWTAuth())
def get_me(request):
    return request.user

@api.put("/me", auth=JWTAuth())
def update_me(request, payload: UserUpdateIn):
    user = request.user
    if payload.email:
        user.email = payload.email
        user.username = payload.email
    if payload.password:
        user.set_password(payload.password)
    user.save()
    return {
        "success": True,
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }

@api.get("/me", auth=JWTAuth())
def get_me(request):
    return {
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
    }

@api.get("/settings/registration", response=RegistrationToggleOut, auth=JWTAuth())
def get_registration_setting(request):
    if not request.user.is_superuser:
        raise HttpError(403, "Superuser required")
    settings = SiteSetting.get_settings()
    return {"allow_registration": settings.allow_registration}

@api.put("/settings/registration", response=RegistrationToggleOut, auth=JWTAuth())
def set_registration_setting(request, allow_registration: bool):
    if not request.user.is_superuser:
        raise HttpError(403, "Superuser required")
    settings = SiteSetting.get_settings()
    settings.allow_registration = allow_registration
    settings.save()
    return {"allow_registration": settings.allow_registration}