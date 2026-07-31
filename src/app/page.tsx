"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { Suspense } from "react";
import LoginForm from "@/components/(base)/(auth)/login/LogIn";

export default function HomePage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/comude");
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
