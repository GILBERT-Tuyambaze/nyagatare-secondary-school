import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SystemUser } from '../types'

export function UserTable({ users }: { users: SystemUser[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400">Name</TableHead>
          <TableHead className="text-slate-400">Role</TableHead>
          <TableHead className="text-slate-400">Department</TableHead>
          <TableHead className="text-slate-400">Permissions</TableHead>
          <TableHead className="text-slate-400">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="border-slate-800">
            <TableCell>
              <div>
                <p className="font-medium text-white">{user.fullName}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </TableCell>
            <TableCell className="text-slate-200">{user.role}</TableCell>
            <TableCell className="text-slate-300">{user.department}</TableCell>
            <TableCell className="text-slate-300">{user.permissions.length}</TableCell>
            <TableCell>
              <Badge className="bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/10">{user.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
