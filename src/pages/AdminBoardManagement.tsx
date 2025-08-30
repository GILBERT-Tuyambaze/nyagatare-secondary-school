import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react'
import { getBoardMembers, deleteBoardMember } from '@/services/supabaseService'
import { BoardMember } from '@/types/database'
import { BoardMemberForm } from '@/components/BoardMemberForm'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const AdminBoardManagement: React.FC = () => {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([])
  const [filteredMembers, setFilteredMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null)
  const [error, setError] = useState('')
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchBoardMembers()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [boardMembers, searchTerm, categoryFilter])

  const fetchBoardMembers = async () => {
    try {
      const members = await getBoardMembers()
      setBoardMembers(members)
    } catch (error) {
      setError('Failed to fetch board members')
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = boardMembers

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(member => member.category === categoryFilter)
    }

    setFilteredMembers(filtered)
  }

  const handleEdit = (member: BoardMember) => {
    setSelectedMember(member)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setSelectedMember(null)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this board member?')) {
      try {
        await deleteBoardMember(id)
        await fetchBoardMembers()
      } catch (error) {
        setError('Failed to delete board member')
      }
    }
  }

  const handleFormSuccess = () => {
    fetchBoardMembers()
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800'
      case 'leader':
        return 'bg-purple-100 text-purple-800'
      case 'parent':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isAdmin) {
    return (
      <><Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
        <Footer />
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading board members...</p>
        </div>
      </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Board Members Management</h1>
          <p className="text-gray-600">Manage school board members, teachers, leaders, and parent representatives.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{boardMembers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {boardMembers.filter(m => m.category === 'teacher').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">T</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leaders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {boardMembers.filter(m => m.category === 'leader').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">L</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {boardMembers.filter(m => m.category === 'parent').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">P</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="leader">Leaders</SelectItem>
                    <SelectItem value="parent">Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Board Members ({filteredMembers.length})</CardTitle>
            <CardDescription>
              Manage all board members including teachers, school leaders, and parent representatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.full_name}</div>
                        {member.qualifications && (
                          <div className="text-sm text-gray-500">{member.qualifications}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{member.position}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(member.category)}>
                        {member.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.experience_years ? `${member.experience_years} years` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {member.email && <div>{member.email}</div>}
                        {member.phone && <div className="text-gray-500">{member.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Board Member Form Modal */}
        <BoardMemberForm
          open={formOpen}
          onOpenChange={setFormOpen}
          member={selectedMember}
          onSuccess={handleFormSuccess}
        />
      </div>
    </div>
        <Footer />
        </>
  )
}

export default AdminBoardManagement
