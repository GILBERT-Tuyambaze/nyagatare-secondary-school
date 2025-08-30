import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Phone, GraduationCap, Clock } from 'lucide-react'
import { getBoardMembers } from '@/services/supabaseService'
import { BoardMember } from '@/types/database'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const BoardMembers: React.FC = () => {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBoardMembers = async () => {
      try {
        const members = await getBoardMembers()
        setBoardMembers(members)
      } catch (error) {
        console.error('Error fetching board members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBoardMembers()
  }, [])

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

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'teacher':
        return 'Teaching Staff'
      case 'leader':
        return 'School Leadership'
      case 'parent':
        return 'Parent Board'
      default:
        return 'Board Members'
    }
  }

  const groupedMembers = boardMembers.reduce((acc, member) => {
    if (!acc[member.category]) {
      acc[member.category] = []
    }
    acc[member.category].push(member)
    return acc
  }, {} as Record<string, BoardMember[]>)

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 pt-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading board members...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 pt-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Board Members
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the dedicated individuals who guide our school's mission and ensure the highest standards of education for our students.
            </p>
          </div>

          {/* Board Members by Category */}
          {Object.entries(groupedMembers).map(([category, members]) => (
            <div key={category} className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {getCategoryTitle(category)}
                </h2>
                <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <Card key={member.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <Avatar className="w-24 h-24">
                          <AvatarImage 
                            src={member.profile_image || ''} 
                            alt={member.full_name}
                          />
                          <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                            {member.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="text-xl">{member.full_name}</CardTitle>
                      <CardDescription className="text-base font-medium text-blue-600">
                        {member.position}
                      </CardDescription>
                      <Badge className={`w-fit mx-auto ${getCategoryColor(member.category)}`}>
                        {member.category.charAt(0).toUpperCase() + member.category.slice(1)}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {member.bio && (
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {member.bio}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {member.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-blue-500" />
                            <a 
                              href={`mailto:${member.email}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {member.email}
                            </a>
                          </div>
                        )}

                        {member.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-green-500" />
                            <a 
                              href={`tel:${member.phone}`}
                              className="hover:text-green-600 transition-colors"
                            >
                              {member.phone}
                            </a>
                          </div>
                        )}

                        {member.qualifications && (
                          <div className="flex items-start text-sm text-gray-600">
                            <GraduationCap className="w-4 h-4 mr-2 text-purple-500 mt-0.5" />
                            <span>{member.qualifications}</span>
                          </div>
                        )}

                        {member.experience_years && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2 text-orange-500" />
                            <span>{member.experience_years} years of experience</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default BoardMembers