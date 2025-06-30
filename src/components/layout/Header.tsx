
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, User, LogOut, BookOpen, TrendingUp, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePermissions } from '@/hooks/usePermissions';

const Header = () => {
  const { user, signOut, userRole } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const isInstructor = userRole === 'instructor' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="edx-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => navigate('/')}
          >
            <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LearnHub</h1>
              <p className="text-xs text-gray-500 -mt-1">Learn. Grow. Achieve.</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/courses')}
              className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Explore Courses
            </Button>
            
            {(hasPermission('view_all_analytics') || hasPermission('view_student_progress')) && (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/analytics')}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            )}
            
            {isInstructor && (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/instructor/dashboard')}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium"
              >
                Teach
              </Button>
            )}

            {isAdmin && (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium"
              >
                Admin
              </Button>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Create Course Button for Instructors */}
                {isInstructor && (
                  <Button 
                    onClick={() => navigate('/instructor/courses/new')}
                    className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Course
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10 border-2 border-gray-200">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2" align="end">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 truncate">{user.email}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {userRole || 'Student'}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="py-2">
                      <User className="mr-3 h-4 w-4" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-courses')} className="py-2">
                      <BookOpen className="mr-3 h-4 w-4" />
                      My Courses
                    </DropdownMenuItem>
                    {(hasPermission('view_all_analytics') || hasPermission('view_student_progress')) && (
                      <DropdownMenuItem onClick={() => navigate('/analytics')} className="py-2">
                        <TrendingUp className="mr-3 h-4 w-4" />
                        Learning Analytics
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem onClick={signOut} className="py-2 text-red-600 focus:text-red-600">
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={() => navigate('/courses')}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Explore Courses
                  </DropdownMenuItem>
                  {(hasPermission('view_all_analytics') || hasPermission('view_student_progress')) && (
                    <DropdownMenuItem onClick={() => navigate('/analytics')}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Analytics
                    </DropdownMenuItem>
                  )}
                  {isInstructor && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/instructor/dashboard')}>
                        Instructor Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/courses/new')}>
                        Create Course
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
