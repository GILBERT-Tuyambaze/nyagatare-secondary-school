import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Phone, GraduationCap, Clock } from 'lucide-react'
import { getBoardMembers } from '@/services/firestoreService'
import { BoardMember } from '@/types/database'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Seo from '@/components/Seo'

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
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)] pb-20 pt-32">
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
      <Seo
        title="Governance and Board Members | Nyagatare Secondary School"
        description="Meet the leadership, teaching representatives, and parent board members who support governance at Nyagatare Secondary School."
        path="/board-members"
        keywords={[
          'Nyagatare Secondary School board members',
          'Nyagatare school leadership',
          'school governance Rwanda',
          'secondary school board Rwanda',
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'Nyagatare Secondary School Governance and Board Members',
          url: 'https://www.nyagataress.edu.rw/board-members',
          about: {
            '@type': 'School',
            name: 'Nyagatare Secondary School',
          },
        }}
      />
      <Header />
      <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fffdf7_100%)] pb-20 pt-32">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-12 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-10 text-center shadow-sm sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Governance</p>
            <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
              Our Board Members
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600 md:text-xl">
              Meet the dedicated individuals who guide our school's mission and ensure the highest standards of education for our students.
            </p>
          </div>

          {/* Board Members by Category */}
          {Object.entries(groupedMembers).map(([category, members]) => (
            <div key={category} className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  {getCategoryTitle(category)}
                </h2>
                <div className="mx-auto h-1 w-24 bg-amber-600"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <Card key={member.id} className="border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <Avatar className="w-24 h-24">
                          <AvatarImage 
                            src={member.profile_image || ''} 
                            alt={member.full_name}
                          />
                          <AvatarFallback className="bg-amber-100 text-lg font-semibold text-amber-700">
                            {member.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="text-xl">{member.full_name}</CardTitle>
                      <CardDescription className="text-base font-medium text-amber-700">
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
      </main>
      <Footer />
    </>
  )
}

export default BoardMembers
