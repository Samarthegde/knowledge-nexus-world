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