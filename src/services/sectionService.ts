import { prisma } from "../config/database.js";

export class SectionService {
  static async getAvailable() {
    const sections = await prisma.section.findMany({
      where: {
        enrolled: { lt: prisma.section.fields.capacity },
      },
      include: {
        course: { select: { id: true, name: true, code: true, credits: true } },
        faculty: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ year: "desc" }, { semester: "asc" }],
    });

    return sections;
  }

  static async getById(id: string) {
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true, credits: true } },
        faculty: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return section;
  }
}
