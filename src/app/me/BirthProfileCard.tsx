"use client";

import { useRouter } from "next/navigation";
import { BirthProfileForm } from "@/components/TodayCorrespondence";

export default function BirthProfileCard({ profile }: {
  profile: {
    birthDate: string | null;
    birthTime: string | null;
    birthLocation: string | null;
  } | null;
}) {
  const router = useRouter();
  const initial = profile?.birthDate ? {
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    unknownTime: !profile.birthTime
  } : null;

  return (
    <div id="birth-profile" className="scroll-mt-24">
      <BirthProfileForm initial={initial} context="profile" onSaved={() => router.refresh()} />
    </div>
  );
}
