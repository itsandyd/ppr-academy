const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixInstructorIds() {
  console.log('🔧 Fixing instructor IDs...');
  
  try {
    // Use raw SQL to update courses
    const result = await prisma.$executeRaw`UPDATE Course SET instructorId = userId WHERE instructorId IS NULL`;
    
    console.log(`✅ Updated courses with raw SQL`);
    console.log('✅ All courses now have instructorId set');
    
    // Verify the fix
    const coursesWithoutInstructor = await prisma.course.count({
      where: {
        instructorId: null,
      },
    });
    
    console.log(`📊 Courses without instructor: ${coursesWithoutInstructor}`);
    
  } catch (error) {
    console.error('❌ Error fixing instructor IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInstructorIds(); 