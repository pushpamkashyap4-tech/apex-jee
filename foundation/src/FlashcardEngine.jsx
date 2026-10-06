import React from "react";
import { BookOpen } from "lucide-react";
import ModulePlaceholder from "./ModulePlaceholder.jsx";

export default function FlashcardEngine({ count = 0 }) {
  return (
    <ModulePlaceholder
      icon={BookOpen}
      title="Flashcards are coming in a later part"
      description="Topic and flashcard data already load from the local JSON database. The study-mode interface is intentionally not implemented in Part 1."
      countLabel={`${count} flashcard${count === 1 ? "" : "s"} available in the selected data`}
    />
  );
}
