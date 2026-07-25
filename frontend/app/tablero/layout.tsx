import React from 'react';

export const metadata = {
  title: "Tablero | Trello Clon",
  description: "Vista interactiva de tablero Kanban",
};

export default function TableroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col">
      {children}
    </div>
  );
}
