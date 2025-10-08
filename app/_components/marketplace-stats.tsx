"use client";

import { FC } from "react";
import { Users, BookOpen, Package, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

interface MarketplaceStatsProps {
  totalCreators: number;
  totalCourses: number;
  totalProducts: number;
  totalStudents: number;
}

export const MarketplaceStats: FC<MarketplaceStatsProps> = ({
  totalCreators,
  totalCourses,
  totalProducts,
  totalStudents,
}) => {
  const stats = [
    {
      icon: Users,
      label: "Active Creators",
      value: `${totalCreators}+`,
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: BookOpen,
      label: "Courses Available",
      value: `${totalCourses}+`,
      color: "from-green-500 to-green-600",
    },
    {
      icon: Package,
      label: "Digital Products",
      value: `${totalProducts}+`,
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: GraduationCap,
      label: "Students Learning",
      value: `${totalStudents}+`,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-muted/40">
      <div className="mx-auto w-full max-w-[1140px] px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center space-y-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex justify-center">
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

