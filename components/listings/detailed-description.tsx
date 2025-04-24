"use client";

import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import Markdown from "react-markdown";

interface DetailedDescriptionProps {
  longDescription: string | null;
}

export function DetailedDescription({ longDescription }: DetailedDescriptionProps) {
  if (!longDescription) return null;
  
  return (
    <motion.div 
      className="mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Separator className="my-6" />
      <h2 className="text-2xl font-semibold mb-4">Detailed Description</h2>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <Markdown>{longDescription}</Markdown>
      </div>
    </motion.div>
  );
} 