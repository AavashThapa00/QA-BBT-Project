"use client";

import { useEffect, useRef } from "react";
import { MdBugReport } from "react-icons/md";
import gsap from "gsap";

export function AuthBrandingSection() {
  return (
    <section className="relative hidden overflow-hidden border-r border-(--border-color) px-12 py-14 lg:flex lg:items-center lg:justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(59,130,246,0.2),transparent_38%),radial-gradient(circle_at_78%_72%,rgba(34,211,238,0.16),transparent_40%)]" />

      {/* Floating background orbs */}
      <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-(--primary-color)/8 blur-3xl" />
      <div className="absolute right-20 bottom-32 h-40 w-40 rounded-full bg-(--accent-color)/6 blur-3xl" />
      <div className="absolute -left-16 bottom-10 h-28 w-28 rounded-full bg-(--primary-color)/5 blur-2xl" />

      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl bg-(--primary-color)/12 p-4 ring-1 ring-(--primary-color)/20">
            <MdBugReport className="h-12 w-12 text-(--primary-color)" />
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-(--heading-color)">
          IssueFixu
        </h2>

        <p className="mt-4 text-sm leading-relaxed text-(--muted-color)">
          Track, manage & resolve issues with ease
        </p>
      </div>
    </section>
  );
}
