import { PrismaClient, Role, Semester, Gender, PaymentType, PaymentStatus, EnrollmentStatus } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create Departments
  const csDept = await prisma.department.create({
    data: {
      name: 'Computer Science',
      code: 'CS',
      description: 'Department of Computer Science',
    },
  });

  const mathDept = await prisma.department.create({
    data: {
      name: 'Mathematics',
      code: 'MATH',
      description: 'Department of Mathematics',
    },
  });

  const engDept = await prisma.department.create({
    data: {
      name: 'English',
      code: 'ENG',
      description: 'Department of English',
    },
  });

  // Create Users (Admin, Faculty, Students)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@university.edu',
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const facultyUser1 = await prisma.user.create({
    data: {
      email: 'john.smith@university.edu',
      role: Role.FACULTY,
      isVerified: true,
    },
  });

  const facultyUser2 = await prisma.user.create({
    data: {
      email: 'sarah.johnson@university.edu',
      role: Role.FACULTY,
      isVerified: true,
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      email: 'mike.wilson@student.university.edu',
      role: Role.STUDENT,
      isVerified: true,
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'emily.davis@student.university.edu',
      role: Role.STUDENT,
      isVerified: true,
    },
  });

  // Create Faculty
  const faculty1 = await prisma.faculty.create({
    data: {
      userId: facultyUser1.id,
      employeeId: 'FAC001',
      firstName: 'John',
      lastName: 'Smith',
      departmentId: csDept.id,
      hireDate: new Date('2020-01-15'),
      title: 'Professor',
      office: 'CS-101',
    },
  });

  const faculty2 = await prisma.faculty.create({
    data: {
      userId: facultyUser2.id,
      employeeId: 'FAC002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      departmentId: mathDept.id,
      hireDate: new Date('2019-08-20'),
      title: 'Associate Professor',
      office: 'MATH-201',
    },
  });

  // Create Students
  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      studentId: 'STU001',
      firstName: 'Mike',
      lastName: 'Wilson',
      gender: Gender.MALE,
      dateOfBirth: new Date('2000-05-15'),
      departmentId: csDept.id,
      enrollmentYear: 2023,
      gpa: 3.5,
      creditsEarned: 45,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      studentId: 'STU002',
      firstName: 'Emily',
      lastName: 'Davis',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('2001-08-22'),
      departmentId: csDept.id,
      enrollmentYear: 2023,
      gpa: 3.8,
      creditsEarned: 52,
    },
  });

  // Create Courses
  const course1 = await prisma.course.create({
    data: {
      name: 'Introduction to Programming',
      code: 'CS101',
      description: 'Basic programming concepts using TypeScript',
      credits: 3,
      departmentId: csDept.id,
      prerequisites: [],
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Data Structures',
      code: 'CS201',
      description: 'Fundamental data structures and algorithms',
      credits: 4,
      departmentId: csDept.id,
      prerequisites: ['CS101'],
    },
  });

  const course3 = await prisma.course.create({
    data: {
      name: 'Calculus I',
      code: 'MATH101',
      description: 'Introduction to calculus',
      credits: 4,
      departmentId: mathDept.id,
      prerequisites: [],
    },
  });

  // Create Sections
  const section1 = await prisma.section.create({
    data: {
      courseId: course1.id,
      facultyId: faculty1.id,
      semester: Semester.FALL,
      year: 2025,
      sectionNumber: '001',
      capacity: 30,
      enrolled: 2,
      room: 'CS-301',
      schedule: 'Mon/Wed 10:00-11:30',
    },
  });

  const section2 = await prisma.section.create({
    data: {
      courseId: course3.id,
      facultyId: faculty2.id,
      semester: Semester.FALL,
      year: 2025,
      sectionNumber: '001',
      capacity: 35,
      enrolled: 2,
      room: 'MATH-101',
      schedule: 'Tue/Thu 09:00-10:30',
    },
  });

  // Create Enrollments
  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      sectionId: section1.id,
      status: EnrollmentStatus.ENROLLED,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      sectionId: section1.id,
      status: EnrollmentStatus.ENROLLED,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      sectionId: section2.id,
      status: EnrollmentStatus.ENROLLED,
    },
  });

  // Create Payments
  await prisma.payment.create({
    data: {
      studentId: student1.id,
      amount: 1500.00,
      type: PaymentType.TUITION,
      status: PaymentStatus.COMPLETED,
      description: 'Fall 2025 Tuition',
      paidAt: new Date('2025-08-15'),
    },
  });

  await prisma.payment.create({
    data: {
      studentId: student2.id,
      amount: 1500.00,
      type: PaymentType.TUITION,
      status: PaymentStatus.PENDING,
      description: 'Fall 2025 Tuition',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
