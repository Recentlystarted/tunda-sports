"use client";

import RegistrationDispatcher from '@/components/registration/RegistrationDispatcher';

interface TournamentRegisterPageProps {
  params: {
    id: string;
  };
}

export default function TournamentRegisterPage({ params }: TournamentRegisterPageProps) {
  return <RegistrationDispatcher />;
}
