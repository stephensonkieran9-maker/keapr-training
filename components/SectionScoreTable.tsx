import type { SectionScore } from "@/lib/quiz-sections";

/** "Score by section" table for quizzes split into sections. */
export function SectionScoreTable({ sections, collapsible }: { sections: SectionScore[]; collapsible?: boolean }) {
  const table = (
    <table>
        <thead>
          <tr><th scope="col">Section</th><th scope="col">Correct</th><th scope="col">Score</th></tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.number}>
              <th scope="row">{s.number}. {s.name}</th>
              <td>{s.correct} of {s.total}</td>
              <td>{s.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
  );
  if (collapsible) {
    return (
      <details className="section-scores">
        <summary>Score by section</summary>
        {table}
      </details>
    );
  }
  return (
    <div className="section-scores">
      <h3>Score by section</h3>
      {table}
    </div>
  );
}
