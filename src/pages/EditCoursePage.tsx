import React from 'react';
import EditCourseForm from '@/components/courses/EditCourseForm';

const EditCoursePage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Course</h1>
      <EditCourseForm />
    </div>
  );
};

export default EditCoursePage;
