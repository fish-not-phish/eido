from ninja.errors import HttpError
from workspaces.models import Membership, Workspace

def require_workspace_membership(user, workspace_id) -> Membership:
    try:
        return Membership.objects.get(user=user, workspace_id=workspace_id)
    except Membership.DoesNotExist:
        raise HttpError(403, "Not a member of this workspace")

def require_admin_or_owner(actor_membership: Membership):
    if not (actor_membership.is_owner or actor_membership.is_admin):
        raise HttpError(403, "Admin or Owner required")

def assert_can_modify_target(actor: Membership, target: Membership):
    if target.is_owner:
        raise HttpError(403, "Cannot modify the Owner")
    if target.user_id == actor.user_id:
        raise HttpError(403, "Cannot modify your own role or permissions")
