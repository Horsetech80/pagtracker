"use client";

import React from "react";
import { cn } from "../utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "text-only";
  showText?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-24 w-24"
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl", 
  xl: "text-4xl"
};

export function Logo({ 
  className, 
  size = "md", 
  variant = "default",
  showText = true,
  onClick 
}: LogoProps) {
  const logoElement = (
    <div 
      className={cn(
        "flex items-center gap-3 transition-opacity hover:opacity-80",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Logo Icon */}
      <div className={cn("relative", sizeMap[size])}>
        {variant === "white" ? (
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 120 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <rect width="120" height="120" rx="24" fill="white"/>
            <path d="M25 25 L25 95 L35 95 L35 65 L60 65 C75 65 85 55 85 45 C85 35 75 25 60 25 L25 25 Z M35 35 L60 35 C70 35 75 40 75 45 C75 50 70 55 60 55 L35 55 L35 35 Z" fill="#1a1a1a"/>
            <path d="M65 45 C75 45 85 55 85 65 C85 75 75 85 65 85" stroke="#1a1a1a" strokeWidth="4" fill="none"/>
            <path d="M75 70 L85 65 L75 60" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 120 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <rect width="120" height="120" rx="24" fill="#1a1a1a"/>
            <path d="M25 25 L25 95 L35 95 L35 65 L60 65 C75 65 85 55 85 45 C85 35 75 25 60 25 L25 25 Z M35 35 L60 35 C70 35 75 40 75 45 C75 50 70 55 60 55 L35 55 L35 35 Z" fill="#fbbf24"/>
            <path d="M65 45 C75 45 85 55 85 65 C85 75 75 85 65 85" stroke="#fbbf24" strokeWidth="4" fill="none"/>
            <path d="M75 70 L85 65 L75 60" stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Text Logo */}
      {showText && variant !== "text-only" && (
        <div className="flex flex-col">
          <h1 className={cn(
            "font-bold tracking-tight leading-none",
            textSizeMap[size],
            variant === "white" ? "text-white" : "text-gray-900 dark:text-white"
          )}>
            PAGTRACKER
          </h1>
          <span className={cn(
            "text-xs font-medium tracking-wide opacity-70",
            variant === "white" ? "text-gray-200" : "text-gray-600 dark:text-gray-400"
          )}>
            SISTEMA DE PAGAMENTOS
          </span>
        </div>
      )}

      {/* Text Only Variant */}
      {variant === "text-only" && (
        <h1 className={cn(
          "font-bold tracking-tight",
          textSizeMap[size],
          "text-gray-900 dark:text-white"
        )}>
          PAGTRACKER
        </h1>
      )}
    </div>
  );

  return logoElement;
}

// Variants específicos para casos comuns
export function LogoIcon({ size = "md", className }: Pick<LogoProps, "size" | "className">) {
  return <Logo size={size} showText={false} className={className} />;
}

export function LogoText({ size = "md", className }: Pick<LogoProps, "size" | "className">) {
  return <Logo size={size} variant="text-only" className={className} />;
}

export function LogoWhite({ size = "md", showText = true, className }: Pick<LogoProps, "size" | "showText" | "className">) {
  return <Logo size={size} variant="white" showText={showText} className={className} />;
} 