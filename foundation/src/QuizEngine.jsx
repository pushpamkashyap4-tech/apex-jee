import React from "react";
import { ClipboardCheck } from "lucide-react";
import ModulePlaceholder from "./ModulePlaceholder.jsx";

export default function QuizEngine({ count = 0 }) {
  return (
    <ModulePlaceholder
      icon={ClipboardCheck}
      title="Quizzes are coming in a later part"
      description="Quiz records are loaded and filtered with the shared app state. The test-taking interface is intentionally not implemented in Part 1."
      countLabel={`${count} quiz${count === 1 ? "" : "zes"} available in the selected data`}
    />
  );
}
