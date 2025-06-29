import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, User, LogOut, Plus, BookOpen, BarChart3, Users, TrendingUp } from 'lucide-react';
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
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="p-2 bg-blue-600 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">LearnHub</h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/courses')}
            className="text-gray-700 hover:text-blue-600"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </Button>
          
          {(hasPermission('view_all_analytics') || hasPermission('view_student_progress')) && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/analytics')}
              className="text-gray-700 hover:text-blue-600"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          )}
          
          {isInstructor && (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/instructor/dashboard')}
                className="text-gray-700 hover:text-blue-600"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/instructor/courses/new')}
                className="text-gray-700 hover:text-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </>
          )}

          {isAdmin && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/dashboard')}
              className="text-gray-700 hover:text-blue-600"
            >
              <Users className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {userRole || 'Student'}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-courses')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  My Courses
                </DropdownMenuItem>
                {(hasPermission('view_all_analytics') || hasPermission('view_student_progress')) && (
                  <DropdownMenuItem onClick={() => navigate('/analytics')}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Learning Analytics
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;