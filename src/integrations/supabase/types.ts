export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          ai_response: string
          context: Json | null
          course_id: string | null
          created_at: string
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          response_time_ms: number | null
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          context?: Json | null
          course_id?: string | null
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          response_time_ms?: number | null
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          context?: Json | null
          course_id?: string | null
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          response_time_ms?: number | null
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      ai_usage_analytics: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          learning_outcomes_achieved: string[] | null
          satisfaction_score: number | null
          session_duration_minutes: number | null
          session_id: string
          topics_discussed: string[] | null
          total_messages: number | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          learning_outcomes_achieved?: string[] | null
          satisfaction_score?: number | null
          session_duration_minutes?: number | null
          session_id: string
          topics_discussed?: string[] | null
          total_messages?: number | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          learning_outcomes_achieved?: string[] | null
          satisfaction_score?: number | null
          session_duration_minutes?: number | null
          session_id?: string
          topics_discussed?: string[] | null
          total_messages?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_analytics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_analytics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_urls: string[] | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_urls?: string[] | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          max_score: number | null
          module_id: string | null
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          module_id?: string | null
          order_index: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          module_id?: string | null
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string
          css_styles: string | null
          html_content: string
          id: string
          instructor_id: string | null
          is_default: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          css_styles?: string | null
          html_content: string
          id?: string
          instructor_id?: string | null
          is_default?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          css_styles?: string | null
          html_content?: string
          id?: string
          instructor_id?: string | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_data: Json | null
          certificate_url: string | null
          course_id: string
          id: string
          issued_at: string
          student_id: string
          template_id: string | null
        }
        Insert: {
          certificate_data?: Json | null
          certificate_url?: string | null
          course_id: string
          id?: string
          issued_at?: string
          student_id: string
          template_id?: string | null
        }
        Update: {
          certificate_data?: Json | null
          certificate_url?: string | null
          course_id?: string
          id?: string
          issued_at?: string
          student_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      content_schedule: {
        Row: {
          content_id: string
          course_id: string
          created_at: string
          id: string
          unlock_after_content_id: string | null
          unlock_after_days: number | null
        }
        Insert: {
          content_id: string
          course_id: string
          created_at?: string
          id?: string
          unlock_after_content_id?: string | null
          unlock_after_days?: number | null
        }
        Update: {
          content_id?: string
          course_id?: string
          created_at?: string
          id?: string
          unlock_after_content_id?: string | null
          unlock_after_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_schedule_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "content_schedule_unlock_after_content_id_fkey"
            columns: ["unlock_after_content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
        ]
      }
      course_content: {
        Row: {
          content_type: string
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          order_index: number
          section_id: string | null
          text_content: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content_type: string
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          section_id?: string | null
          text_content?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          section_id?: string | null
          text_content?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_content_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_purchases: {
        Row: {
          amount: number | null
          course_id: string
          currency: string | null
          id: string
          instructor_revenue: number | null
          payment_status: string | null
          payout_date: string | null
          payout_processed: boolean | null
          platform_fee: number | null
          purchase_type: string
          purchased_at: string
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          course_id: string
          currency?: string | null
          id?: string
          instructor_revenue?: number | null
          payment_status?: string | null
          payout_date?: string | null
          payout_processed?: boolean | null
          platform_fee?: number | null
          purchase_type: string
          purchased_at?: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          course_id?: string
          currency?: string | null
          id?: string
          instructor_revenue?: number | null
          payment_status?: string | null
          payout_date?: string | null
          payout_processed?: boolean | null
          platform_fee?: number | null
          purchase_type?: string
          purchased_at?: string
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      courses: {
        Row: {
          ai_assistant_enabled: boolean | null
          ai_assistant_settings: Json | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          instructor_id: string
          is_published: boolean | null
          level: string | null
          price: number | null
          short_description: string | null
          slug: string
          syllabus: Json | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_assistant_enabled?: boolean | null
          ai_assistant_settings?: Json | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id: string
          is_published?: boolean | null
          level?: string | null
          price?: number | null
          short_description?: string | null
          slug: string
          syllabus?: Json | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_assistant_enabled?: boolean | null
          ai_assistant_settings?: Json | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_id?: string
          is_published?: boolean | null
          level?: string | null
          price?: number | null
          short_description?: string | null
          slug?: string
          syllabus?: Json | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_published: boolean | null
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      discussions: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          lesson_id: string | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "discussions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number | null
          student_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          student_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      learning_preferences: {
        Row: {
          ai_assistance_level: string | null
          difficulty_preference: string | null
          explanation_preference: string | null
          id: string
          interaction_style: string | null
          learning_style: string | null
          preferred_languages: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_assistance_level?: string | null
          difficulty_preference?: string | null
          explanation_preference?: string | null
          id?: string
          interaction_style?: string | null
          learning_style?: string | null
          preferred_languages?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_assistance_level?: string | null
          difficulty_preference?: string | null
          explanation_preference?: string | null
          id?: string
          interaction_style?: string | null
          learning_style?: string | null
          preferred_languages?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          student_id: string
          watched_duration_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          student_id: string
          watched_duration_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
          watched_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          module_id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          module_id: string
          order_index: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          module_id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          graded_at: string | null
          id: string
          max_score: number | null
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          answers: Json
          graded_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          answers?: Json
          graded_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          id: string
          options: Json | null
          order_index: number
          points: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number | null
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          max_attempts: number | null
          order_index: number
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          order_index?: number
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          max_attempts?: number | null
          order_index?: number
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission"]
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      sections: {
        Row: {
          course_id: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          course_id?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          site_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          completed_at: string | null
          content_id: string
          course_id: string
          created_at: string
          id: string
          progress_percentage: number | null
          time_spent_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content_id: string
          course_id: string
          created_at?: string
          id?: string
          progress_percentage?: number | null
          time_spent_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content_id?: string
          course_id?: string
          created_at?: string
          id?: string
          progress_percentage?: number | null
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "course_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_assistant_analytics: {
        Row: {
          avg_rating: number | null
          avg_response_time: number | null
          course_id: string | null
          course_title: string | null
          date: string | null
          positive_feedback_count: number | null
          total_conversations: number | null
          unique_users: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_progress_analytics: {
        Row: {
          average_progress: number | null
          completed_content: number | null
          course_id: string | null
          last_activity: string | null
          total_content_accessed: number | null
          total_time_spent: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "instructor_analytics"
            referencedColumns: ["course_id"]
          },
        ]
      }
      instructor_analytics: {
        Row: {
          average_rating: number | null
          certificates_issued: number | null
          course_id: string | null
          course_title: string | null
          instructor_id: string | null
          instructor_revenue: number | null
          paid_students: number | null
          rating_count: number | null
          total_revenue: number | null
          total_students: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_ai_conversation_context: {
        Args: { p_user_id: string; p_course_id?: string; p_limit?: number }
        Returns: {
          user_message: string
          ai_response: string
          created_at: string
        }[]
      }
      get_unlocked_content: {
        Args: { p_user_id: string; p_course_id: string }
        Returns: {
          content_id: string
          title: string
          content_type: string
          order_index: number
          is_unlocked: boolean
          unlock_date: string
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_ai_assistant_enabled: {
        Args: { p_course_id: string }
        Returns: boolean
      }
      is_content_unlocked: {
        Args: { p_content_id: string; p_user_id: string; p_course_id: string }
        Returns: boolean
      }
      track_ai_usage: {
        Args: {
          p_user_id: string
          p_course_id: string
          p_session_id: string
          p_message_count?: number
        }
        Returns: undefined
      }
      user_has_permission: {
        Args: {
          _user_id: string
          _permission: Database["public"]["Enums"]["permission"]
        }
        Returns: boolean
      }
    }
    Enums: {
      permission:
        | "manage_users"
        | "manage_platform_settings"
        | "view_all_analytics"
        | "manage_subscriptions"
        | "moderate_content"
        | "create_courses"
        | "manage_own_courses"
        | "view_student_progress"
        | "grade_assignments"
        | "issue_certificates"
        | "manage_discussions"
        | "view_own_revenue"
        | "customize_landing_pages"
        | "enroll_courses"
        | "access_content"
        | "submit_assignments"
        | "download_certificates"
        | "participate_discussions"
        | "rate_courses"
      user_role: "student" | "instructor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      permission: [
        "manage_users",
        "manage_platform_settings",
        "view_all_analytics",
        "manage_subscriptions",
        "moderate_content",
        "create_courses",
        "manage_own_courses",
        "view_student_progress",
        "grade_assignments",
        "issue_certificates",
        "manage_discussions",
        "view_own_revenue",
        "customize_landing_pages",
        "enroll_courses",
        "access_content",
        "submit_assignments",
        "download_certificates",
        "participate_discussions",
        "rate_courses",
      ],
      user_role: ["student", "instructor", "admin"],
    },
  },
} as const
