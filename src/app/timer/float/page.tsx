"use client";

import { FloatContent } from "@/components/timer/float-content";

export default function FloatPage() {
  return <FloatContent onClose={() => window.close()} />;
}
