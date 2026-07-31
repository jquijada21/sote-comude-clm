"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useDynamicTitle } from "@/components/(base)/layout/useDynamicTitle";
import { cn } from "@/lib/utils";
import AnimacionLogoTrifinio from "./AnimacionLogoTrifinio";
import { createPortal } from "react-dom";

interface LogoTrifinioLoginProps {
  backgroundEffect?: "blur" | "glow" | "none";
  textClass?: string;
}

export default function LogoTrifinioLogin({
  backgroundEffect = "none",
  textClass = "text-azul-trifinio dark:text-white",
}: LogoTrifinioLoginProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dynamicTitle = useDynamicTitle();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullScreen(true);
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -5 },
    visible: {
      opacity: 1, scale: 1, rotate: 0,
      transition: { type: "spring" as const, stiffness: 50, damping: 16, duration: 2.4 },
    },
  };

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1, x: 0,
      transition: { type: "spring" as const, stiffness: 40, damping: 18, duration: 1.3 },
    },
  };

  const sloganVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: "spring" as const, stiffness: 50, damping: 16, duration: 1.1 },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1.2, ease: "easeInOut" as const },
    },
  };

  return (
    <>
      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.96 }}
        className="relative select-none cursor-pointer flex items-center justify-center w-full mx-auto overflow-hidden"
        initial="hidden"
        animate="visible"
      >
        {backgroundEffect === "blur" && (
          <div className="absolute inset-0 bg-white/55 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 -z-10 shadow-xl rounded-2xl" />
        )}

        {backgroundEffect === "glow" && (
          <div className="absolute inset-x-[-20%] inset-y-[-10%] bg-white/50 dark:bg-transparent blur-[60px] -z-10 rounded-[100px]" />
        )}

        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <motion.div variants={logoVariants} className="shrink-0">
            <Image
              src="/sote/logo.png"
              alt="COMUDE Concepción Las Minas"
              width={100}
              height={100}
              className="w-[92px] md:w-[100px] h-auto object-contain"
              priority
            />
          </motion.div>

          <motion.div
            variants={textContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center text-center relative"
          >
            <motion.div
              variants={lineVariants}
              className="w-[105%] h-[2px] mt-4 bg-azul-trifinio dark:bg-white origin-center"
            />

            <motion.p
              variants={sloganVariants}
              className={cn("font-bold italic mt-2 leading-tight", textClass)}
              style={{ fontFamily: "Arial, sans-serif", fontSize: "clamp(0.85rem, 1.8vw, 1.6rem)" }}
            >
              {dynamicTitle}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {mounted && createPortal(
        <AnimacionLogoTrifinio isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />,
        document.body
      )}
    </>
  );
}
