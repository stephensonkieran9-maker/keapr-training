import Link from "next/link";
import { Icon } from "./Icons";
import { ProgressBar } from "./ProgressBar";
import { formatDuration, percent } from "@/lib/format";
import type { NextLesson } from "@/lib/types";

export function NextLessonHero({ lesson, isDemo }: { lesson: NextLesson; isDemo: boolean }) {
  const courseProgress = percent(lesson.lessonsPassed, lesson.lessonCount);
  const watched = percent(lesson.watchedSeconds, lesson.videoSeconds);
  const minutes = Math.round(lesson.videoSeconds / 60);
  const lessonHref = `/lessons/${lesson.lessonId}`;
  const reading = lesson.kind === "reading";

  return (
    <section className="hero" aria-labelledby="cur-title">
      <div>
        <div className="chips">
          <span className="chip live">{lesson.lessonsPassed > 0 || lesson.watchedSeconds > 0 ? "Next lesson · In progress" : "Next lesson · Ready to start"}</span>
          <span className="chip">Lesson {lesson.position} of {lesson.lessonCount}</span>
        </div>
        <h2 id="cur-title">{lesson.courseTitle}</h2>
        <h3>{lesson.lessonTitle}</h3>
        <p>{lesson.description}</p>
        <div className="meta">
          <span><Icon name="list" />Lesson {lesson.position} of {lesson.lessonCount}</span>
          <span><Icon name="clock" />{minutes}-minute {reading ? "read" : "video"}</span>
          <span><Icon name="circle-check" />{lesson.lessonsPassed} of {lesson.lessonCount} lessons passed</span>
        </div>
        <ProgressBar label="Course progress" value={courseProgress} />
        <div className="actions">
          <Link className="btn btn-primary" href={lessonHref}>
            Continue lesson
            <Icon name="arrow" />
          </Link>
          <Link className="btn btn-ghost" href={`${lessonHref}#notes`}>
            <Icon name="book" />
            Lesson notes
          </Link>
        </div>
      </div>

      <div className="video" role="img" aria-label={reading ? `Reading for lesson ${lesson.position}` : `Video preview for lesson ${lesson.position}`}>
        <span className="tag">{reading ? "Reading" : isDemo ? "Demo video" : "Lesson video"}</span>
        <span className="dur">{formatDuration(lesson.videoSeconds)}</span>
        <Link className="play" href={lessonHref} aria-label={reading ? `Open lesson ${lesson.position}` : `Play lesson ${lesson.position} video`}>
          <Icon name="play" />
        </Link>
        <div className="cap">
          <span>
            {reading
              ? lesson.watchedSeconds > 0 ? "Read" : `About ${minutes} min to read`
              : <>Watched {formatDuration(lesson.watchedSeconds)} of {formatDuration(lesson.videoSeconds)} · {watched}%</>}
          </span>
          <span>
            {reading
              ? lesson.hasQuiz === false ? "Confirm you've read it to finish" : "Confirm you've read it to unlock the quiz"
              : lesson.hasQuiz === false
              ? lesson.requiredWatchPercent >= 100 ? "Watch it all to finish" : `${lesson.requiredWatchPercent}% to finish`
              : `${lesson.requiredWatchPercent}% needed for quiz`}
          </span>
        </div>
      </div>
    </section>
  );
}
