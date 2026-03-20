import { RoleForm } from '../components/RoleForm'
import { roleDefinitions } from '../lib/rbac'

export default function RolesPage() {
  return <RoleForm roles={roleDefinitions} />
}
