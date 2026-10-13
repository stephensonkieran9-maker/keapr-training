import Link from "next/link";
import { Icon } from "./Icons";
import type { LessonStep } from "@/lib/types";

export function LessonSteps({
  courseTitle,
  steps,
  passMarkPercent,
  requiredWatchPercent,
}: {
  courseTitle: string;
  steps: LessonStep[];
  passMarkPercent: number;
  requiredWatchPercent: number;
}) {
  return (
    <section className="panel" aria-labelledby="steps-title">
      <div className="panel-head">
        <div>
          <div className="eyebrow"><b>Current course</b></div>
          <h2 id="steps-title">{courseTitle}</h2>
        </div>
        <div className="req">
          Watch {requiredWatchPercent}% of each video, then score at least {passMarkPercent}% on its quiz to unlock the next lesson.
        </div>
      </div>
      <ol className="steps">
        {steps.map((step) => (
          <Step key={step.lessonId} step={step} />
        ))}
      </ol>
    </section>
  );
}

function Step({ step }: { step: LessonStep }) {
  const href = `/lessons/${step.lessonId}`;

  if (step.state === "passed") {
    return (
      <li className="step done">
        <span className="st" aria-hidden="true"><Icon name="check" /></span>
        <div>
          <div className="n">Lesson {step.position} <span className="pill">Passed</span></div>
          <div className="t">{step.title}</div>
        </div>
        <div className="right">
          {step.bestScorePercent !== undefined && <span className="score">Best score {step.bestScorePercent}%</span>}
          <Link className="link" href={href}>Review</Link>
        </div>
      </li>
    );
  }

  if (step.state === "available") {
    return (
      <li className="step current">
        <span className="st" aria-hidden="true"><Icon name="play" /></span>
        <div>
          <div className="n">Lesson {step.position} <span className="pill cur">Available</span></div>
          <div className="t">{step.title}</div>
        </div>
        <div className="right">
          {step.estimatedMinutes && <span style={{ color: "var(--muted)" }}>About {step.estimatedMinutes} min</span>}
          <Link className="btn btn-primary btn-sm" href={href}>Resume</Link>
        </div>
      </li>
    );
  }

  return (
    <li className="step locked">
      <span className="st" aria-hidden="true"><Icon name="lock" /></span>
      <div>
        <div className="n">Lesson {step.position} · Locked</div>
        <div className="t">{step.title}</div>
      </div>
      <div className="right">
        <span className="why"><Icon name="info" />{step.lockedReason ?? "Pass the previous quiz to unlock"}</span>
      </div>
    </li>
  );
}
